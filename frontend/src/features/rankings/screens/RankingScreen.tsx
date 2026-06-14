import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Clock, UsersRound } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { type RankingEntry } from '../../../services/apiConfig';
import { useAppDataStore } from '../../../store/appDataStore';
import RankingItem from '../components/RankingItem';

const futureTabs = ['Racha', 'Academico', 'Jefes'];
type RankingTrend = 'up' | 'down' | 'equal';
type RankingEntryWithTrend = RankingEntry & { trend: RankingTrend; movement: number };

export default function RankingScreen() {
  const [data, setData] = useState<RankingEntryWithTrend[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const ranking = useAppDataStore(state => state.globalRanking.data ?? []);
  const loading = useAppDataStore(state => state.globalRanking.isLoading);
  const loadGlobalRanking = useAppDataStore(state => state.loadGlobalRanking);
  const previousPositionsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    loadRanking();
  }, []);

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
    try {
      await loadGlobalRanking({ force, type: 'semanal' });
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
      <View style={styles.summaryCard}>
        <Clock color="#22c55e" size={22} />
        <View style={styles.summaryText}>
          <Text style={styles.title}>Ranking de tiempo</Text>
          <Text style={styles.description}>Minutos estudiados durante esta semana</Text>
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
                subtitle="minutos"
                trend={item.trend}
                movement={item.movement}
              />
            ))
          )}
        </ScrollView>
      )}

      <View style={styles.hiddenFutureTabs}>
        {futureTabs.map(tab => <Text key={tab}>{tab}</Text>)}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
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
  hiddenFutureTabs: { display: 'none' },
});
