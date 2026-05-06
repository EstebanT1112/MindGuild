import { supabase } from '../../../common/config/supabase.js';
import type { RankingType } from '../types/ranking.types.js';

export const getRankingData = async (type: RankingType, week_year: string) => {
  if (type === 'racha') {
    return await supabase
      .from('profiles')
      .select('id, username, avatar_url, streak_days')
      .order('streak_days', { ascending: false })
      .limit(50);
  }

  const columnMap = {
    semanal: 'total_minutes',
    academico: 'academic_score',
    jefes: 'bosses_count'
  };

  return await supabase
    .from('user_weekly_stats')
    .select(`
      total_minutes,
      academic_score,
      bosses_count,
      profiles (id, username, avatar_url)
    `)
    .eq('week_year', week_year)
    .order(columnMap[type as keyof typeof columnMap], { ascending: false })
    .limit(50);
};