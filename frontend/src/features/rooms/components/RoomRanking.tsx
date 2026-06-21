import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BrainCircuit, ChevronDown, ChevronUp, Clock, Crown, GraduationCap } from 'lucide-react-native';
import { fetchRanking, type RankingEntry, type RankingType } from '../../../services/apiConfig';
import { useAuthStore } from '../../../store/authStore';

interface Props {
  roomId?: string;
}

const fallbackAvatar = 'https://ui-avatars.com/api/?background=1e293b&color=ffffff&name=MG';
type VisibleRankingType = Extract<RankingType, 'time' | 'qa' | 'academic' | 'boss'>;

const rankingTabs: Array<{
  type: VisibleRankingType;
  label: string;
  title: string;
  subtitle: string;
  itemLabel: string;
  icon: typeof Clock;
}> = [
  {
    type: 'time',
    label: 'Tiempo',
    title: 'Ranking de tiempo',
    subtitle: 'Minutos totales en la sala',
    itemLabel: 'Tiempo acumulado',
    icon: Clock,
  },
  {
    type: 'qa',
    label: 'Q&A',
    title: 'Ranking Q&A',
    subtitle: 'Preguntas y respuestas validadas',
    itemLabel: 'Puntos Q&A',
    icon: BrainCircuit,
  },
  {
    type: 'academic',
    label: 'Académico',
    title: 'Ranking académico',
    subtitle: 'Tiempo y rendimiento combinados',
    itemLabel: 'Score académico',
    icon: GraduationCap,
  },
  {
    type: 'boss',
    label: 'Jefes',
    title: 'Ranking de jefes',
    subtitle: 'Jefaturas ganadas en la sala',
    itemLabel: 'Jefaturas acumuladas',
    icon: Crown,
  },
];

export default function RoomRanking({ roomId }: Props) {
  const accessToken = useAuthStore(state => state.access_token);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeType, setActiveType] = useState<VisibleRankingType>('time');
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeTab = rankingTabs.find(tab => tab.type === activeType) ?? rankingTabs[0];
  const HeaderIcon = activeTab.icon;

  useEffect(() => {
    if (isExpanded) {
      loadRanking();
    }
  }, [isExpanded, roomId, accessToken, activeType]);

  const loadRanking = async () => {
    if (!roomId || !accessToken) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetchRanking(activeType, accessToken, roomId);
      setRanking(Array.isArray(response?.data?.data) ? response.data.data : []);
    } catch (err: any) {
      console.error('No se pudo cargar el ranking de sala', err);
      setRanking([]);
      setError(err.message ?? 'No se pudo cargar el ranking de sala');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={() => setIsExpanded(!isExpanded)}>
        <View style={styles.titleRow}>
          <HeaderIcon color="#facc15" size={20} />
          <View>
            <Text style={styles.title}>{activeTab.title}</Text>
            <Text style={styles.subtitle}>{activeTab.subtitle}</Text>
          </View>
        </View>
        {isExpanded ? <ChevronUp color="#64748b" size={20} /> : <ChevronDown color="#64748b" size={20} />}
      </Pressable>

      {isExpanded && (
        <View style={styles.content}>
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
                <Text style={styles.sub}>{activeTab.itemLabel}</Text>
                {(item.is_boss || item.temporary_role) && (
                  <View style={styles.roleRow}>
                    {item.is_boss && (
                      <Text style={styles.bossLabel}>Jefe semanal</Text>
                    )}
                    {item.temporary_role && (
                      <Text style={styles.roleLabel}>{item.temporary_role}</Text>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.stats}>
                <Text style={styles.mainStat}>{formatRankingValue(item.value, activeType)}</Text>
                <Text style={styles.subStat}>{formatRankingSubtitle(item.value, activeType)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
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

function formatRankingValue(value: number, type: VisibleRankingType) {
  if (type === 'time') return `${value}m`;
  if (type === 'academic') return Number(value).toFixed(1);
  return String(value);
}

function formatRankingSubtitle(value: number, type: VisibleRankingType) {
  if (type === 'time') return formatHours(value);
  if (type === 'qa') return 'puntos';
  if (type === 'academic') return 'pts';
  return 'jefaturas';
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1e293b', borderRadius: 28, padding: 15, marginTop: 25, borderWidth: 1, borderColor: '#334155' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  subtitle: { color: '#64748b', fontSize: 12, marginTop: 2 },
  content: { marginTop: 15, gap: 10 },
  tabs: { flexDirection: 'row', gap: 6 },
  tabButton: {
    flex: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    paddingHorizontal: 4,
  },
  tabButtonActive: {
    borderColor: '#facc15',
    backgroundColor: '#3b2f0c',
  },
  tabText: { color: '#94a3b8', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  tabTextActive: { color: '#fef3c7' },
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
  roleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  bossLabel: { color: '#fef3c7', backgroundColor: '#422006', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, fontSize: 10, fontWeight: '900' },
  roleLabel: { color: '#bbf7d0', backgroundColor: '#052e16', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, fontSize: 10, fontWeight: '900' },
  stats: { alignItems: 'flex-end' },
  mainStat: { color: '#22c55e', fontWeight: '900', fontSize: 18 },
  subStat: { color: '#64748b', fontSize: 10 },
});
