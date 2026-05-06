export interface BasicProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  streak_days: number;
  total_study_minutes: number;
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
}

export interface UpdateProfileDTO {
  username?: string;
  avatar_url?: string | null;
  bio?: string | null;
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
