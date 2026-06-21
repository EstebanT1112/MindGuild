import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrainCircuit, Clock, Crown, GraduationCap, UsersRound } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { type RankingEntry, type RankingType } from '../../../services/apiConfig';
import { useAppDataStore } from '../../../store/appDataStore';
import { useAuthStore } from '../../../store/authStore';
import RankingItem from '../components/RankingItem';

type VisibleRankingType = Extract<RankingType, 'time' | 'qa' | 'academic' | 'boss'>;
type RankingTrend = 'up' | 'down' | 'equal';
type RankingEntryWithTrend = RankingEntry & { trend: RankingTrend; movement: number };

const rankingTabs: Array<{
  type: VisibleRankingType;
  label: string;
  title: string;
  description: string;
  subtitle: string;
  icon: typeof Clock;
}> = [
  {
    type: 'time',
    label: 'Tiempo',
    title: 'Ranking de tiempo',
    description: 'Minutos estudiados durante esta semana',
    subtitle: 'minutos',
    icon: Clock,
  },
  {
    type: 'qa',
    label: 'Q&A',
    title: 'Ranking Q&A',
    description: 'Preguntas validadas y respuestas correctas',
    subtitle: 'puntos',
    icon: BrainCircuit,
  },
  {
    type: 'academic',
    label: 'Académico',
    title: 'Ranking académico',
    description: 'Combina tiempo validado y rendimiento Q&A',
    subtitle: 'pts académicos',
    icon: GraduationCap,
  },
  {
    type: 'boss',
    label: 'Jefes',
    title: 'Ranking de jefes',
    description: 'Jefaturas ganadas al cerrar semanas',
    subtitle: 'jefaturas',
    icon: Crown,
  },
];

export default function RankingScreen() {
  const accessToken = useAuthStore(state => state.access_token);
  const [activeType, setActiveType] = useState<VisibleRankingType>('time');
  const [data, setData] = useState<RankingEntryWithTrend[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const ranking = useAppDataStore(state => state.globalRanking.data ?? []);
  const loading = useAppDataStore(state => state.globalRanking.isLoading);
  const loadGlobalRanking = useAppDataStore(state => state.loadGlobalRanking);
  const previousPositionsRef = useRef<Map<string, number>>(new Map());
  const activeTab = rankingTabs.find(tab => tab.type === activeType) ?? rankingTabs[0];
  const SummaryIcon = activeTab.icon;

  useEffect(() => {
    previousPositionsRef.current = new Map();
    loadRanking(true);
  }, [activeType, accessToken]);

  useEffect(() => {
    setData(applyRankingTrends(ranking));
  }, [ranking]);

  const applyRankingTrends = (entries: RankingEntry[]) => {
    const nextPositions = new Map<string, number>();
    const entriesWithTrend = entries.map((entry, index) => {
      const currentPosition = index + 1;
      const previousPosition = previousPositionsRef.current.get(entry.user_id);
      nextPositions.set(entry.user_id, currentPosition);

      if (!previousPosition || previousPosition === currentPosition) {
        return { ...entry, trend: 'equal' as RankingTrend, movement: 0 };
      }

      return {
        ...entry,
        trend: currentPosition < previousPosition ? 'up' as RankingTrend : 'down' as RankingTrend,
        movement: Math.abs(previousPosition - currentPosition),
      };
    });

    previousPositionsRef.current = nextPositions;
    return entriesWithTrend;
  };

  const loadRanking = async (force = false) => {
    if (!accessToken) return;

    try {
      await loadGlobalRanking(accessToken, { force, type: activeType });
    } catch (error) {
      console.error('Error al cargar ranking:', error);
      setData([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadRanking(true);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScreenLayout title="RANKING" type="rankings">
      <View style={styles.tabs}>
        {rankingTabs.map(tab => {
          const isActive = activeType === tab.type;
          return (
            <Pressable
              key={tab.type}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveType(tab.type)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.summaryCard}>
        <SummaryIcon color="#22c55e" size={22} />
        <View style={styles.summaryText}>
          <Text style={styles.title}>{activeTab.title}</Text>
          <Text style={styles.description}>{activeTab.description}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#22c55e" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#22c55e"
              colors={['#22c55e']}
            />
          }
        >
          {data.length === 0 ? (
            <View style={styles.emptyState}>
              <UsersRound color="#64748b" size={28} />
              <Text style={styles.emptyText}>Todavia no hay usuarios para mostrar.</Text>
            </View>
          ) : (
            data.map((item, index) => (
              <RankingItem
                key={item.user_id}
                rank={index + 1}
                name={item.username}
                value={item.value.toString()}
                subtitle={activeTab.subtitle}
                trend={item.trend}
                movement={item.movement}
              />
            ))
          )}
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  tabButton: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    paddingHorizontal: 6,
  },
  tabButtonActive: {
    borderColor: '#22c55e',
    backgroundColor: '#123524',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  tabTextActive: { color: '#bbf7d0' },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1e293b',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    marginVertical: 10,
  },
  summaryText: { flex: 1 },
  title: { color: 'white', fontSize: 18, fontWeight: '900' },
  description: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  listContent: { paddingBottom: 40, paddingTop: 10 },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 28 },
  emptyText: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 18 },
});
