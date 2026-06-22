import { pool } from '../../../common/config/db.js';
import type { RoomMessage } from '../types/chat.types.js';

export class ChatRepository {
  static async isActiveRoomMember(roomId: string, userId: string): Promise<boolean> {
    const { rows } = await pool.query(
      `
        SELECT 1
        FROM rooms r
        JOIN room_members rm ON rm.room_id = r.id
        WHERE r.id = $1
          AND r.is_active = true
          AND rm.user_id = $2
          AND rm.is_active = true
        LIMIT 1;
      `,
      [roomId, userId]
    );

    return rows.length > 0;
  }

  static async listRoomMessages(input: {
    roomId: string;
    limit: number;
    before?: string;
    after?: string;
  }): Promise<RoomMessage[]> {
    const filters = ['m.room_id = $1'];
    const params: any[] = [input.roomId];

    if (input.before) {
      params.push(input.before);
      filters.push(`m.created_at < $${params.length}::timestamptz`);
    }

    if (input.after) {
      params.push(input.after);
      filters.push(`m.created_at > $${params.length}::timestamptz`);
    }

    params.push(input.limit);

    const { rows } = await pool.query<RoomMessage>(
      `
        SELECT
          m.id,
          m.room_id,
          m.sender_id,
          p.username AS sender_username,
          p.avatar_url AS sender_avatar_url,
          m.content,
          m.created_at
        FROM room_messages m
        JOIN profiles p ON p.id = m.sender_id
        WHERE ${filters.join(' AND ')}
        ORDER BY m.created_at DESC
        LIMIT $${params.length};
      `,
      params
    );

    return rows.reverse();
  }

  static async createRoomMessage(input: {
    roomId: string;
    senderId: string;
    content: string;
  }): Promise<RoomMessage> {
    const { rows } = await pool.query<RoomMessage>(
      `
        WITH inserted AS (
          INSERT INTO room_messages (room_id, sender_id, content)
          VALUES ($1, $2, $3)
          RETURNING id, room_id, sender_id, content, created_at
        )
        SELECT
          inserted.id,
          inserted.room_id,
          inserted.sender_id,
          p.username AS sender_username,
          p.avatar_url AS sender_avatar_url,
          inserted.content,
          inserted.created_at
        FROM inserted
        JOIN profiles p ON p.id = inserted.sender_id;
      `,
      [input.roomId, input.senderId, input.content]
    );

    return rows[0];
  }

  static async deleteMessagesOlderThan(days: number): Promise<number> {
    const { rowCount } = await pool.query(
      `
        DELETE FROM room_messages
        WHERE created_at < now() - ($1::text || ' days')::interval;
      `,
      [days]
    );

    return rowCount ?? 0;
  }
}
