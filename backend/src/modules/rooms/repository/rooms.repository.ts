import { pool } from '../../../common/config/db.js';
import type { CreateRoomDTO, CreatedRoom } from '../types/rooms.types.js';

export const RoomsRepository = {
  async createRoomWithOwner(ownerId: string, data: CreateRoomDTO): Promise<CreatedRoom> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const room = await this.insertRoom(client, ownerId, data);

      await client.query(
        `
          INSERT INTO room_members (room_id, user_id, role, is_active)
          VALUES ($1, $2, 'owner', true);
        `,
        [room.id, ownerId]
      );

      await client.query('COMMIT');
      return room;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async insertRoom(client: any, ownerId: string, data: CreateRoomDTO): Promise<CreatedRoom> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const inviteCode = generateInviteCode();

      try {
        const { rows } = await client.query(
          `
            INSERT INTO rooms (name, invite_code, mode, owner_id, is_active, teams_enabled)
            VALUES ($1, $2, $3, $4, true, $5)
            RETURNING id, name, mode, invite_code, owner_id, max_members, is_active, teams_enabled;
          `,
          [data.name, inviteCode, data.mode, ownerId, data.teams_enabled]
        );

        return rows[0] as CreatedRoom;
      } catch (error: any) {
        if (error?.code === '23505' && String(error?.constraint ?? '').includes('invite_code')) {
          continue;
        }

        throw error;
      }
    }

    throw new Error('No se pudo generar un codigo unico de invitacion');
  },

  async userExists(userId: string): Promise<boolean> {
    const { rows } = await pool.query(
      `
        SELECT 1
        FROM profiles
        WHERE id = $1 AND is_active = true
        LIMIT 1;
      `,
      [userId]
    );

    return rows.length > 0;
  },

  async deactivateMember(userId: string, roomId: string) {
    const query = `
      UPDATE room_members
      SET is_active = false, left_at = NOW()
      WHERE user_id = $1 AND room_id = $2 AND is_active = true
      RETURNING id;
    `;
    const { rows } = await pool.query(query, [userId, roomId]);
    return rows[0];
  },

  async checkActiveMembership(userId: string, roomId: string): Promise<boolean> {
    const query = `
      SELECT 1
      FROM room_members
      WHERE user_id = $1 AND room_id = $2 AND is_active = true;
    `;
    const { rows } = await pool.query(query, [userId, roomId]);
    return rows.length > 0;
  },
};

function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let i = 0; i < 8; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}
