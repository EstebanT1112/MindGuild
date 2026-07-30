import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { BarChart3, BrainCircuit, CalendarDays, Clock3, Target, TrendingDown, TrendingUp } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import AppAlert, { type AlertType } from '../../../components/ui/AppAlert';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore, ThemeColors } from '../../../store/themeStore';
import {
  fetchMyDashboard,
  fetchRoomDashboard,
  type DashboardDailyMinutes,
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

  // 🎨 Colores dinámicos del tema activo
  const colors = useThemeStore((state) => state.colors);
  const themeMode = useThemeStore((state) => state.themeMode);
  const styles = useMemo(() => createStyles(colors, themeMode), [colors, themeMode]);

  // ✅ Estado para AppAlert
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    onConfirm?: () => void;
    confirmText?: string;
    showCancel?: boolean;
    cancelText?: string;
    onCancel?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  // ✅ Función para mostrar alertas personalizadas
  const showAlert = (
    title: string,
    message: string,
    type: AlertType = 'info',
    onConfirm?: () => void,
    confirmText?: string,
    showCancel?: boolean,
    cancelText?: string,
    onCancel?: () => void
  ) => {
    setAlert({
      visible: true,
      title,
      message,
      type,
      onConfirm,
      confirmText: confirmText || 'Aceptar',
      showCancel: showCancel || false,
      cancelText: cancelText || 'Cancelar',
      onCancel,
    });
  };

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
      showAlert('Dashboard', error.message ?? 'No se pudo cargar el dashboard', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const title = scope === 'room' ? 'DASHBOARD DE SALA' : 'MI DASHBOARD';

  const getInsightStyle = (type: 'positive' | 'warning' | 'neutral') => {
    if (type === 'positive') return styles.insightPositive;
    if (type === 'warning') return styles.insightWarning;
    return styles.insightNeutral;
  };

  return (
    <ScreenLayout title={title} type="rooms" icon={<BarChart3 color={colors.cyan} size={22} />}>
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.cyan} />
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
              tintColor={colors.cyan}
              colors={[colors.cyan || '#38bdf8']}
            />
          }
        >
          <View style={styles.heroCard}>
            <Text style={styles.scopeText}>{scope === 'room' ? roomName : 'Rendimiento global'}</Text>
            <Text style={styles.weekText}>Semana {data?.week_year ?? '-'}</Text>
            <Text style={styles.heroCopy}>
              {scope === 'room' && roomMode === 'survival'
                ? 'Lectura semanal de tiempo, sesiones y constancia dentro de esta sala.'
                : 'Lectura semanal de estudio, actividad y rendimiento académico.'}
            </Text>
          </View>

          {data && (
            <>
              <View style={styles.metricsGrid}>
                <MetricCard
                  colors={colors}
                  styles={styles}
                  label="Minutos"
                  value={`${data.summary.total_minutes}m`}
                  previous={data.previous_week?.total_minutes}
                  delta={formatPercent(data.deltas.minutes_percent)}
                  icon={<Clock3 color={colors.cyan} size={20} />}
                />
                <MetricCard
                  colors={colors}
                  styles={styles}
                  label="Sesiones"
                  value={String(data.summary.sessions_count)}
                  previous={data.previous_week?.sessions_count}
                  icon={<Target color={colors.accent} size={20} />}
                />
                <MetricCard
                  colors={colors}
                  styles={styles}
                  label="Días activos"
                  value={String(data.summary.days_active)}
                  previous={data.previous_week?.days_active}
                  delta={formatSignedNumber(data.deltas.days_active_delta)}
                  icon={<CalendarDays color={colors.warning} size={20} />}
                />
                {showAcademicMetrics ? (
                  <MetricCard
                    colors={colors}
                    styles={styles}
                    label="Quiz"
                    value={`${Math.round(data.summary.avg_quiz_score)}%`}
                    previous={data.previous_week?.avg_quiz_score}
                    delta={formatPercent(data.deltas.quiz_percent)}
                    icon={<BrainCircuit color={colors.purple} size={20} />}
                  />
                ) : (
                  <MetricCard
                    colors={colors}
                    styles={styles}
                    label="Constancia"
                    value={`${data.summary.days_active}/7`}
                    previous={data.previous_week?.days_active}
                    delta={formatSignedNumber(data.deltas.days_active_delta)}
                    icon={<BarChart3 color={colors.accent} size={20} />}
                  />
                )}
              </View>

              <Text style={styles.sectionTitle}>ESTUDIO POR DÍA</Text>
              <WeeklyStudyChart days={data.daily_minutes ?? []} colors={colors} styles={styles} />

              <View style={[styles.academicCard, !showAcademicMetrics && styles.studyCard]}>
                <View style={[styles.academicIconBox, !showAcademicMetrics && styles.studyIconBox]}>
                  <BarChart3 color={showAcademicMetrics ? colors.rankBadgeText : colors.cyanSoft} size={24} />
                </View>
                <View style={styles.academicTextBox}>
                  <Text style={styles.academicLabel}>
                    {showAcademicMetrics ? 'Puntaje académico' : 'Resumen de supervivencia'}
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
                    <TrendingUp color={colors.accent} size={20} />
                  ) : insight.type === 'warning' ? (
                    <TrendingDown color={colors.danger} size={20} />
                  ) : (
                    <BarChart3 color={colors.info} size={20} />
                  )}
                  <Text style={styles.insightText}>{insight.message}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* ✅ AppAlert personalizado */}
      <AppAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
        onConfirm={() => {
          if (alert.onConfirm) alert.onConfirm();
          setAlert(prev => ({ ...prev, visible: false }));
        }}
        onCancel={() => {
          if (alert.onCancel) alert.onCancel();
          setAlert(prev => ({ ...prev, visible: false }));
        }}
        confirmText={alert.confirmText || 'Aceptar'}
        cancelText={alert.cancelText || 'Cancelar'}
        showCancel={alert.showCancel || false}
      />
    </ScreenLayout>
  );
}

