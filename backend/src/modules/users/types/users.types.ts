export interface BasicProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  streak_days: number;
  total_study_minutes: number;
  coins_balance: number;
  expo_push_token?: string | null;
  last_login_at?: string | null; // ✅ Agregamos este campo para el frontend
}

export interface WeeklyStats {
  total_minutes: number;
  consistency_score: number;
  academic_score: number;
  bosses_count: number;
  coins_earned: number;
  daily_minutes: Array<{
    day: string;
    minutes: number;
  }>;
}

export interface VillageState {
  village_level: number;
}

export type StreakStatus = 'inactive' | 'pending' | 'active' | 'shielded';

export interface StreakProtectionState {
  active: boolean;
  protected_until: string | null;
}

export interface FullProfile extends BasicProfile {
  weekly_stats: WeeklyStats;
  village: VillageState;
  streak_completed_today: boolean;
  streak_shield_active: boolean;
  streak_shield_until: string | null;
  streak_status: StreakStatus;
  auth_providers: string[];
}

export interface UpdateProfileDTO {
  username?: string;
  avatar_url?: string | null;
  bio?: string | null;
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