import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { BrainCircuit } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import {
  checkPracticeAnswer,
  generatePracticeQuiz,
  type PracticeQuestion,
} from '../services/battleRoyaleService';

type Feedback = {
  isCorrect?: boolean;
  correctOptionId?: string;
  correctOptionText?: string;
  expectedAnswer?: string;
};

export default function PracticeQuizScreen() {
  const route = useRoute<any>();
  const accessToken = useAuthStore((state) => state.access_token);
  const roomId = route.params?.roomId ? String(route.params.roomId) : null;
  const roomName = route.params?.roomName ? String(route.params.roomName) : 'Práctica';

  // 👇 Tema
  const { colors } = useThemeStore();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [openAnswer, setOpenAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  const currentQuestion = questions[currentIndex] ?? null;

  useEffect(() => {
    loadPractice();
  }, [roomId, accessToken]);

  const loadPractice = async () => {
    if (!accessToken || !roomId) return;

    setLoading(true);
    try {
      const result = await generatePracticeQuiz(accessToken, {
        room_id: roomId,
        limit: 10,
        types: ['multiple_choice', 'open'],
      });
      setQuestions(result.questions);
      setCurrentIndex(0);
      setSelectedOptionId(null);
      setOpenAnswer('');
      setFeedback(null);
      setCorrectCount(0);
      setAnsweredCount(0);
      setFinished(false);
    } catch (error: any) {
      Alert.alert('No se pudo cargar la práctica', error.message ?? 'Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAnswer = async () => {
    if (!accessToken || !currentQuestion) return;

    if (currentQuestion.type === 'multiple_choice' && !selectedOptionId) {
      Alert.alert('Respuesta requerida', 'Selecciona una opción.');
      return;
    }

    if (currentQuestion.type === 'open' && !openAnswer.trim()) {
      Alert.alert('Respuesta requerida', 'Escribí una respuesta.');
      return;
    }

    setActionLoading(true);
    try {
      const result = await checkPracticeAnswer(accessToken, {
        question_id: currentQuestion.id,
        selected_option_id: selectedOptionId ?? undefined,
        answer_text: currentQuestion.type === 'open' ? openAnswer.trim() : undefined,
      });

      const nextFeedback: Feedback = {
        isCorrect: result.is_correct,
        correctOptionId: result.correct_option_id,
        correctOptionText: result.correct_option_text,
        expectedAnswer: result.expected_answer,
      };

      setFeedback(nextFeedback);
      setAnsweredCount((count) => count + 1);

      if (result.is_correct) {
        setCorrectCount((count) => count + 1);
      }
    } catch (error: any) {
      Alert.alert('No se pudo corregir', error.message ?? 'Intenta nuevamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex >= questions.length - 1) {
      setFinished(true);
      return;
    }

    setCurrentIndex((index) => index + 1);
    setSelectedOptionId(null);
    setOpenAnswer('');
    setFeedback(null);
  };

  if (loading) {
    return (
      <ScreenLayout title="PRÁCTICA" type="rooms" icon={<BrainCircuit color={colors.accent} size={22} />}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Generando práctica...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="PRÁCTICA" type="rooms" icon={<BrainCircuit color={colors.accent} size={22} />}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.roomName}>{roomName}</Text>

        {questions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Sin preguntas validadas</Text>
            <Text style={styles.emptyText}>
              Todavía no hay preguntas aprobadas para practicar en esta sala.
            </Text>
            <Pressable style={styles.primaryBtn} onPress={loadPractice}>
              <Text style={styles.primaryText}>Actualizar</Text>
            </Pressable>
          </View>
        ) : finished ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Práctica finalizada</Text>
            <Text style={styles.resultValue}>
              {correctCount}/{answeredCount}
            </Text>
            <Text style={styles.resultText}>
              Correctas multiple choice. Las respuestas de desarrollo son de repaso y no se guardan.
            </Text>
            <Pressable style={styles.primaryBtn} onPress={loadPractice}>
              <Text style={styles.primaryText}>Generar otra práctica</Text>
            </Pressable>
          </View>
        ) : currentQuestion ? (
          <View style={styles.questionCard}>
            <Text style={styles.progressText}>
              Pregunta {currentIndex + 1} de {questions.length}
            </Text>
            <Text style={styles.questionText}>{currentQuestion.question_text}</Text>

            {currentQuestion.type === 'multiple_choice' ? (
              <View style={styles.options}>
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOptionId === option.id;
                  const isCorrect = feedback?.correctOptionId === option.id;

                  return (
                    <Pressable
                      key={option.id}
                      style={[
                        styles.option,
                        isSelected && styles.optionSelected,
                        feedback && isCorrect && styles.optionCorrect,
                        feedback && isSelected && !isCorrect && styles.optionWrong,
                      ]}
                      disabled={Boolean(feedback)}
                      onPress={() => setSelectedOptionId(option.id)}
                    >
                      <Text style={styles.optionText}>{option.option_text}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <TextInput
                style={styles.answerInput}
                placeholder="Escribí tu respuesta..."
                placeholderTextColor={colors.textMuted}
                multiline
                editable={!feedback}
                value={openAnswer}
                onChangeText={setOpenAnswer}
              />
            )}

            {feedback ? (
              <View style={styles.feedbackBox}>
                {currentQuestion.type === 'multiple_choice' ? (
                  <>
                    <Text
                      style={[
                        styles.feedbackTitle,
                        feedback.isCorrect ? styles.feedbackOk : styles.feedbackBad,
                      ]}
                    >
                      {feedback.isCorrect ? 'Correcto' : 'Incorrecto'}
                    </Text>
                    <Text style={styles.feedbackText}>
                      Respuesta correcta: {feedback.correctOptionText}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.feedbackTitle}>Respuesta esperada</Text>
                    <Text style={styles.feedbackText}>
                      {feedback.expectedAnswer || 'No disponible'}
                    </Text>
                  </>
                )}
              </View>
            ) : null}

            {feedback ? (
              <Pressable style={styles.primaryBtn} onPress={handleNext}>
                <Text style={styles.primaryText}>
                  {currentIndex >= questions.length - 1 ? 'Finalizar práctica' : 'Siguiente'}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.primaryBtn, actionLoading && styles.disabledBtn]}
                onPress={handleCheckAnswer}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryText}>Responder</Text>
                )}
              </Pressable>
            )}
          </View>
        ) : null}
      </ScrollView>
    </ScreenLayout>
  );
}

