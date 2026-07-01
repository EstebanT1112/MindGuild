export type RankingType = 'time' | 'qa' | 'academic' | 'boss' | 'semanal' | 'racha' | 'academico' | 'jefes';

export interface RankingEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  value: number;
  position: number;
  temporary_role?: string | null;
  is_boss?: boolean;
  team_name?: string | null;
  team_color?: string | null;
}

export interface RoomTimeRankingEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_minutes: number;
}

export interface CloseWeekInput {
  week_year?: string;
  room_id?: string;
}

export class RankingNotFoundError extends Error {}
export class RankingForbiddenError extends Error {}
export class RankingValidationError extends Error {}
