import { pool } from '../../../common/config/db.js';
import type {
  CreateNotificationInput,
  Notification,
  NotificationListOptions,
} from '../types/notification.types.js';

export const notificationRepository = {
  async createNotification(data: CreateNotificationInput): Promise<Notification> {
    const existing = await this.findDuplicateNotification(data);
    if (existing) {
      return existing;
    }

    const { rows } = await pool.query<Notification>(
      `
        INSERT INTO notifications (
          user_id,
          type,
          title,
          body,
          reference_type,
          reference_id,
          read
        )
        VALUES ($1, $2, $3, $4, $5, $6, false)
        RETURNING id, user_id, type, title, body, reference_type, reference_id, read, created_at;
      `,
      [
        data.user_id,
        data.type,
        data.title,
        data.body,
        data.reference_type ?? null,
        data.reference_id ?? null,
      ]
    );

    return rows[0];
  },

  async listUserNotifications(userId: string, options: NotificationListOptions = {}): Promise<Notification[]> {
    const limit = clampLimit(options.limit);
    const offset = Math.max(0, Number(options.offset) || 0);
    const unreadFilter = options.unreadOnly ? 'AND read = false' : '';

    const { rows } = await pool.query<Notification>(
      `
        SELECT id, user_id, type, title, body, reference_type, reference_id, read, created_at
        FROM notifications
        WHERE user_id = $1
          ${unreadFilter}
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3;
      `,
      [userId, limit, offset]
    );

    return rows;
  },

  async countUnread(userId: string): Promise<number> {
    const { rows } = await pool.query<{ count: number }>(
      `
        SELECT COUNT(*)::int AS count
        FROM notifications
        WHERE user_id = $1
          AND read = false;
      `,
      [userId]
    );

    return Number(rows[0]?.count) || 0;
  },

  async markAsRead(userId: string, notificationId: string): Promise<Notification | null> {
    const { rows } = await pool.query<Notification>(
      `
        UPDATE notifications
        SET read = true
        WHERE id = $1
          AND user_id = $2
        RETURNING id, user_id, type, title, body, reference_type, reference_id, read, created_at;
      `,
      [notificationId, userId]
    );

    return rows[0] ?? null;
  },

  async markAllAsRead(userId: string): Promise<number> {
    const { rowCount } = await pool.query(
      `
        UPDATE notifications
        SET read = true
        WHERE user_id = $1
          AND read = false;
      `,
      [userId]
    );

    return rowCount ?? 0;
  },

  async deleteAllForUser(userId: string): Promise<number> {
    const { rowCount } = await pool.query(
      `
        DELETE FROM notifications
        WHERE user_id = $1;
      `,
      [userId]
    );

    return rowCount ?? 0;
  },

  async findDuplicateNotification(data: CreateNotificationInput): Promise<Notification | null> {
    if (!data.reference_type || !data.reference_id) {
      return null;
    }

    const { rows } = await pool.query<Notification>(
      `
        SELECT id, user_id, type, title, body, reference_type, reference_id, read, created_at
        FROM notifications
        WHERE user_id = $1
          AND type = $2
          AND reference_type = $3
          AND reference_id = $4
        LIMIT 1;
      `,
      [data.user_id, data.type, data.reference_type, data.reference_id]
    );

    return rows[0] ?? null;
  },

  async getUserExpoPushToken(userId: string): Promise<string | null> {
    const { rows } = await pool.query<{ expo_push_token: string | null }>(
      `
        SELECT expo_push_token
        FROM profiles
        WHERE id = $1
        LIMIT 1;
      `,
      [userId]
    );

    return rows[0]?.expo_push_token ?? null;
  },
};

function clampLimit(value: unknown): number {
  const parsed = Number(value) || 30;
  return Math.min(Math.max(parsed, 1), 100);
}
