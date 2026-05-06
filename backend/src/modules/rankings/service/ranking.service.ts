import type { RankingType, RankingEntry } from '../types/ranking.types.js';
import * as rankingRepository from '../respository/ranking.repository.js';



export const getGlobalRanking = async (type: RankingType, week_year: string): Promise<RankingEntry[]> => {
  const { data, error } = await rankingRepository.getRankingData(type, week_year);

  if (error) throw error;

  return data.map((item: any, index: number) => {
    const profile = item.profiles || item;
    return {
      user_id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      value: type === 'racha' ? item.streak_days : 
             type === 'semanal' ? item.total_minutes : 
             type === 'academico' ? item.academic_score : item.bosses_count,
      position: index + 1
    };
  });
};