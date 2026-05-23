export type RankingType = 'semanal' | 'racha' | 'academico' | 'jefes';

export interface RankingEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  value: number;
  position: number;
}

export interface RoomTimeRankingEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_minutes: number;
}

export class RankingNotFoundError extends Error {}
export class RankingForbiddenError extends Error {}
export class RankingValidationError extends Error {}
