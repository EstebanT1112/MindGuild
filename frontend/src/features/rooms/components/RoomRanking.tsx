import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react-native';
import { useAppDataStore } from '../../../store/appDataStore';
import { useAuthStore } from '../../../store/authStore';

interface Props {
  roomId?: string;
}

const fallbackAvatar = 'https://ui-avatars.com/api/?background=1e293b&color=ffffff&name=MG';
const futureRankingTabs = ['Team', 'Respuestas', 'Jefes', 'Individual'];

export default function RoomRanking({ roomId }: Props) {
  const accessToken = useAuthStore(state => state.access_token);
  const [isExpanded, setIsExpanded] = useState(false);
  const rankingEntry = useAppDataStore(state => roomId ? state.roomRankings[roomId] : undefined);
  const loadRoomRanking = useAppDataStore(state => state.loadRoomRanking);
  const ranking = rankingEntry?.data ?? [];
  const loading = rankingEntry?.isLoading ?? false;
  const error = rankingEntry?.error ?? null;

  useEffect(() => {
    if (isExpanded) {
      loadRanking();
    }
  }, [isExpanded, roomId, accessToken]);

  const loadRanking = async () => {
    if (!roomId || !accessToken) return;

    try {
      await loadRoomRanking(accessToken, roomId);
    } catch (err: any) {
      console.error('No se pudo cargar el ranking de sala', err);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={() => setIsExpanded(!isExpanded)}>
        <View style={styles.titleRow}>
          <Trophy color="#facc15" size={20} />
          <View>
            <Text style={styles.title}>Ranking de tiempo</Text>
            <Text style={styles.subtitle}>Minutos totales en la sala</Text>
          </View>
        </View>
        {isExpanded ? <ChevronUp color="#64748b" size={20} /> : <ChevronDown color="#64748b" size={20} />}
      </Pressable>

      {isExpanded && (
        <View style={styles.content}>
          {loading && (
            <View style={styles.stateRow}>
              <ActivityIndicator color="#22c55e" />
              <Text style={styles.stateText}>Cargando ranking...</Text>
            </View>
          )}

          {!loading && error && <Text style={styles.errorText}>{error}</Text>}

          {!loading && !error && ranking.length === 0 && (
            <Text style={styles.stateText}>Todavia no hay integrantes para rankear.</Text>
          )}

          {!loading && !error && ranking.map((item, index) => (
            <View key={item.user_id} style={styles.rankItem}>
              <View style={[styles.rankBadge, getBadgeStyle(index)]}>
                <Text style={styles.rankNum}>{index + 1}</Text>
              </View>

              <Image source={{ uri: item.avatar_url || fallbackAvatar }} style={styles.avatar} />

              <View style={styles.info}>
                <Text style={styles.name}>@{item.username}</Text>
                <Text style={styles.sub}>Tiempo acumulado</Text>
              </View>

              <View style={styles.stats}>
                <Text style={styles.mainStat}>{item.total_minutes}m</Text>
                <Text style={styles.subStat}>{formatHours(item.total_minutes)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.hiddenFutureTabs}>
        {futureRankingTabs.map(tab => <Text key={tab}>{tab}</Text>)}
      </View>
    </View>
  );
}

function getBadgeStyle(index: number) {
  if (index === 0) return styles.gold;
  if (index === 1) return styles.silver;
  if (index === 2) return styles.bronze;
  return styles.defaultBadge;
}

function formatHours(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes} min`;
  return `${hours}h ${remainingMinutes}m`;
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1e293b', borderRadius: 28, padding: 15, marginTop: 25, borderWidth: 1, borderColor: '#334155' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  subtitle: { color: '#64748b', fontSize: 12, marginTop: 2 },
  content: { marginTop: 15, gap: 10 },
  stateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  stateText: { color: '#94a3b8', fontSize: 13, fontWeight: 'bold' },
  errorText: { color: '#f87171', fontSize: 13, fontWeight: 'bold' },
  rankItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 12, borderRadius: 20 },
  rankBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  gold: { backgroundColor: '#facc15' },
  silver: { backgroundColor: '#94a3b8' },
  bronze: { backgroundColor: '#b45309' },
  defaultBadge: { backgroundColor: '#334155' },
  rankNum: { fontWeight: 'bold', fontSize: 12, color: '#0f172a' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  info: { flex: 1 },
  name: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  sub: { color: '#64748b', fontSize: 11 },
  stats: { alignItems: 'flex-end' },
  mainStat: { color: '#22c55e', fontWeight: '900', fontSize: 18 },
  subStat: { color: '#64748b', fontSize: 10 },
  hiddenFutureTabs: { display: 'none' },
});