// ------------------------------------------------------------
// Estilos dinámicos con tokens del tema
// ------------------------------------------------------------
const createStyles = (colors: any) =>
  StyleSheet.create({
    loadingState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      color: colors.textMuted,
      fontWeight: 'bold',
    },
    scrollContent: {
      paddingBottom: 100,
      paddingVertical: 10,
    },
    roomName: {
      color: colors.textMuted,
      fontWeight: 'bold',
      marginBottom: 14,
    },
    emptyCard: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyTitle: {
      color: colors.text,
      fontWeight: '900',
      fontSize: 18,
      marginBottom: 6,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 16,
    },
    questionCard: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: 22,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.accentSoft,
    },
    progressText: {
      color: colors.accent,
      fontWeight: '900',
      fontSize: 13,
      marginBottom: 10,
    },
    questionText: {
      color: colors.text,
      fontWeight: '900',
      fontSize: 19,
      lineHeight: 27,
      marginBottom: 18,
    },
    options: {
      gap: 10,
      marginBottom: 18,
    },
    option: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    optionSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    optionCorrect: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    optionWrong: {
      borderColor: colors.danger,
      backgroundColor: colors.dangerSoft,
    },
    optionText: {
      color: colors.text,
      fontSize: 15,
    },
    answerInput: {
      backgroundColor: colors.surface,
      color: colors.text,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      minHeight: 140,
      textAlignVertical: 'top',
      marginBottom: 18,
    },
    feedbackBox: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 18,
    },
    feedbackTitle: {
      color: colors.text,
      fontWeight: '900',
      fontSize: 16,
      marginBottom: 6,
    },
    feedbackOk: {
      color: colors.accent,
    },
    feedbackBad: {
      color: colors.danger,
    },
    feedbackText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
    primaryBtn: {
      minHeight: 52,
      borderRadius: 18,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    primaryText: {
      color: '#ffffff',
      fontWeight: '900',
      fontSize: 16,
    },
    disabledBtn: {
      opacity: 0.55,
    },
    resultCard: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.accentSoft,
      alignItems: 'center',
    },
    resultTitle: {
      color: colors.text,
      fontWeight: '900',
      fontSize: 20,
      marginBottom: 10,
    },
    resultValue: {
      color: colors.accent,
      fontWeight: '900',
      fontSize: 48,
      marginBottom: 8,
    },
    resultText: {
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 18,
    },
  });