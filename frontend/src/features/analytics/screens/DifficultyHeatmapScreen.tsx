import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Flame, Snowflake, ThermometerSun } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { useAuthStore } from '../../../store/authStore';
import {
  fetchMyDifficultyHeatmap,
  fetchRoomDifficultyHeatmap,
  type DifficultyHeatmapResult,
  type DifficultyHeatmapTopic,
  type DifficultyPeriod,
} from '../services/analyticsService';

export default function DifficultyHeatmapScreen() {
  const route = useRoute<any>();
  const accessToken = useAuthStore(state => state.access_token);
  const roomId = route.params?.roomId ? String(route.params.roomId) : null;
  const roomName = route.params?.roomName ? String(route.params.roomName) : 'Sala';
  const initialScope = route.params?.scope === 'global' ? 'global' : 'room';

  const [period, setPeriod] = useState<DifficultyPeriod>('week');
  const [data, setData] = useState<DifficultyHeatmapResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHeatmap();
  }, [accessToken, roomId, period]);

  const loadHeatmap = async (options?: { refreshing?: boolean }) => {
    if (!accessToken) return;

    if (options?.refreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = initialScope === 'global' || !roomId
        ? await fetchMyDifficultyHeatmap(accessToken, period)
        : await fetchRoomDifficultyHeatmap(accessToken, roomId, period);

      setData(result);
    } catch (error: any) {
      Alert.alert('No se pudo cargar', error.message ?? 'Intenta nuevamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const title = initialScope === 'global' ? 'MI HEATMAP' : 'HEATMAP DE SALA';

  return (
    <ScreenLayout title={title} type="rooms" icon={<ThermometerSun color="#f97316" size={22} />}>
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#f97316" />
          <Text style={styles.loadingText}>Calculando dificultad...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadHeatmap({ refreshing: true })}
              tintColor="#f97316"
              colors={['#f97316']}
            />
          }
        >
          <Text style={styles.roomName}>{initialScope === 'global' ? 'Todas tus salas' : roomName}</Text>

          <View style={styles.segmented}>
            <Pressable
              style={[styles.segmentBtn, period === 'week' && styles.segmentActive]}
              onPress={() => setPeriod('week')}
            >
              <Text style={[styles.segmentText, period === 'week' && styles.segmentTextActive]}>Semana</Text>
            </Pressable>
            <Pressable
              style={[styles.segmentBtn, period === 'all' && styles.segmentActive]}
              onPress={() => setPeriod('all')}
            >
              <Text style={[styles.segmentText, period === 'all' && styles.segmentTextActive]}>Historico</Text>
            </Pressable>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Dificultad por tema</Text>
            <Text style={styles.summaryText}>
              Se calcula con respuestas validadas de quizzes semanales. El quiz atemporal no impacta estos datos.
            </Text>
          </View>

          {!data || data.topics.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Sin datos suficientes</Text>
              <Text style={styles.emptyText}>Cuando haya respuestas validadas en preguntas con tema, vas a ver los temas mas dificiles aca.</Text>
            </View>
          ) : (
            data.topics.map(topic => (
              <TopicDifficultyCard key={topic.topic_id ?? 'unclassified'} topic={topic} />
            ))
          )}
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

function TopicDifficultyCard({ topic }: { topic: DifficultyHeatmapTopic }) {
  const percentage = Math.round(topic.difficulty_score * 100);
  const levelStyle = getLevelStyle(topic.level);

  return (
    <View style={styles.topicCard}>
      <View style={styles.topicHeader}>
        <View style={[styles.levelIconBox, { backgroundColor: levelStyle.background }]}>
          {topic.level === 'low' ? (
            <Snowflake color={levelStyle.color} size={18} />
          ) : topic.level === 'medium' ? (
            <ThermometerSun color={levelStyle.color} size={18} />
          ) : (
            <Flame color={levelStyle.color} size={18} />
          )}
        </View>
        <View style={styles.topicTitleBox}>
          <Text style={styles.topicName}>{topic.topic_name}</Text>
          <Text style={styles.topicMeta}>{topic.wrong_answers} errores de {topic.total_answers} respuestas</Text>
        </View>
        <Text style={[styles.percentageText, { color: levelStyle.color }]}>{percentage}%</Text>
      </View>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: levelStyle.color }]} />
      </View>
      <Text style={[styles.levelLabel, { color: levelStyle.color }]}>{levelStyle.label}</Text>
    </View>
  );
}

function getLevelStyle(level: DifficultyHeatmapTopic['level']) {
  if (level === 'low') {
    return { color: '#38bdf8', background: '#082f49', label: 'Dificultad baja' };
  }

  if (level === 'medium') {
    return { color: '#facc15', background: '#422006', label: 'Dificultad media' };
  }

  return { color: '#f97316', background: '#431407', label: 'Dificultad alta' };
}

const styles = StyleSheet.create({
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#94a3b8', fontWeight: 'bold' },
  content: { paddingVertical: 10, paddingBottom: 100 },
  roomName: { color: '#94a3b8', fontWeight: 'bold', marginBottom: 12 },
  segmented: { flexDirection: 'row', backgroundColor: '#111827', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: '#334155', marginBottom: 14 },
  segmentBtn: { flex: 1, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: '#f97316' },
  segmentText: { color: '#94a3b8', fontWeight: '900', fontSize: 13 },
  segmentTextActive: { color: 'white' },
  summaryCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  summaryTitle: { color: 'white', fontWeight: '900', fontSize: 16, marginBottom: 6 },
  summaryText: { color: '#94a3b8', fontSize: 13, lineHeight: 19 },
  emptyCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#334155', marginTop: 6 },
  emptyTitle: { color: 'white', fontWeight: '900', fontSize: 16, marginBottom: 6 },
  emptyText: { color: '#94a3b8', fontSize: 13, lineHeight: 19 },
  topicCard: { backgroundColor: '#1e293b', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 10 },
  topicHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  levelIconBox: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  topicTitleBox: { flex: 1 },
  topicName: { color: 'white', fontWeight: '900', fontSize: 15 },
  topicMeta: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  percentageText: { fontWeight: '900', fontSize: 18 },
  barTrack: { height: 8, borderRadius: 999, backgroundColor: '#0f172a', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  levelLabel: { fontSize: 12, fontWeight: '900', marginTop: 8 },
});
