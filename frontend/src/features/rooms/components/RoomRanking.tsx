import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BrainCircuit, ChevronDown, ChevronUp, Clock, Crown, GraduationCap } from 'lucide-react-native';
import { fetchRanking, type RankingEntry, type RankingType } from '../../../services/apiConfig';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';

interface Props {
  roomId?: string;
  roomType?: 'survival' | 'battle_royale' | string; // ✅ Agregamos roomType
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
  { type: 'time', label: 'Tiempo', title: 'Ranking de tiempo', subtitle: 'Minutos totales en la sala', itemLabel: 'Tiempo acumulado', icon: Clock },
  { type: 'qa', label: 'Q&A', title: 'Ranking Q&A', subtitle: 'Preguntas y respuestas validadas', itemLabel: 'Puntos Q&A', icon: BrainCircuit },
  { type: 'academic', label: 'Académico', title: 'Ranking académico', subtitle: 'Tiempo y rendimiento combinados', itemLabel: 'Score académico', icon: GraduationCap },
  { type: 'boss', label: 'Jefes', title: 'Ranking de jefes', subtitle: 'Jefaturas ganadas en la sala', itemLabel: 'Jefaturas acumuladas', icon: Crown },
];

export default function RoomRanking({ roomId, roomType }: Props) {
  const colors = useThemeStore(state => state.colors);
  const accessToken = useAuthStore(state => state.access_token);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeType, setActiveType] = useState<VisibleRankingType>('time');
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Filtramos los tabs según el tipo de sala
  const filteredTabs = useMemo(() => {
    // Si es survival, solo mostramos 'time' y 'boss'
    if (roomType === 'survival') {
      return rankingTabs.filter(tab => tab.type === 'time' || tab.type === 'boss');
    }
    // Para battle_royale o cualquier otro, mostramos todos
    return rankingTabs;
  }, [roomType]);

  const activeTab = filteredTabs.find(tab => tab.type === activeType) ?? filteredTabs[0] ?? rankingTabs[0];
  const HeaderIcon = activeTab?.icon ?? Clock;

  // ✅ Asegurar que activeType sea válido en filteredTabs
  useEffect(() => {
    const firstTab = filteredTabs[0];
    if (firstTab && !filteredTabs.some(tab => tab.type === activeType)) {
      setActiveType(firstTab.type);
    }
  }, [filteredTabs, activeType]);

  useEffect(() => {
    if (isExpanded) loadRanking();
  }, [isExpanded, roomId, accessToken, activeType]);

  const loadRanking = async () => {
    if (!roomId || !accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchRanking(activeType, accessToken, roomId);
      setRanking(Array.isArray(response?.data?.data) ? response.data.data : []);
    } catch (err: any) {
      setRanking([]);
      setError(err.message ?? 'No se pudo cargar el ranking');
    } finally {
      setLoading(false);
    }
  };

  // Si no hay tabs disponibles, no renderizamos nada
  if (filteredTabs.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable style={styles.header} onPress={() => setIsExpanded(!isExpanded)}>
        <View style={styles.titleRow}>
          <HeaderIcon color={colors.accent} size={20} />
          <View>
            <Text style={[styles.title, { color: colors.text }]}>{activeTab?.title ?? 'Ranking'}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{activeTab?.subtitle ?? ''}</Text>
          </View>
        </View>
        {isExpanded ? <ChevronUp color={colors.textMuted} size={20} /> : <ChevronDown color={colors.textMuted} size={20} />}
      </Pressable>

      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.tabs}>
            {filteredTabs.map(tab => {
              const isActive = activeType === tab.type;
              return (
                <Pressable
                  key={tab.type}
                  style={[
                    styles.tabButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    isActive && { borderColor: colors.accent, backgroundColor: `${colors.accent}20` }
                  ]}
                  onPress={() => setActiveType(tab.type)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: colors.textMuted },
                      isActive && { color: colors.accent }
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {loading && <ActivityIndicator color={colors.accent} />}
          {error && <Text style={{ color: colors.warning }}>{error}</Text>}

          {ranking.map((item, index) => (
            <View key={item.user_id} style={[styles.rankItem, { backgroundColor: colors.background }]}>
              <View style={[styles.rankBadge, getBadgeStyle(index), index > 2 && { backgroundColor: colors.border }]}>
                <Text style={[styles.rankNum, { color: colors.text }]}>{index + 1}</Text>
              </View>
              <Image source={{ uri: item.avatar_url || fallbackAvatar }} style={styles.avatar} />
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]}>@{item.username}</Text>
                <Text style={[styles.sub, { color: colors.textMuted }]}>{activeTab?.itemLabel ?? ''}</Text>
              </View>
              <View style={styles.stats}>
                <Text style={[styles.mainStat, { color: colors.accent }]}>
                  {formatRankingValue(item.value, activeType)}
                </Text>
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

function formatRankingValue(value: number, type: VisibleRankingType) {
  if (type === 'time') return `${value}m`;
  if (type === 'academic') return Number(value).toFixed(1);
  return String(value);
}

const styles = StyleSheet.create({
  container: { borderRadius: 28, padding: 15, marginTop: 25, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 18, fontWeight: 'bold' },
  subtitle: { fontSize: 12, marginTop: 2 },
  content: { marginTop: 15, gap: 10 },
  tabs: { flexDirection: 'row', gap: 6 },
  tabButton: { flex: 1, minHeight: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1 },
  tabText: { fontSize: 10, fontWeight: '900', textAlign: 'center' },
  rankItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20 },
  rankBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  gold: { backgroundColor: '#facc15' },
  silver: { backgroundColor: '#94a3b8' },
  bronze: { backgroundColor: '#b45309' },
  defaultBadge: { backgroundColor: '#334155' },
  rankNum: { fontWeight: 'bold', fontSize: 12, color: '#0f172a' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  info: { flex: 1 },
  name: { fontWeight: 'bold', fontSize: 15 },
  sub: { fontSize: 11 },
  stats: { alignItems: 'flex-end' },
  mainStat: { fontWeight: '900', fontSize: 18 },
});