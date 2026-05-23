import { rankingsRepository } from '../repository/ranking.repository.js';
import {
  RankingForbiddenError,
  RankingNotFoundError,
  RankingValidationError,
  type RankingEntry,
  type RankingType,
  type RoomTimeRankingEntry,
} from '../types/ranking.types.js';

export const rankingsService = {
  async getRanking(type: RankingType, userId: string, roomId?: string) {
    if (roomId) {
      const member = await rankingsRepository.getMemberStatus(roomId, userId);
      if (!member || !member.is_active) {
        throw new Error('No tienes acceso al ranking de esta sala');
      }
    }
    // FIX: Cambiamos "this" por el nombre del objeto para fijar el contexto puro
    const weekYear = rankingsService.getCurrentWeekYear();
    const rawData = await rankingsRepository.getRankingData(type, weekYear, roomId);

    const formattedRanking: RankingEntry[] = rawData.map((item, index) => {
      let value = 0;
      if (type === 'racha') value = item.streak_days;
      else if (type === 'semanal') value = parseInt(item.total_minutes);
      else if (type === 'academico') value = item.academic_score;
      else if (type === 'jefes') value = item.bosses_count;

      return {
        user_id: item.id || item.user_id,
        username: item.username,
        avatar_url: item.avatar_url,
        value: value || 0,
        position: index + 1,
      };
    });

    return {
      type,
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

  getCurrentWeekYear(): string {
    const now = new Date();
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
    return `${weekNumber}-${now.getFullYear()}`;
  },
};
