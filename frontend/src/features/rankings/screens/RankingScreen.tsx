import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Clock, UsersRound } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { fetchRanking, type RankingEntry } from '../../../services/apiConfig';
import RankingItem from '../components/RankingItem';

const futureTabs = ['Racha', 'Academico', 'Jefes'];
type RankingTrend = 'up' | 'down' | 'equal';
type RankingEntryWithTrend = RankingEntry & { trend: RankingTrend; movement: number };

export default function RankingScreen() {
  const [data, setData] = useState<RankingEntryWithTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const previousPositionsRef = useRef<Map<string, number>>(new Map());

  useFocusEffect(
    useCallback(() => {
      loadRanking();
    }, [])
  );

  const loadRanking = async () => {
    setLoading(true);

    try {
      const response = await fetchRanking('semanal');
      const entries = response?.data?.data;
      const normalizedEntries = Array.isArray(entries) ? entries : [];
      const nextPositions = new Map<string, number>();
      const entriesWithTrend = normalizedEntries.map((entry, index) => {
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
      setData(entriesWithTrend);
    } catch (error) {
      console.error('Error al cargar ranking:', error);
      setData([]);
    } finally {
      setLoading(false);
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
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
