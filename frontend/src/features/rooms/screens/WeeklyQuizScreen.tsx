import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { BarChart3, CalendarClock, Plus, Trash2, X } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { useAppDataStore } from '../../../store/appDataStore';
import { useAuthStore } from '../../../store/authStore';
import NewQuestionModal from '../components/NewQuestionModal';
import WeeklyQuizModal from '../components/WeeklyQuizModal';
import {
  fetchBattleRoyaleConfig,
  fetchRoomQuestions,
  fetchWeeklyQuizStatus,
  startWeeklyQuiz,
  submitWeeklyQuizAnswer,
  completeWeeklyQuiz,
  fetchWeeklyQuizValidationItems,
  voteWeeklyQuizItem,
  resolveWeeklyQuiz,
  fetchWeeklyQuizResult,
  resetWeeklyQuiz,
  deleteRoomQuestion,
  type BattleQuestion,
  type AssignedQuizQuestion,
  type ValidationItem,
  type WeeklyQuizStatusResult,
  type WeeklyQuizAttempt,
  type WeeklyQuiz,
  type WeeklyQuizResult,
} from '../services/battleRoyaleService';
import { fetchRoomDetails, type RoomDetails } from '../services/roomsService';

export default function WeeklyQuizScreen() {
  const route = useRoute<any>();
  const accessToken = useAuthStore(state => state.access_token);
  const currentUser = useAuthStore(state => state.user);
  const currentProfile = useAppDataStore(state => state.profile.data);
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [weeklyQuiz, setWeeklyQuiz] = useState<WeeklyQuiz | null>(null);
  const [quizStatus, setQuizStatus] = useState<WeeklyQuizStatusResult | null>(null);
  const [quizResult, setQuizResult] = useState<WeeklyQuizResult | null>(null);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [attempt, setAttempt] = useState<WeeklyQuizAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [openAnswer, setOpenAnswer] = useState('');
  const [validationItems, setValidationItems] = useState<ValidationItem[]>([]);
  const [validationPhase, setValidationPhase] = useState<'question' | 'response'>('question');
  const [validationIndex, setValidationIndex] = useState(0);
  const [mode, setMode] = useState<'overview' | 'answering' | 'validation'>('overview');
  const [configVisible, setConfigVisible] = useState(false);
  const [questionVisible, setQuestionVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const roomId = route.params?.roomId ? String(route.params.roomId) : null;
  const roomName = route.params?.roomName ? String(route.params.roomName) : 'Quiz semanal';

  useEffect(() => {
    loadData();
  }, [roomId, accessToken]);

  const loadData = async (options?: { showLoading?: boolean }) => {
    if (!accessToken || !roomId) return;

    if (options?.showLoading ?? true) setLoading(true);
    try {
      const [roomData, configData, questionsData, statusData, validationData, resultData] = await Promise.all([
        fetchRoomDetails(accessToken, roomId),
        fetchBattleRoyaleConfig(accessToken, roomId),
        fetchRoomQuestions(accessToken, roomId),
        fetchWeeklyQuizStatus(accessToken, roomId),
        fetchWeeklyQuizValidationItems(accessToken, roomId),
        fetchWeeklyQuizResult(accessToken, roomId),
      ]);

      setRoom(roomData);
      setWeeklyQuiz(configData.quiz);
      setQuestions(questionsData);
      setQuizStatus(statusData);
      setQuizResult(resultData);
      setValidationItems(validationData.items);
      setValidationPhase(resolveValidationPhase(validationData.items));
      setValidationIndex(0);

      if (mode === 'validation' && !statusData.must_validate) {
        setMode('overview');
      }
    } catch (error: any) {
      Alert.alert('Error de quiz', error.message ?? 'No se pudo cargar el quiz semanal.');
    } finally {
      if (options?.showLoading ?? true) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData({ showLoading: false });
    } finally {
      setRefreshing(false);
    }
  };

  const currentUserId = currentUser?.id ?? currentProfile?.id;
  const isOwner = Boolean(room && currentUserId === room.owner_id);
  const currentQuestion = attempt?.questions[currentQuestionIndex] ?? null;
  const currentValidationItems = validationItems.filter(item => item.type === validationPhase);
  const currentValidationItem = currentValidationItems[validationIndex] ?? currentValidationItems[0] ?? null;
  const hasCompletedQuiz = Boolean(quizStatus?.has_completed)
    || (Boolean(quizStatus?.assigned_questions_count) && quizStatus?.answered_questions_count === quizStatus?.assigned_questions_count);
  const proposedCount = quizStatus?.proposed_count ?? questions.length;
  const canStartQuiz = Boolean(quizStatus?.can_start && !hasCompletedQuiz);
  const canValidateQuiz = Boolean(quizStatus?.must_validate);
  // Agregamos una bandera para forzar la habilitación en la demo
const isDemoMode = true; // CAMBIÁ A 'false' PARA PRODUCCIÓN
const canResolveQuiz = Boolean(isOwner && (quizStatus?.can_resolve || isDemoMode));

  const handleStartQuiz = async () => {
    if (!accessToken || !roomId) return;

    setActionLoading(true);
    try {
      const quizAttempt = await startWeeklyQuiz(accessToken, roomId);
      setAttempt(quizAttempt);
      setCurrentQuestionIndex(0);
      setSelectedOptionId(null);
      setOpenAnswer('');
      setMode('answering');
    } catch (error: any) {
      Alert.alert('No se pudo iniciar', error.message ?? 'Intenta nuevamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!accessToken || !attempt || !currentQuestion) return;

    const payload = currentQuestion.type === 'multiple_choice'
      ? { question_id: currentQuestion.id, selected_option_id: selectedOptionId ?? undefined }
      : { question_id: currentQuestion.id, answer_text: openAnswer.trim() };

    if (currentQuestion.type === 'multiple_choice' && !payload.selected_option_id) {
      Alert.alert('Respuesta requerida', 'Selecciona una opcion.');
      return;
    }

    if (currentQuestion.type === 'open' && !payload.answer_text) {
      Alert.alert('Respuesta requerida', 'Escribi una respuesta.');
      return;
    }

    setActionLoading(true);
    try {
      await submitWeeklyQuizAnswer(accessToken, attempt.attempt_id, payload);

      if (currentQuestionIndex < attempt.questions.length - 1) {
        setCurrentQuestionIndex(index => index + 1);
        setSelectedOptionId(null);
        setOpenAnswer('');
        return;
      }

      await completeWeeklyQuiz(accessToken, attempt.attempt_id);
      setAttempt(null);
      setMode('overview');
      await loadData({ showLoading: false });
    } catch (error: any) {
      Alert.alert('No se pudo guardar', error.message ?? 'Intenta nuevamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVote = async (item: ValidationItem, vote: 'positive' | 'negative') => {
    if (!accessToken) return;

    setActionLoading(true);
    try {
      await voteWeeklyQuizItem(accessToken, {
        type: item.type,
        question_id: item.question_id,
        response_id: item.response_id,
        vote,
      });

      if (roomId) {
        const validationData = await fetchWeeklyQuizValidationItems(accessToken, roomId);
        setValidationItems(validationData.items);
        const nextPhase = resolveValidationPhase(validationData.items);
        setValidationPhase(nextPhase);
        setValidationIndex(0);

        if (validationData.items.length === 0) {
          setMode('overview');
          await loadData({ showLoading: false });
        }
      }
    } catch (error: any) {
      Alert.alert('No se pudo votar', error.message ?? 'Intenta nuevamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!accessToken || !roomId) return;

    setActionLoading(true);
    try {
      const result = await resolveWeeklyQuiz(accessToken, roomId);
      Alert.alert(
        'Resultados generados',
        `Preguntas validadas: ${result.validated_questions}. Preguntas rechazadas: ${result.rejected_questions}. Respuestas correctas: ${result.validated_answers}. Respuestas incorrectas: ${result.rejected_answers}.`
      );
      await loadData({ showLoading: false });
    } catch (error: any) {
      Alert.alert('No se pudo resolver', error.message ?? 'Intenta nuevamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetQuiz = () => {
    if (!accessToken || !roomId) return;

    Alert.alert(
      'Reiniciar cuestionario',
      'Se va a borrar el cuestionario semanal actual, sus preguntas, respuestas, votos y resultados. Despues vas a poder configurarlo nuevamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const result = await resetWeeklyQuiz(accessToken, roomId);
              setWeeklyQuiz(null);
              setQuizStatus(null);
              setQuizResult(null);
              setQuestions([]);
              setAttempt(null);
              setValidationItems([]);
              setMode('overview');
              Alert.alert('Cuestionario reiniciado', `Se eliminaron ${result.deleted_questions} preguntas del cuestionario anterior.`);
              await loadData({ showLoading: false });
              setConfigVisible(true);
            } catch (error: any) {
              Alert.alert('No se pudo reiniciar', error.message ?? 'Intenta nuevamente.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteQuestion = (question: BattleQuestion) => {
    if (!accessToken || !roomId) return;

    Alert.alert(
      'Eliminar pregunta',
      'La pregunta se va a borrar fisicamente si todavia no fue tomada por el quiz.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await deleteRoomQuestion(accessToken, roomId, question.id);
              await loadData({ showLoading: false });
            } catch (error: any) {
              Alert.alert('No se pudo eliminar', error.message ?? 'Intenta nuevamente.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenLayout title="QUIZ SEMANAL" type="rooms" icon={<CalendarClock color="#a855f7" size={22} />}>
        <View style={styles.loadingState}>
          <ActivityIndicator color="#a855f7" />
          <Text style={styles.loadingText}>Cargando quiz...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="QUIZ SEMANAL" type="rooms" icon={<CalendarClock color="#a855f7" size={22} />}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#a855f7"
            colors={['#a855f7']}
          />
        }
      >
        <Text style={styles.roomName}>{room?.name ?? roomName}</Text>

        {mode === 'answering' && attempt && currentQuestion ? (
          <View style={styles.flowCard}>
            <Text style={styles.flowLabel}>Pregunta {currentQuestionIndex + 1} de {attempt.questions.length}</Text>
            <Text style={styles.flowQuestion}>{currentQuestion.question_text}</Text>

            {currentQuestion.type === 'multiple_choice' ? (
              <View style={styles.answerOptions}>
                {currentQuestion.options.map(option => (
                  <Pressable
                    key={option.id}
                    style={[styles.answerOption, selectedOptionId === option.id && styles.answerOptionActive]}
                    onPress={() => setSelectedOptionId(option.id)}
                  >
                    <View style={[styles.answerRadio, selectedOptionId === option.id && styles.answerRadioActive]} />
                    <Text style={styles.answerOptionText}>{option.option_text}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <TextInput
                style={styles.answerInput}
                placeholder="Escribi tu respuesta..."
                placeholderTextColor="#64748b"
                multiline
                value={openAnswer}
                onChangeText={setOpenAnswer}
              />
            )}

            <Pressable style={[styles.primaryBtn, actionLoading && styles.disabledBtn]} onPress={handleSubmitAnswer} disabled={actionLoading}>
              {actionLoading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryBtnText}>{currentQuestionIndex === attempt.questions.length - 1 ? 'Finalizar e ir a validacion' : 'Guardar y continuar'}</Text>}
            </Pressable>
          </View>
        ) : null}

        {mode === 'validation' ? (
          <View style={styles.flowCard}>
            <Text style={styles.flowLabel}>Validacion Cuestionario Semanal</Text>
            <Text style={styles.validationPhaseText}>
              {validationPhase === 'question'
                ? 'Primero valida las preguntas propuestas.'
                : 'Ahora valida si las respuestas de tus companeros son correctas.'}
            </Text>
            {validationItems.length === 0 ? (
              <>
                <Text style={styles.emptyTitle}>No tenes items pendientes para validar</Text>
                <Text style={styles.emptyText}>Ya podes volver al uso normal de la sala.</Text>
              </>
            ) : currentValidationItem ? (
              <View key={`${currentValidationItem.type}-${currentValidationItem.response_id ?? currentValidationItem.question_id}`} style={styles.validationItem}>
                  <Text style={styles.questionMeta}>
                    {currentValidationItem.type === 'question' ? 'Pregunta propuesta' : 'Respuesta de companero'} {validationIndex + 1} de {currentValidationItems.length}
                  </Text>
                  <Text style={styles.flowQuestion}>{currentValidationItem.question_text}</Text>

                  {currentValidationItem.question_type === 'multiple_choice' && Boolean(currentValidationItem.options?.length) && (
                    <View style={styles.answerOptions}>
                      {currentValidationItem.options?.map(option => (
                        <View
                          key={option.id}
                          style={[styles.answerOption, option.is_correct && styles.validationCorrectOption]}
                        >
                          <View style={[styles.answerRadio, option.is_correct && styles.answerRadioActive]} />
                          <Text style={styles.answerOptionText}>{option.option_text}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {currentValidationItem.type === 'question' && currentValidationItem.question_type === 'open' && Boolean(currentValidationItem.expected_answer) && (
                    <View style={styles.validationAnswerBox}>
                      <Text style={styles.validationAnswerLabel}>Respuesta esperada cargada</Text>
                      <Text style={styles.validationAnswerText}>{currentValidationItem.expected_answer}</Text>
                    </View>
                  )}

                  {currentValidationItem.type === 'response' && Boolean(currentValidationItem.answer_text) && (
                    <>
                      {Boolean(currentValidationItem.expected_answer) && (
                        <View style={styles.validationAnswerBox}>
                          <Text style={styles.validationAnswerLabel}>Respuesta esperada</Text>
                          <Text style={styles.validationAnswerText}>{currentValidationItem.expected_answer}</Text>
                        </View>
                      )}
                      <View style={styles.validationAnswerBox}>
                        <Text style={styles.validationAnswerLabel}>Respuesta cargada por el usuario</Text>
                        <Text style={styles.validationAnswerText}>{currentValidationItem.answer_text}</Text>
                      </View>
                    </>
                  )}

                  <Text style={styles.validationAuthorText}>
                    {currentValidationItem.type === 'question'
                      ? `Autor: ${currentValidationItem.author?.username ?? 'usuario'}`
                      : `Respondio: ${currentValidationItem.responder?.username ?? 'usuario'}`}
                  </Text>
                  <View style={styles.voteRow}>
                    <Pressable style={[styles.voteBtn, styles.votePositive]} onPress={() => handleVote(currentValidationItem, 'positive')} disabled={actionLoading}>
                      <Text style={styles.voteText}>{currentValidationItem.type === 'response' ? 'Respondio bien' : 'Validar'}</Text>
                    </Pressable>
                    <Pressable style={[styles.voteBtn, styles.voteNegative]} onPress={() => handleVote(currentValidationItem, 'negative')} disabled={actionLoading}>
                      <Text style={styles.voteText}>{currentValidationItem.type === 'response' ? 'Respondio mal' : 'Rechazar'}</Text>
                    </Pressable>
                  </View>
                </View>
            ) : (
              <>
                <Text style={styles.emptyTitle}>No quedan items en esta fase</Text>
                <Text style={styles.emptyText}>Se esta actualizando la siguiente validacion.</Text>
              </>
            )}
          </View>
        ) : null}

        {mode === 'overview' ? (
          <>

        <Pressable style={styles.primaryBtn} onPress={() => setConfigVisible(true)}>
          <CalendarClock color="white" size={22} />
          <Text style={styles.primaryBtnText}>
            {weeklyQuiz ? 'Ver configuracion semanal' : 'Configurar cuestionario semanal'}
          </Text>
        </Pressable>

        {weeklyQuiz ? (
          <View style={styles.quizSummaryCard}>
            <Text style={styles.quizSummaryTitle}>{weeklyQuiz.title}</Text>
            <Text style={styles.quizSummaryText}>
              {formatWeekday(weeklyQuiz.weekday)} - {String(weeklyQuiz.start_time).slice(0, 5)} hs - {weeklyQuiz.duration_minutes} min
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{weeklyQuiz.status}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Sin cuestionario configurado</Text>
            <Text style={styles.emptyText}>
              {isOwner
                ? 'Configura el dia y horario recurrente para habilitar el quiz semanal.'
                : 'El owner todavia no configuro el cuestionario semanal.'}
            </Text>
          </View>
        )}

        {quizStatus && (
          <View style={styles.statusCard}>
            <Text style={styles.statusCardTitle}>Estado del quiz</Text>
            <View style={styles.statusGrid}>
              <View style={styles.statusMetric}>
                <Text style={styles.statusMetricValue}>{hasCompletedQuiz ? 'Si' : 'No'}</Text>
                <Text style={styles.statusMetricLabel}>Completado</Text>
              </View>
              <View style={styles.statusMetric}>
                <Text style={styles.statusMetricValue}>{quizStatus.can_start ? 'Si' : 'No'}</Text>
                <Text style={styles.statusMetricLabel}>Habilitado</Text>
              </View>
            </View>
            <Text style={styles.statusCardText}>Respondidas: {quizStatus.answered_questions_count}/{quizStatus.assigned_questions_count}</Text>
            <Text style={styles.statusCardText}>Propuestas: {proposedCount}</Text>
            {quizStatus.reason && <Text style={styles.statusReason}>{quizStatus.reason}</Text>}
          </View>
        )}

        {quizResult ? (
          <Pressable style={styles.resultOpenBtn} onPress={() => setResultVisible(true)}>
            <BarChart3 color="white" size={22} />
            <Text style={styles.primaryBtnText}>Ver resultados</Text>
          </Pressable>
        ) : hasCompletedQuiz ? (
          <View style={styles.pendingResultCard}>
            <Text style={styles.emptyTitle}>Resultado pendiente</Text>
            <Text style={styles.emptyText}>El resultado aparece cuando termine la validacion grupal y el owner lo genere.</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.startQuizBtn, (!canStartQuiz || actionLoading) && styles.disabledBtn]}
          onPress={handleStartQuiz}
          disabled={!canStartQuiz || actionLoading}
        >
          {actionLoading ? <ActivityIndicator color="white" /> : <Text style={styles.startQuizText}>Comenzar Quiz Semanal</Text>}
        </Pressable>

        {canValidateQuiz && (
          <Pressable style={styles.validateQuizBtn} onPress={() => setMode('validation')}>
            <Text style={styles.startQuizText}>Validacion de quiz</Text>
          </Pressable>
        )}

        {isOwner && (
          <>
            <Pressable
              style={[styles.resolveBtn, (!canResolveQuiz || actionLoading) && styles.disabledBtn]}
              onPress={handleResolve}
              disabled={!canResolveQuiz || actionLoading}
            >
              <Text style={styles.resolveText}>Generar resultados</Text>
            </Pressable>
            {quizStatus?.result_available_at && !canResolveQuiz ? (
              <Text style={styles.hintText}>Resultados disponibles desde: {formatDateTime(quizStatus.result_available_at)}</Text>
            ) : null}
            {weeklyQuiz ? (
              <Pressable
                style={[styles.resetBtn, (!quizResult || quizResult.status !== 'validated' || actionLoading) && styles.disabledBtn]}
                onPress={handleResetQuiz}
                disabled={!quizResult || quizResult.status !== 'validated' || actionLoading}
              >
                <Text style={styles.resetText}>Reiniciar cuestionario semanal</Text>
              </Pressable>
            ) : null}
          </>
        )}

        <Text style={styles.sectionLabel}>MIS PREGUNTAS PROPUESTAS</Text>
        <Pressable style={styles.newQuestionBtn} onPress={() => setQuestionVisible(true)}>
          <Plus color="white" size={22} />
          <Text style={styles.newQuestionText}>Nueva Pregunta</Text>
        </Pressable>
        <Text style={styles.hintText}>Solo ves tus preguntas propuestas. Quedan pendientes para la validacion grupal.</Text>

        {questions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Todavia no propusiste preguntas</Text>
            <Text style={styles.emptyText}>Podes cargar preguntas multiple choice o de desarrollo para esta sala.</Text>
          </View>
        ) : (
          questions.map(question => (
            <View style={styles.questionCard} key={question.id}>
              <Text style={styles.questionText}>{question.question_text}</Text>
              <Text style={styles.questionMeta}>
                {question.type === 'multiple_choice' ? 'Multiple choice' : 'Desarrollo'} - {question.author.username}
              </Text>

              {question.type === 'multiple_choice' && question.options.length > 0 && (
                <View style={styles.optionsPreview}>
                  {question.options.map(option => (
                    <Text key={option.id} style={[styles.optionPreviewText, option.is_correct && styles.correctOption]}>
                      {option.is_correct ? '[correcta] ' : '- '}
                      {option.option_text}
                    </Text>
                  ))}
                </View>
              )}

              {question.type === 'open' && Boolean(question.expected_answer) && (
                <Text style={styles.expectedPreview}>Respuesta esperada: {question.expected_answer}</Text>
              )}

              <View style={styles.questionFooter}>
                <View style={styles.statusBadge}><Text style={styles.statusText}>{question.status}</Text></View>
                <Text style={styles.weekText}>{question.week_year}</Text>
              </View>
              {['pending', 'draft'].includes(question.status) && (
                <Pressable
                  style={[styles.deleteQuestionBtn, actionLoading && styles.disabledBtn]}
                  onPress={() => handleDeleteQuestion(question)}
                  disabled={actionLoading}
                >
                  <Trash2 color="#fca5a5" size={16} />
                  <Text style={styles.deleteQuestionText}>Eliminar pregunta</Text>
                </Pressable>
              )}
            </View>
          ))
        )}
          </>
        ) : null}
      </ScrollView>

      <WeeklyQuizModal
        visible={configVisible}
        onClose={() => setConfigVisible(false)}
        accessToken={accessToken}
        roomId={roomId}
        quiz={weeklyQuiz}
        isOwner={isOwner}
        onSaved={setWeeklyQuiz}
      />
      <NewQuestionModal
        visible={questionVisible}
        onClose={() => setQuestionVisible(false)}
        accessToken={accessToken}
        roomId={roomId}
        onCreated={() => loadData({ showLoading: false })}
      />
      <Modal visible={resultVisible} transparent animationType="fade" onRequestClose={() => setResultVisible(false)}>
        <View style={styles.resultModalBackdrop}>
          <View style={styles.resultModal}>
            <View style={styles.resultModalHeader}>
              <Text style={styles.resultTitle}>Resultados del quiz</Text>
              <Pressable style={styles.resultCloseBtn} onPress={() => setResultVisible(false)}>
                <X color="#94a3b8" size={20} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {quizResult?.status === 'validated' && quizResult.summary ? (
                <>
                  <Text style={styles.resultSubtitle}>Resultado general</Text>
                  <View style={styles.resultGrid}>
                    <View style={styles.resultMetric}>
                      <Text style={styles.resultMetricValue}>{quizResult.summary.score}/{quizResult.summary.total_questions}</Text>
                      <Text style={styles.resultMetricLabel}>Puntaje</Text>
                    </View>
                    <View style={styles.resultMetric}>
                      <Text style={styles.resultMetricValue}>{quizResult.summary.accuracy_percentage}%</Text>
                      <Text style={styles.resultMetricLabel}>Acierto</Text>
                    </View>
                  </View>
                  <View style={styles.resultCounts}>
                    <Text style={styles.resultCorrect}>Respuestas aceptadas: {quizResult.summary.correct_count}</Text>
                    <Text style={styles.resultIncorrect}>Respuestas rechazadas: {quizResult.summary.incorrect_count}</Text>
                  </View>
                  <View style={styles.resultDetailCard}>
                    <Text style={styles.resultAnswer}>Preguntas propuestas aceptadas: {quizResult.proposed_questions.validated_count}</Text>
                    <Text style={styles.resultAnswer}>Preguntas propuestas rechazadas: {quizResult.proposed_questions.rejected_count ?? 0}</Text>
                  </View>

                  <Text style={styles.resultDetailTitle}>Preguntas respondidas</Text>
                  {quizResult.details.length === 0 ? (
                    <Text style={styles.emptyText}>No hay respuestas validadas para mostrar.</Text>
                  ) : quizResult.details.map(detail => (
                    <View key={detail.question_id} style={styles.resultDetailCard}>
                      <Text style={styles.resultQuestion}>{detail.question_text}</Text>
                      <Text style={styles.resultAnswer}>Tu respuesta: {detail.answer_text ?? 'Sin respuesta'}</Text>
                      <Text style={styles.resultExpected}>Esperada: {detail.expected_answer ?? 'No disponible'}</Text>
                      <Text style={[styles.resultStatus, detail.is_correct ? styles.resultStatusOk : styles.resultStatusBad]}>
                        {detail.is_correct ? 'Aceptada' : 'Rechazada'}
                      </Text>
                    </View>
                  ))}

                  <Text style={styles.resultDetailTitle}>Preguntas propuestas</Text>
                  {quizResult.proposed_questions.items.length === 0 ? (
                    <Text style={styles.emptyText}>No hay preguntas propuestas validadas o rechazadas para mostrar.</Text>
                  ) : quizResult.proposed_questions.items.map(item => (
                    <View key={item.question_id} style={styles.resultDetailCard}>
                      <Text style={styles.resultQuestion}>{item.question_text}</Text>
                      <Text style={[styles.resultStatus, item.status === 'validated' ? styles.resultStatusOk : styles.resultStatusBad]}>
                        {item.status === 'validated' ? 'Aceptada' : 'Rechazada'}
                      </Text>
                    </View>
                  ))}
                </>
              ) : (
                <View style={styles.pendingResultCard}>
                  <Text style={styles.emptyTitle}>Resultado pendiente</Text>
                  <Text style={styles.emptyText}>El resultado se muestra cuando termine la validacion grupal y el owner lo genere.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

function formatWeekday(weekday: string) {
  const labels: Record<string, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miercoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sabado',
    sunday: 'Domingo',
  };

  return labels[weekday] ?? weekday;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function resolveValidationPhase(items: ValidationItem[]): 'question' | 'response' {
  return items.some(item => item.type === 'question') ? 'question' : 'response';
}

const styles = StyleSheet.create({
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#94a3b8', fontWeight: 'bold' },
  scrollContent: { paddingBottom: 100, paddingVertical: 10 },
  roomName: { color: '#94a3b8', fontWeight: 'bold', marginBottom: 14 },
  primaryBtn: { backgroundColor: '#a855f7', padding: 18, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryBtnText: { color: 'white', fontWeight: '900', fontSize: 16 },
  quizSummaryCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#a855f744', marginTop: 12 },
  quizSummaryTitle: { color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 6 },
  quizSummaryText: { color: '#94a3b8', fontSize: 13, marginBottom: 10 },
  emptyCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#334155', marginTop: 12 },
  emptyTitle: { color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 6 },
  emptyText: { color: '#94a3b8', fontSize: 13, lineHeight: 19 },
  sectionLabel: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', marginTop: 25, marginBottom: 15 },
  newQuestionBtn: { backgroundColor: '#22c55e', padding: 18, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  newQuestionText: { color: 'white', fontWeight: '900', fontSize: 16 },
  hintText: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 10, marginBottom: 12 },
  questionCard: { backgroundColor: '#1e293b', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  questionText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 6 },
  questionMeta: { color: '#94a3b8', fontSize: 12, marginBottom: 12 },
  optionsPreview: { gap: 6, marginBottom: 14 },
  optionPreviewText: { color: '#94a3b8', fontSize: 13 },
  correctOption: { color: '#22c55e', fontWeight: 'bold' },
  expectedPreview: { color: '#94a3b8', fontSize: 13, lineHeight: 19, marginBottom: 14 },
  questionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deleteQuestionBtn: { height: 42, borderRadius: 14, borderWidth: 1, borderColor: '#7f1d1d', backgroundColor: '#450a0a55', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
  deleteQuestionText: { color: '#fca5a5', fontWeight: '900', fontSize: 13 },
  statusBadge: { backgroundColor: '#facc1515', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#facc1544' },
  statusText: { color: '#facc15', fontSize: 12, fontWeight: 'bold' },
  weekText: { color: '#64748b', fontSize: 12 },
  flowCard: { backgroundColor: '#1e293b', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#a855f744', marginTop: 12 },
  flowLabel: { color: '#a855f7', fontSize: 13, fontWeight: '900', marginBottom: 10 },
  flowQuestion: { color: 'white', fontSize: 18, fontWeight: 'bold', lineHeight: 25, marginBottom: 16 },
  answerOptions: { gap: 10, marginBottom: 18 },
  answerOption: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#334155', padding: 14 },
  answerOptionActive: { borderColor: '#a855f7', backgroundColor: '#2e1065' },
  validationCorrectOption: { borderColor: '#22c55e', backgroundColor: '#052e16' },
  answerRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#64748b' },
  answerRadioActive: { borderColor: '#a855f7', backgroundColor: '#a855f7' },
  answerOptionText: { color: 'white', fontSize: 15, flex: 1 },
  answerInput: { backgroundColor: '#0f172a', color: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#334155', padding: 14, minHeight: 130, textAlignVertical: 'top', marginBottom: 18 },
  disabledBtn: { opacity: 0.55 },
  validationItem: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#334155', padding: 14, marginTop: 12 },
  validationPhaseText: { color: '#94a3b8', fontSize: 13, lineHeight: 19, marginBottom: 8 },
  validationAnswerBox: { backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, borderColor: '#334155', padding: 14, marginBottom: 14 },
  validationAnswerLabel: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  validationAnswerText: { color: 'white', fontSize: 15, lineHeight: 21 },
  validationAuthorText: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  voteRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  voteBtn: { flex: 1, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  votePositive: { backgroundColor: '#16a34a' },
  voteNegative: { backgroundColor: '#dc2626' },
  voteText: { color: 'white', fontWeight: '900' },
  resolveBtn: { height: 48, borderRadius: 16, backgroundColor: '#facc15', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  resolveText: { color: '#111827', fontWeight: '900' },
  resetBtn: { height: 48, borderRadius: 16, backgroundColor: '#7f1d1d', alignItems: 'center', justifyContent: 'center', marginTop: 10, borderWidth: 1, borderColor: '#ef4444' },
  resetText: { color: 'white', fontWeight: '900' },
  statusCard: { backgroundColor: '#1e293b', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#334155', marginTop: 12 },
  statusCardTitle: { color: 'white', fontWeight: 'bold', marginBottom: 6 },
  statusGrid: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  statusMetric: { flex: 1, backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#334155', padding: 12 },
  statusMetricValue: { color: 'white', fontWeight: '900', fontSize: 18 },
  statusMetricLabel: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  statusCardText: { color: '#94a3b8', fontSize: 13, marginTop: 3 },
  statusReason: { color: '#facc15', fontSize: 12, marginTop: 8, lineHeight: 18 },
  startQuizBtn: { backgroundColor: '#a855f7', height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  validateQuizBtn: { backgroundColor: '#2563eb', height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  startQuizText: { color: 'white', fontWeight: '900', fontSize: 16 },
  resultOpenBtn: { backgroundColor: '#16a34a', padding: 18, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 },
  resultModalBackdrop: { flex: 1, backgroundColor: '#020617cc', justifyContent: 'center', padding: 20 },
  resultModal: { maxHeight: '86%', backgroundColor: '#0f172a', borderRadius: 24, borderWidth: 1, borderColor: '#334155', padding: 16 },
  resultModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  resultCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  resultCard: { backgroundColor: '#0f172a', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#22c55e55', marginTop: 12 },
  pendingResultCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#facc1544', marginTop: 12 },
  resultTitle: { color: 'white', fontWeight: '900', fontSize: 18, marginBottom: 6 },
  resultSubtitle: { color: '#94a3b8', fontSize: 13, lineHeight: 19, marginBottom: 14 },
  resultGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  resultMetric: { flex: 1, backgroundColor: '#1e293b', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#334155' },
  resultMetricValue: { color: 'white', fontWeight: '900', fontSize: 22 },
  resultMetricLabel: { color: '#94a3b8', fontSize: 12, marginTop: 3 },
  resultCounts: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  resultCorrect: { color: '#22c55e', fontWeight: 'bold' },
  resultIncorrect: { color: '#ef4444', fontWeight: 'bold' },
  resultDetailTitle: { color: '#94a3b8', fontWeight: '900', fontSize: 12, marginBottom: 8 },
  resultDetailCard: { backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, borderColor: '#334155', padding: 12, marginBottom: 8 },
  resultQuestion: { color: 'white', fontWeight: 'bold', marginBottom: 8 },
  resultAnswer: { color: '#cbd5e1', fontSize: 13, marginBottom: 4 },
  resultExpected: { color: '#94a3b8', fontSize: 13, marginBottom: 8 },
  resultStatus: { fontWeight: '900', fontSize: 12 },
  resultStatusOk: { color: '#22c55e' },
  resultStatusBad: { color: '#ef4444' },
});
