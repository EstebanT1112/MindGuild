import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { CalendarClock, Plus } from 'lucide-react-native';
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
  type BattleQuestion,
  type AssignedQuizQuestion,
  type ValidationItem,
  type WeeklyQuizStatusResult,
  type WeeklyQuizAttempt,
  type WeeklyQuiz,
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
      const [roomData, configData, questionsData, statusData, validationData] = await Promise.all([
        fetchRoomDetails(accessToken, roomId),
        fetchBattleRoyaleConfig(accessToken, roomId),
        fetchRoomQuestions(accessToken, roomId),
        fetchWeeklyQuizStatus(accessToken, roomId),
        fetchWeeklyQuizValidationItems(accessToken, roomId),
      ]);

      setRoom(roomData);
      setWeeklyQuiz(configData.quiz);
      setQuestions(questionsData);
      setQuizStatus(statusData);
      setValidationItems(validationData.items);
      setValidationPhase(resolveValidationPhase(validationData.items));
      setValidationIndex(0);

      if (statusData.must_validate) {
        setMode('validation');
      } else if (mode === 'validation') {
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

      const result = await completeWeeklyQuiz(accessToken, attempt.attempt_id);

      if (result.must_validate && roomId) {
        const validationData = await fetchWeeklyQuizValidationItems(accessToken, roomId);
        setValidationItems(validationData.items);
        setValidationPhase(resolveValidationPhase(validationData.items));
        setValidationIndex(0);
        setMode('validation');
      } else {
        setMode('overview');
      }
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
      Alert.alert('Validacion resuelta', `Validadas: ${result.validated_questions}. Eliminadas: ${result.deleted_questions}.`);
      await loadData({ showLoading: false });
    } catch (error: any) {
      Alert.alert('No se pudo resolver', error.message ?? 'Intenta nuevamente.');
    } finally {
      setActionLoading(false);
    }
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
            <Text style={styles.statusCardText}>{quizStatus.status}</Text>
            <Text style={styles.statusCardText}>
              Respondidas: {quizStatus.answered_questions_count}/{quizStatus.assigned_questions_count}
            </Text>
            {quizStatus.reason && <Text style={styles.statusReason}>{quizStatus.reason}</Text>}
          </View>
        )}

        <Pressable
          style={[styles.startQuizBtn, (!quizStatus?.can_start || actionLoading) && styles.disabledBtn]}
          onPress={handleStartQuiz}
          disabled={!quizStatus?.can_start || actionLoading}
        >
          {actionLoading ? <ActivityIndicator color="white" /> : <Text style={styles.startQuizText}>Comenzar Quiz Semanal</Text>}
        </Pressable>

        {isOwner && (
          <Pressable
            style={[styles.resolveBtn, actionLoading && styles.disabledBtn]}
            onPress={handleResolve}
            disabled={actionLoading}
          >
            <Text style={styles.resolveText}>Generar resultados</Text>
          </Pressable>
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
  statusCard: { backgroundColor: '#1e293b', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#334155', marginTop: 12 },
  statusCardTitle: { color: 'white', fontWeight: 'bold', marginBottom: 6 },
  statusCardText: { color: '#94a3b8', fontSize: 13, marginTop: 3 },
  statusReason: { color: '#facc15', fontSize: 12, marginTop: 8, lineHeight: 18 },
  startQuizBtn: { backgroundColor: '#a855f7', height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  startQuizText: { color: 'white', fontWeight: '900', fontSize: 16 },
});