function MetricCard({
  label,
  value,
  previous,
  delta,
  icon,
  colors,
  styles,
}: {
  label: string;
  value: string;
  previous?: number;
  delta?: string | null;
  icon: React.ReactNode;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
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

function WeeklyStudyChart({
  days,
  colors,
  styles,
}: {
  days: DashboardDailyMinutes[];
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const normalizedDays = normalizeDashboardDays(days);
  const maxMinutes = Math.max(...normalizedDays.map(day => day.minutes), 1);

  return (
    <View style={styles.dailyChartCard}>
      <View style={styles.dailyChartRow}>
        {normalizedDays.map(day => {
          const barHeight = day.minutes > 0
            ? Math.max(8, Math.round((day.minutes / maxMinutes) * 96))
            : 3;

          return (
            <View key={day.day} style={styles.dailyChartColumn}>
              <Text style={styles.dailyMinutes}>{day.minutes}m</Text>
              <View style={styles.dailyBarArea}>
                <View
                  style={[
                    styles.dailyBar,
                    {
                      height: barHeight,
                      backgroundColor: day.minutes > 0 ? colors.cyan : colors.border,
                    },
                  ]}
                />
              </View>
              <Text style={styles.dailyDay}>{day.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function normalizeDashboardDays(days: DashboardDailyMinutes[]): DashboardDailyMinutes[] {
  const labels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
  const minutesByDay = new Map(days.map(day => [day.day, Number(day.minutes) || 0]));

  return labels.map(day => ({ day, minutes: minutesByDay.get(day) ?? 0 }));
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
    return 'Sin comparación suficiente contra la semana anterior.';
  }

  const delta = Math.round(data.deltas.academic_percent);
  if (delta > 0) return `Subió ${delta}% respecto de la semana anterior.`;
  if (delta < 0) return `Bajó ${Math.abs(delta)}% respecto de la semana anterior.`;
  return 'Se mantuvo estable respecto de la semana anterior.';
}

function getSurvivalSummaryText(summary: DashboardSummary) {
  if (summary.sessions_count === 0) {
    return 'Todavía no hay sesiones validadas en esta sala durante la semana.';
  }

  return `${summary.sessions_count} sesiones validadas en ${summary.days_active} días activos.`;
}

// 🎨 ESTILOS DINÁMICOS: se generan a partir de los tokens del themeStore.
// No hay ningún color hexadecimal fijo aquí — todo viene de `colors`.
// Excepción documentada: el "velo" translúcido de academicIconBox/studyIconBox usa un
// negro/blanco a baja opacidad fijo, porque es un efecto decorativo de oscurecimiento
// sobre una tarjeta que YA tiene un color de marca fijo (warning/cyan), no una superficie
// del sistema de temas.
const createStyles = (colors: ThemeColors, themeMode?: string) =>
  StyleSheet.create({
    content: { paddingBottom: 36 },
    loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80 },
    loadingText: { color: colors.textMuted },
    heroCard: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
    },
    scopeText: { color: colors.text, fontSize: 20, fontWeight: '900' },
    weekText: { color: colors.cyan, fontSize: 13, fontWeight: '900', marginTop: 4 },
    heroCopy: { color: colors.textMuted, marginTop: 8, lineHeight: 19 },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    metricCard: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
    },
    metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    metricIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    deltaText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
    metricValue: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 12 },
    metricLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '800', marginTop: 2 },
    previousText: { color: colors.textSoft, fontSize: 11, marginTop: 8 },
    academicCard: {
      marginTop: 14,
      borderRadius: 8,
      backgroundColor: colors.warning,
      padding: 14,
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    dailyChartCard: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 14,
    },
    dailyChartRow: {
      height: 150,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    dailyChartColumn: {
      flex: 1,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    dailyMinutes: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: '800',
      marginBottom: 5,
    },
    dailyBarArea: {
      height: 100,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    dailyBar: {
      width: 22,
      borderRadius: 6,
    },
    dailyDay: {
      color: colors.textSoft,
      fontSize: 11,
      fontWeight: '800',
      marginTop: 7,
    },
    studyCard: { backgroundColor: colors.cyanSoft },
    academicIconBox: { width: 44, height: 44, borderRadius: 8, backgroundColor: themeMode === 'light' ? 'rgba(15,23,42,0.06)' : 'rgba(15,23,42,0.12)', alignItems: 'center', justifyContent: 'center' },
    studyIconBox: { backgroundColor: themeMode === 'light' ? 'rgba(255,255,255,0.12)' : 'rgba(224,242,254,0.12)' },
    academicTextBox: { flex: 1 },
    academicLabel: { color: colors.rankBadgeText, fontSize: 12, fontWeight: '900' },
    academicValue: { color: colors.rankBadgeText, fontSize: 26, fontWeight: '900' },
    academicSub: { color: colors.rankBadgeText, fontSize: 12, fontWeight: '700' },
    sectionTitle: { color: colors.textSoft, fontSize: 12, fontWeight: '900', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
    insightCard: {
      borderRadius: 8,
      borderWidth: 1,
      padding: 13,
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
      marginBottom: 10,
    },
    insightPositive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
    insightWarning: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerBorder },
    insightNeutral: { backgroundColor: colors.surface, borderColor: colors.info },
    insightText: { color: colors.text, flex: 1, lineHeight: 18, fontWeight: '700' },
  });
