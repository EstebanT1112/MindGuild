//Defino el types y luego lo implemento en la interfaz de Achievement
export type AchievementEventType =
  | 'session_completed'
  | 'streak_updated'
  | 'room_participation';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  badge_icon?: string | null;
  type: AchievementEventType;
  target_value: number;
}
//Para queries parciales
export interface AchievementId {
  achievement_id: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}
//Respuesta frontend/UI
export interface AchievementStatus {
  id: string;
  name: string;
  description: string;
  badge_icon?: string | null;
  type: AchievementEventType;
  target_value: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

export class AchievementValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AchievementValidationError';
  }
}