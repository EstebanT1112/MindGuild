export interface BasicProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  streak_days: number;
  total_study_minutes: number;
  coins_balance: number;
  //Lo agrego para el REQ 15
  expo_push_token?: string | null;
}

export interface WeeklyStats {
  total_minutes: number;
  consistency_score: number;
  academic_score: number;
  bosses_count: number;
}

export interface VillageState {
  village_level: number;
}

export interface FullProfile extends BasicProfile {
  weekly_stats: WeeklyStats;
  village: VillageState;
  streak_completed_today: boolean;
  auth_providers: string[];
}

export interface UpdateProfileDTO {
  username?: string;
  avatar_url?: string | null;
  bio?: string | null;
  //Lo agrego para el REQ 15
  expo_push_token?: string | null;
}

export class UserValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserValidationError';
  }
}

export class UserConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserConflictError';
  }
}

export class UserNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}
