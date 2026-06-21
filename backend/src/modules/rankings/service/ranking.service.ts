import { rankingsRepository } from '../repository/ranking.repository.js';
import {
  RankingForbiddenError,
  RankingNotFoundError,
  RankingValidationError,
  type CloseWeekInput,
  type RankingEntry,
  type RankingType,
  type RoomTimeRankingEntry,
} from '../types/ranking.types.js';

export const rankingsService = {
  async getRanking(type: RankingType, userId: string, roomId?: string) {
    const normalizedType = normalizeRankingType(type);

    if (roomId) {
      const member = await rankingsRepository.getMemberStatus(roomId, userId);
      if (!member || !member.is_active) {
        throw new Error('No tienes acceso al ranking de esta sala');
      }
    }
    // FIX: Cambiamos "this" por el nombre del objeto para fijar el contexto puro
    const weekYear = rankingsService.getCurrentWeekYear();
    const legacyWeekYear = rankingsService.getLegacyWeekYear();
    const rawData = await rankingsRepository.getRankingData(normalizedType, [weekYear, legacyWeekYear], roomId);

    const formattedRanking: RankingEntry[] = rawData.map((item, index) => {
      let value = 0;
      if (normalizedType === 'racha') value = item.streak_days;
      else if (normalizedType === 'time') value = parseInt(item.total_minutes);
      else if (normalizedType === 'qa') value = parseInt(item.quiz_score);
      else if (normalizedType === 'academic') value = parseInt(item.academic_score);
      else if (normalizedType === 'boss') value = parseInt(item.bosses_count);

      return {
        user_id: item.id || item.user_id,
        username: item.username,
        avatar_url: item.avatar_url,
        value: value || 0,
        position: index + 1,
        temporary_role: item.temporary_role ?? null,
        is_boss: Boolean(item.is_boss),
      };
    });

    return {
      type: normalizedType,
      scope: roomId ? 'room' : 'global',
      week: weekYear,
      data: formattedRanking,
    };
  },

  async getRoomTimeRanking(userId: string, roomId: string): Promise<RoomTimeRankingEntry[]> {
    if (!roomId) {
      throw new RankingValidationError('roomId es requerido');
    }

    const roomExists = await rankingsRepository.roomExists(roomId);

    if (!roomExists) {
      throw new RankingNotFoundError('Sala no encontrada');
    }

    const member = await rankingsRepository.getMemberStatus(roomId, userId);

    if (!member?.is_active) {
      throw new RankingForbiddenError('No tienes acceso al ranking de esta sala');
    }

    const ranking = await rankingsRepository.getRoomTimeRanking(roomId);

    return ranking.map(item => ({
      user_id: item.user_id,
      username: item.username,
      avatar_url: item.avatar_url,
      total_minutes: Number(item.total_minutes) || 0,
    }));
  },

  async recalculateWeek(userId: string, input: CloseWeekInput) {
    if (input.room_id) {
      const member = await rankingsRepository.getMemberStatus(input.room_id, userId);
      if (!member?.is_active) {
        throw new RankingForbiddenError('No tienes acceso al ranking de esta sala');
      }
    }

    const weekYear = input.week_year || rankingsService.getCurrentWeekYear();
    await rankingsRepository.recalculateAcademicScores(weekYear, input.room_id);

    return {
      success: true,
      week_year: weekYear,
      room_id: input.room_id ?? null,
    };
  },

  async closeWeek(userId: string, input: CloseWeekInput) {
    if (input.room_id) {
      const member = await rankingsRepository.getMemberStatus(input.room_id, userId);
      if (!member?.is_active) {
        throw new RankingForbiddenError('No tienes acceso al cierre de esta sala');
      }
    }

    const weekYear = input.week_year || rankingsService.getCurrentWeekYear();
    await rankingsRepository.recalculateAcademicScores(weekYear, input.room_id);

    const rooms = await rankingsRepository.findRoomsForWeeklyClose(input.room_id);
    const results = [];

    for (const room of rooms) {
      await rankingsRepository.deleteExpiredTemporaryRoles(room.id, weekYear);
      const candidate = await rankingsRepository.findWeeklyBossCandidate(room.id, weekYear, room.mode);

      if (!candidate) {
        results.push({ room_id: room.id, week_year: weekYear, boss_user_id: null, assigned: false });
        continue;
      }

      const assignment = await rankingsRepository.assignWeeklyBoss(room.id, weekYear, candidate.user_id);
      results.push({
        room_id: room.id,
        week_year: weekYear,
        boss_user_id: assignment.boss_user_id,
        assigned: assignment.assigned,
      });
    }

    return {
      week_year: weekYear,
      results,
    };
  },

  getCurrentWeekYear(): string {
    const now = new Date();
    const current = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const currentDay = current.getUTCDay() || 7;
    current.setUTCDate(current.getUTCDate() + 4 - currentDay);

    const weekYear = current.getUTCFullYear();
    const firstThursday = new Date(Date.UTC(weekYear, 0, 4));
    const day = firstThursday.getUTCDay() || 7;
    const yearStart = new Date(firstThursday);
    yearStart.setUTCDate(firstThursday.getUTCDate() - day + 1);
    const weekNumber = Math.ceil((((current.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    return `${weekYear}-W${String(weekNumber).padStart(2, '0')}`;
  },

  getLegacyWeekYear(): string {
    const now = new Date();
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
    return `${weekNumber}-${now.getFullYear()}`;
  },
};

function normalizeRankingType(type: RankingType): RankingType {
  const map: Record<string, RankingType> = {
    semanal: 'time',
    academico: 'academic',
    jefes: 'boss',
  };

  return map[type] ?? type;
}
