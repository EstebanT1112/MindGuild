export type RankingType = 'semanal' | 'racha' | 'academico' | 'jefes';

export interface RankingEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  value: number;
  position: number;
}