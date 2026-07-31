export type NotificationType =
  | 'achievement_unlocked'
  | 'mission_completed'
  | 'room_invitation'
  | 'ranking_changed'
  | 'weekly_quiz_configured'
  | 'weekly_quiz_updated'
  | 'weekly_quiz_opened'
  | 'weekly_validation_opened'
  | 'weekly_results_ready'
  | 'week_closing'
  | 'boss_assigned'
  | 'team_needs_points'
  | 'reward_available'
  | string;

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  reference_type?: string | null;
  reference_id?: string | null;
  read: boolean;
  created_at: string;
}
export interface CreateNotificationInput {
  user_id: string;

  type: NotificationType;

  title: string;

  body: string;

  reference_type?: string;

  reference_id?: string;
}

export interface NotificationListOptions {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}
