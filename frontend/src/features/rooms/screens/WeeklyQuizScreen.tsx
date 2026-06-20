import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  type BattleQuestion,
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
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [configVisible, setConfigVisible] = useState(false);
  const [questionVisible, setQuestionVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const roomId = route.params?.roomId ? String(route.params.roomId) : null;
  const roomName = route.params?.roomName ? String(route.params.roomName) : 'Quiz semanal';

  useEffect(() => {
    loadData();
  }, [roomId, accessToken]);

  const loadData = async (options?: { showLoading?: boolean }) => {
    if (!accessToken || !roomId) return;

    if (options?.showLoading ?? true) setLoading(true);
    try {
      const [roomData, configData, questionsData] = await Promise.all([
        fetchRoomDetails(accessToken, roomId),
        fetchBattleRoyaleConfig(accessToken, roomId),
        fetchRoomQuestions(accessToken, roomId),
      ]);

      setRoom(roomData);
      setWeeklyQuiz(configData.quiz);
      setQuestions(questionsData);
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
});
