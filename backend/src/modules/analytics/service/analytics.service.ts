import { AnalyticsRepository } from '../repository/analytics.repository.js';
import {
  AnalyticsAccessError,
  AnalyticsValidationError,
  type DashboardInsight,
  type DashboardResult,
  type DashboardSummary,
  type DifficultyHeatmapResult,
  type DifficultyPeriod,
} from '../types/analytics.types.js';

export const AnalyticsService = {
  async getMyDashboard(userId: string): Promise<DashboardResult> {
    const week = getCurrentWeekContext();
    const [summary, previousWeek, dailyMinutes] = await Promise.all([
      buildDashboardSummary({ userId, weekYear: week.currentWeekYear, from: week.currentStart, to: week.currentEnd }),
      buildDashboardSummary({ userId, weekYear: week.previousWeekYear, from: week.previousStart, to: week.currentStart }),
      AnalyticsRepository.getWeeklyDailyMinutes(userId),
    ]);

    const hasPreviousData = hasAnyDashboardData(previousWeek);

    return {
      week_year: week.currentWeekYear,
      scope: 'global',
      summary,
      previous_week: hasPreviousData ? previousWeek : null,
      daily_minutes: dailyMinutes,
      deltas: buildDeltas(summary, hasPreviousData ? previousWeek : null),
      insights: buildInsights(summary, hasPreviousData ? previousWeek : null),
    };
  },

  async getRoomDashboard(userId: string, roomId: string): Promise<DashboardResult> {
    validateUuid(roomId, 'Sala invalida');

    const hasAccess = await AnalyticsRepository.isActiveRoomMember(roomId, userId);
    if (!hasAccess) {
      throw new AnalyticsAccessError('No tenes acceso a esta sala');
    }

    const week = getCurrentWeekContext();
    const [summary, previousWeek, dailyMinutes] = await Promise.all([
      buildDashboardSummary({ userId, roomId, weekYear: week.currentWeekYear, from: week.currentStart, to: week.currentEnd }),
      buildDashboardSummary({ userId, roomId, weekYear: week.previousWeekYear, from: week.previousStart, to: week.currentStart }),
      AnalyticsRepository.getWeeklyDailyMinutes(userId, roomId),
    ]);
    const hasPreviousData = hasAnyDashboardData(previousWeek);

    return {
      week_year: week.currentWeekYear,
      scope: 'room',
      room_id: roomId,
      summary,
      previous_week: hasPreviousData ? previousWeek : null,
      daily_minutes: dailyMinutes,
      deltas: buildDeltas(summary, hasPreviousData ? previousWeek : null),
      insights: buildInsights(summary, hasPreviousData ? previousWeek : null),
    };
  },

  async getMyDifficultyHeatmap(
    userId: string,
    input: { period?: string; weekYear?: string }
  ): Promise<DifficultyHeatmapResult> {
    const period = normalizePeriod(input.period);
    const weekYear = normalizeWeekYear(input.weekYear, period);
    const topics = await AnalyticsRepository.getUserDifficultyHeatmap({
      userId,
      period,
      weekYear,
    });

    return {
      scope: 'global',
      period,
      week_year: period === 'week' ? weekYear : undefined,
      topics,
    };
  },

  async getRoomDifficultyHeatmap(
    userId: string,
    roomId: string,
    input: { period?: string; weekYear?: string }
  ): Promise<DifficultyHeatmapResult> {
    validateUuid(roomId, 'Sala invalida');

    const hasAccess = await AnalyticsRepository.isActiveRoomMember(roomId, userId);
    if (!hasAccess) {
      throw new AnalyticsAccessError('No tenes acceso a esta sala');
    }

    const period = normalizePeriod(input.period);
    const weekYear = normalizeWeekYear(input.weekYear, period);
    const topics = await AnalyticsRepository.getRoomDifficultyHeatmap({
      roomId,
      period,
      weekYear,
    });

    return {
      scope: 'room',
      room_id: roomId,
      period,
      week_year: period === 'week' ? weekYear : undefined,
      topics,
    };
  },
};

async function buildDashboardSummary(input: {
  userId: string;
  roomId?: string;
  weekYear: string;
  from: Date;
  to: Date;
}): Promise<DashboardSummary> {
  const [weeklyStats, activity, avgQuizScore] = await Promise.all([
    input.roomId
      ? AnalyticsRepository.getRoomWeeklyStats(input.userId, input.roomId, input.weekYear)
      : AnalyticsRepository.getUserWeeklyStats(input.userId, input.weekYear),
    AnalyticsRepository.getSessionActivity({
      userId: input.userId,
      roomId: input.roomId,
      from: input.from,
      to: input.to,
    }),
    AnalyticsRepository.getQuizAverage({
      userId: input.userId,
      roomId: input.roomId,
      weekYear: input.weekYear,
    }),
  ]);

  return {
    total_minutes: weeklyStats.total_minutes,
    sessions_count: activity.sessions_count,
    days_active: activity.days_active,
    avg_quiz_score: roundNumber(avgQuizScore),
    academic_score: roundNumber(weeklyStats.academic_score),
  };
}

