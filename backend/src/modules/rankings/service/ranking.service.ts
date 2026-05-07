import { rankingsRepository } from '../repository/ranking.repository.js';
import type { RankingType, RankingEntry } from '../types/ranking.types.js';

export const rankingsService = {
  async getRanking(type: RankingType, userId: string, roomId?: string) {
    if (roomId) {
      const member = await rankingsRepository.getMemberStatus(roomId, userId);
      if (!member || !member.is_active) {
        throw new Error('No tienes acceso al ranking de esta sala');
      }
    }

    // Usamos this para llamar a la función interna del objeto
    const weekYear = this.getCurrentWeekYear();

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
        position: index + 1
      };
    });

    return {
      type,
      scope: roomId ? 'room' : 'global',
      week: weekYear,
      data: formattedRanking
    };
  },

  // LE SACAMOS EL PRIVATE: Ahora es una función normal del objeto
  getCurrentWeekYear(): string {
    const now = new Date();
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
    return `${weekNumber}-${now.getFullYear()}`;
  }
};