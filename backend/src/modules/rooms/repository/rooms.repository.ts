import { pool } from '../../../common/config/db.js';
import type {
  CreateRoomDTO,
  CreatedRoom,
  JoinableRoom,
  JoinedRoom,
  MembershipJoinStatus,
  RoomDetails,
  RoomMember,
  UserRoom,
} from '../types/rooms.types.js';

export const RoomsRepository = {
  async createRoomWithOwner(ownerId: string, data: CreateRoomDTO): Promise<CreatedRoom> {
    // RF-04: crea sala y membresia owner en una misma transaccion.
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
    // Genera un invite_code unico y reintenta si la base detecta colision.
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
    // Verifica que el owner exista y este activo antes de crear la sala.
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

  async findActiveRoomsByUserId(userId: string): Promise<UserRoom[]> {
    const { rows } = await pool.query(
      `
        SELECT
          r.id,
          r.name,
          r.mode,
          r.invite_code,
          r.owner_id,
          r.max_members,
          r.is_active,
          r.teams_enabled,
          rm.role,
          COUNT(active_members.id)::int AS members_count
        FROM room_members rm
        JOIN rooms r ON r.id = rm.room_id
        LEFT JOIN room_members active_members
          ON active_members.room_id = r.id
          AND active_members.is_active = true
        WHERE rm.user_id = $1
          AND rm.is_active = true
          AND r.is_active = true
        GROUP BY r.id, rm.role
        ORDER BY r.created_at DESC;
      `,
      [userId]
    );

    return rows as UserRoom[];
  },

  async findActiveRoomById(roomId: string): Promise<Omit<RoomDetails, 'members'> | null> {
    const { rows } = await pool.query(
      `
        SELECT id, name, mode, invite_code, owner_id, max_members, is_active, teams_enabled
        FROM rooms
        WHERE id = $1
        LIMIT 1;
      `,
      [roomId]
    );

    return (rows[0] as Omit<RoomDetails, 'members'> | undefined) ?? null;
  },

  async getActiveMembers(roomId: string): Promise<RoomMember[]> {
    const { rows } = await pool.query(
      `
        SELECT
          p.id,
          p.username,
          p.avatar_url,
          rm.role
        FROM room_members rm
        JOIN profiles p ON p.id = rm.user_id
        WHERE rm.room_id = $1
          AND rm.is_active = true
          AND p.is_active = true
        ORDER BY
          CASE WHEN rm.role = 'owner' THEN 0 ELSE 1 END,
          rm.joined_at ASC;
      `,
      [roomId]
    );

    return rows as RoomMember[];
  },

  async findActiveRoomByInviteCode(inviteCode: string): Promise<JoinableRoom | null> {
    const { rows } = await pool.query(
      `
        SELECT id, name, mode, invite_code, max_members, is_active, teams_enabled
        FROM rooms
        WHERE invite_code = $1
        LIMIT 1;
      `,
      [inviteCode]
    );

    return (rows[0] as JoinableRoom | undefined) ?? null;
  },

  async countActiveMembers(roomId: string): Promise<number> {
    const { rows } = await pool.query(
      `
        SELECT COUNT(*)::int AS count
        FROM room_members
        WHERE room_id = $1 AND is_active = true;
      `,
      [roomId]
    );

    return rows[0]?.count ?? 0;
  },

  async findMembership(roomId: string, userId: string): Promise<{ id: string; is_active: boolean } | null> {
    const { rows } = await pool.query(
      `
        SELECT id, is_active
        FROM room_members
        WHERE room_id = $1 AND user_id = $2
        LIMIT 1;
      `,
      [roomId, userId]
    );

    return (rows[0] as { id: string; is_active: boolean } | undefined) ?? null;
  },

  async joinRoom(room: JoinableRoom, userId: string, status: MembershipJoinStatus): Promise<JoinedRoom> {
    if (status === 'new') {
      await pool.query(
        `
          INSERT INTO room_members (room_id, user_id, role, is_active)
          VALUES ($1, $2, 'member', true);
        `,
        [room.id, userId]
      );
    } else {
      await pool.query(
        `
          UPDATE room_members
          SET is_active = true, left_at = NULL, joined_at = NOW()
          WHERE room_id = $1 AND user_id = $2;
        `,
        [room.id, userId]
      );
    }

    return {
      ...room,
      membership_status: status,
    };
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
  // Usa un alfabeto sin caracteres ambiguos para generar codigos compartibles.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let i = 0; i < 8; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}