function buildDeltas(current: DashboardSummary, previous: DashboardSummary | null) {
  if (!previous) {
    return {
      minutes_percent: null,
      quiz_percent: null,
      academic_percent: null,
      days_active_delta: null,
    };
  }

  return {
    minutes_percent: percentDelta(current.total_minutes, previous.total_minutes),
    quiz_percent: percentDelta(current.avg_quiz_score, previous.avg_quiz_score),
    academic_percent: percentDelta(current.academic_score, previous.academic_score),
    days_active_delta: current.days_active - previous.days_active,
  };
}

function buildInsights(current: DashboardSummary, previous: DashboardSummary | null): DashboardInsight[] {
  const insights: DashboardInsight[] = [];

  if (!hasAnyDashboardData(current)) {
    return [
      {
        type: 'neutral',
        message: 'Todavia no hay actividad suficiente esta semana para analizar tu rendimiento.',
      },
    ];
  }

  if (!previous) {
    insights.push({
      type: 'neutral',
      message: 'Todavia no hay semana anterior suficiente para comparar tendencias.',
    });
  } else {
    const minutesDelta = current.total_minutes - previous.total_minutes;
    if (minutesDelta > 0) {
      insights.push({ type: 'positive', message: 'Esta semana estudiaste mas minutos que la anterior.' });
    } else if (minutesDelta < 0) {
      insights.push({ type: 'warning', message: 'Esta semana estudiaste menos minutos que la anterior.' });
    }

    const quizDelta = current.avg_quiz_score - previous.avg_quiz_score;
    if (Math.abs(quizDelta) >= 5) {
      insights.push({
        type: quizDelta > 0 ? 'positive' : 'warning',
        message: quizDelta > 0
          ? 'Tu promedio de quiz mejoro respecto de la semana pasada.'
          : 'Tu promedio de quiz bajo respecto de la semana pasada.',
      });
    }

    const daysDelta = current.days_active - previous.days_active;
    if (daysDelta > 0) {
      insights.push({ type: 'positive', message: 'Tuviste actividad en mas dias que la semana anterior.' });
    } else if (daysDelta < 0) {
      insights.push({ type: 'warning', message: 'Tuviste actividad en menos dias que la semana anterior.' });
    }
  }

  if (current.sessions_count > 0 && current.avg_quiz_score === 0) {
    insights.push({
      type: 'neutral',
      message: 'Ya hay sesiones registradas; cuando completes quizzes vas a ver mejor la relacion entre estudio y rendimiento.',
    });
  }

  return insights.slice(0, 4);
}

function hasAnyDashboardData(summary: DashboardSummary) {
  return (
    summary.total_minutes > 0 ||
    summary.sessions_count > 0 ||
    summary.days_active > 0 ||
    summary.avg_quiz_score > 0 ||
    summary.academic_score > 0
  );
}

function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }

  return roundNumber(((current - previous) / previous) * 100);
}

function roundNumber(value: number) {
  return Number(value.toFixed(1));
}

function normalizePeriod(period?: string): DifficultyPeriod {
  const normalized = String(period ?? 'week').trim().toLowerCase();

  if (normalized === 'week' || normalized === 'all') {
    return normalized;
  }

  throw new AnalyticsValidationError('period debe ser week o all');
}

function normalizeWeekYear(weekYear: string | undefined, period: DifficultyPeriod) {
  if (period === 'all') return undefined;

  const normalized = String(weekYear ?? getCurrentWeekYear()).trim();

  if (!/^\d{4}-W\d{2}$/.test(normalized)) {
    throw new AnalyticsValidationError('week_year debe tener formato YYYY-WNN');
  }

  return normalized;
}

function getCurrentWeekContext() {
  const now = new Date();
  const currentStart = getIsoWeekStart(now);
  const currentEnd = new Date(currentStart);
  currentEnd.setUTCDate(currentEnd.getUTCDate() + 7);

  const previousStart = new Date(currentStart);
  previousStart.setUTCDate(previousStart.getUTCDate() - 7);

  return {
    currentWeekYear: getWeekYearFromDate(currentStart),
    previousWeekYear: getWeekYearFromDate(previousStart),
    currentStart,
    currentEnd,
    previousStart,
  };
}

function getIsoWeekStart(date: Date) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 1);
  target.setUTCHours(0, 0, 0, 0);

  return target;
}

function validateUuid(value: string, message: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new AnalyticsValidationError(message);
  }
}

function getCurrentWeekYear() {
  return getWeekYearFromDate(new Date());
}

function getWeekYearFromDate(date: Date) {
  // La fecha recibida puede ser el inicio de semana en UTC. Usar getters
  // locales en Argentina convertia el lunes 00:00 UTC en domingo y restaba
  // una semana (por ejemplo, W31 se mostraba como W30).
  const target = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}
