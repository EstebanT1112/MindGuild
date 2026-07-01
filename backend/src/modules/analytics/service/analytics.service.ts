import { AnalyticsRepository } from '../repository/analytics.repository.js';
import {
  AnalyticsAccessError,
  AnalyticsValidationError,
  type DifficultyHeatmapResult,
  type DifficultyPeriod,
} from '../types/analytics.types.js';

export const AnalyticsService = {
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

function validateUuid(value: string, message: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new AnalyticsValidationError(message);
  }
}

function getCurrentWeekYear() {
  const date = new Date();
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}
