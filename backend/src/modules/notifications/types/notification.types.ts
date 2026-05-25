export type NotificationType =
  | 'achievement_unlocked';

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