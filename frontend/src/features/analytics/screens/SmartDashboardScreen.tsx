import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { BarChart3, BrainCircuit, CalendarDays, Clock3, Target, TrendingDown, TrendingUp } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { useAuthStore } from '../../../store/authStore';
import {
  fetchMyDashboard,
  fetchRoomDashboard,
  type DashboardResult,
  type DashboardSummary,
} from '../services/analyticsService';

export default function SmartDashboardScreen() {
  const route = useRoute<any>();
  const accessToken = useAuthStore(state => state.access_token);
  const roomId = route.params?.roomId ? String(route.params.roomId) : null;
  const roomName = route.params?.roomName ? String(route.params.roomName) : 'Sala';
  const scope = route.params?.scope === 'room' && roomId ? 'room' : 'global';
  const roomMode = route.params?.mode === 'survival' ? 'survival' : 'battle_royale';
  const showAcademicMetrics = !(scope === 'room' && roomMode === 'survival');

  const [data, setData] = useState<DashboardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [accessToken, roomId, scope]);

  const loadDashboard = async (options?: { refreshing?: boolean }) => {
    if (!accessToken) return;

    if (options?.refreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = scope === 'room' && roomId
        ? await fetchRoomDashboard(accessToken, roomId)
        : await fetchMyDashboard(accessToken);

      setData(result);
    } catch (error: any) {
      Alert.alert('Dashboard', error.message ?? 'No se pudo cargar el dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const title = scope === 'room' ? 'DASHBOARD DE SALA' : 'MI DASHBOARD';

  return (
    <ScreenLayout title={title} type="rooms" icon={<BarChart3 color="#38bdf8" size={22} />}>
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#38bdf8" />
          <Text style={styles.loadingText}>Calculando rendimiento...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadDashboard({ refreshing: true })}
              tintColor="#38bdf8"
              colors={['#38bdf8']}
            />
          }
        >
          <View style={styles.heroCard}>
            <Text style={styles.scopeText}>{scope === 'room' ? roomName : 'Rendimiento global'}</Text>
            <Text style={styles.weekText}>Semana {data?.week_year ?? '-'}</Text>
            <Text style={styles.heroCopy}>
              {scope === 'room' && roomMode === 'survival'
                ? 'Lectura semanal de tiempo, sesiones y constancia dentro de esta sala.'
                : 'Lectura semanal de estudio, actividad y rendimiento academico.'}
            </Text>
          </View>

          {data && (
            <>
              <View style={styles.metricsGrid}>
                <MetricCard
                  label="Minutos"
                  value={`${data.summary.total_minutes}m`}
                  previous={data.previous_week?.total_minutes}
                  delta={formatPercent(data.deltas.minutes_percent)}
                  icon={<Clock3 color="#38bdf8" size={20} />}
                />
                <MetricCard
                  label="Sesiones"
                  value={String(data.summary.sessions_count)}
                  previous={data.previous_week?.sessions_count}
                  icon={<Target color="#22c55e" size={20} />}
                />
                <MetricCard
                  label="Dias activos"
                  value={String(data.summary.days_active)}
                  previous={data.previous_week?.days_active}
                  delta={formatSignedNumber(data.deltas.days_active_delta)}
                  icon={<CalendarDays color="#facc15" size={20} />}
                />
                {showAcademicMetrics ? (
                  <MetricCard
                    label="Quiz"
                    value={`${Math.round(data.summary.avg_quiz_score)}%`}
                    previous={data.previous_week?.avg_quiz_score}
                    delta={formatPercent(data.deltas.quiz_percent)}
                    icon={<BrainCircuit color="#a855f7" size={20} />}
                  />
                ) : (
                  <MetricCard
                    label="Constancia"
                    value={`${data.summary.days_active}/7`}
                    previous={data.previous_week?.days_active}
                    delta={formatSignedNumber(data.deltas.days_active_delta)}
                    icon={<BarChart3 color="#22c55e" size={20} />}
                  />
                )}
              </View>

              <View style={[styles.academicCard, !showAcademicMetrics && styles.studyCard]}>
                <View style={[styles.academicIconBox, !showAcademicMetrics && styles.studyIconBox]}>
                  <BarChart3 color={showAcademicMetrics ? '#0f172a' : '#e0f2fe'} size={24} />
                </View>
                <View style={styles.academicTextBox}>
                  <Text style={styles.academicLabel}>
                    {showAcademicMetrics ? 'Puntaje academico' : 'Resumen de supervivencia'}
                  </Text>
                  <Text style={styles.academicValue}>
                    {showAcademicMetrics ? Math.round(data.summary.academic_score) : `${data.summary.total_minutes}m`}
                  </Text>
                  <Text style={styles.academicSub}>
                    {showAcademicMetrics ? getAcademicDeltaText(data) : getSurvivalSummaryText(data.summary)}
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>INSIGHTS</Text>
              {data.insights.map((insight, index) => (
                <View key={`${insight.type}-${index}`} style={[styles.insightCard, getInsightStyle(insight.type)]}>
                  {insight.type === 'positive' ? (
                    <TrendingUp color="#86efac" size={20} />
                  ) : insight.type === 'warning' ? (
                    <TrendingDown color="#fca5a5" size={20} />
                  ) : (
                    <BarChart3 color="#93c5fd" size={20} />
                  )}
                  <Text style={styles.insightText}>{insight.message}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

function MetricCard({
  label,
  value,
  previous,
  delta,
  icon,
}: {
  label: string;
  value: string;
  previous?: number;
  delta?: string | null;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricTop}>
        <View style={styles.metricIcon}>{icon}</View>
        {!!delta && <Text style={styles.deltaText}>{delta}</Text>}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {typeof previous === 'number' && (
        <Text style={styles.previousText}>Antes: {formatPrevious(label, previous)}</Text>
      )}
    </View>
  );
}

function formatPrevious(label: string, value: number) {
  if (label === 'Minutos') return `${value}m`;
  if (label === 'Quiz') return `${Math.round(value)}%`;
  return String(value);
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return null;
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${Math.round(value)}%`;
}

function formatSignedNumber(value: number | null) {
  if (value === null || value === 0) return null;
  return value > 0 ? `+${value}` : String(value);
}

function getAcademicDeltaText(data: DashboardResult) {
  if (!data.previous_week || data.deltas.academic_percent === null) {
    return 'Sin comparacion suficiente contra la semana anterior.';
  }

  const delta = Math.round(data.deltas.academic_percent);
  if (delta > 0) return `Subio ${delta}% respecto de la semana anterior.`;
  if (delta < 0) return `Bajo ${Math.abs(delta)}% respecto de la semana anterior.`;
  return 'Se mantuvo estable respecto de la semana anterior.';
}

function getSurvivalSummaryText(summary: DashboardSummary) {
  if (summary.sessions_count === 0) {
    return 'Todavia no hay sesiones validadas en esta sala durante la semana.';
  }

  return `${summary.sessions_count} sesiones validadas en ${summary.days_active} dias activos.`;
}

function getInsightStyle(type: 'positive' | 'warning' | 'neutral') {
  if (type === 'positive') return styles.insightPositive;
  if (type === 'warning') return styles.insightWarning;
  return styles.insightNeutral;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80 },
  loadingText: { color: '#94a3b8' },
  heroCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  scopeText: { color: '#f8fafc', fontSize: 20, fontWeight: '900' },
  weekText: { color: '#38bdf8', fontSize: 13, fontWeight: '900', marginTop: 4 },
  heroCopy: { color: '#94a3b8', marginTop: 8, lineHeight: 19 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    width: '48%',
    backgroundColor: '#111827',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#243244',
    padding: 12,
  },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  deltaText: { color: '#cbd5e1', fontSize: 12, fontWeight: '900' },
  metricValue: { color: '#f8fafc', fontSize: 22, fontWeight: '900', marginTop: 12 },
  metricLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '800', marginTop: 2 },
  previousText: { color: '#64748b', fontSize: 11, marginTop: 8 },
  academicCard: {
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: '#facc15',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  studyCard: { backgroundColor: '#082f49' },
  academicIconBox: { width: 44, height: 44, borderRadius: 8, backgroundColor: 'rgba(15,23,42,0.12)', alignItems: 'center', justifyContent: 'center' },
  studyIconBox: { backgroundColor: 'rgba(224,242,254,0.12)' },
  academicTextBox: { flex: 1 },
  academicLabel: { color: '#1f2937', fontSize: 12, fontWeight: '900' },
  academicValue: { color: '#0f172a', fontSize: 26, fontWeight: '900' },
  academicSub: { color: '#334155', fontSize: 12, fontWeight: '700' },
  sectionTitle: { color: '#64748b', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  insightCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 13,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  insightPositive: { backgroundColor: '#052e16', borderColor: '#166534' },
  insightWarning: { backgroundColor: '#450a0a', borderColor: '#991b1b' },
  insightNeutral: { backgroundColor: '#0f172a', borderColor: '#1e3a8a' },
  insightText: { color: '#e2e8f0', flex: 1, lineHeight: 18, fontWeight: '700' },
});
