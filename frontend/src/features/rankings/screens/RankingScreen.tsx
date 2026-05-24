import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { fetchRanking, type RankingEntry } from '../../../services/apiConfig';
import RankingItem from '../components/RankingItem';

const futureTabs = ['Racha', 'Academico', 'Jefes'];

export default function RankingScreen() {
  const [data, setData] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    setLoading(true);

    try {
      const response = await fetchRanking('semanal');
      const entries = response?.data?.data;
      setData(Array.isArray(entries) ? entries : []);
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
            <Text style={styles.emptyText}>Todavia no hay usuarios para mostrar.</Text>
          ) : (
            data.map((item, index) => (
              <RankingItem
                key={item.user_id}
                rank={index + 1}
                name={item.username}
                value={item.value.toString()}
                subtitle="minutos"
                trend="equal"
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
  emptyText: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 18 },
  hiddenFutureTabs: { display: 'none' },
});
