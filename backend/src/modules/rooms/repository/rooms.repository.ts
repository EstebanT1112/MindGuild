import { pool } from '../../../common/config/db.js';
import type {
  CreateRoomDTO,
  CreatedRoom,
  JoinableRoom,
  JoinedRoom,
  MembershipJoinStatus,
  RoomDetails,
  RoomMember,
  UpdateRoomDTO,
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
          INSERT INTO room_members (room_id, user_id, role, is_active, is_favorite)
          VALUES ($1, $2, 'owner', true, false);
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
            RETURNING id, name, description, mode, invite_code, owner_id, max_members, is_active, teams_enabled;
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
          r.description,
          r.mode,
          r.invite_code,
          r.owner_id,
          r.max_members,
          r.is_active,
          r.teams_enabled,
          rm.role,
          COALESCE(rm.is_favorite, false) AS is_favorite,
          rm.last_activity_at,
          COUNT(active_members.id)::int AS members_count
        FROM room_members rm
        JOIN rooms r ON r.id = rm.room_id
        LEFT JOIN room_members active_members
          ON active_members.room_id = r.id
          AND active_members.is_active = true
        WHERE rm.user_id = $1
          AND rm.is_active = true
          AND r.is_active = true
        GROUP BY r.id, rm.role, rm.is_favorite, rm.last_activity_at
        ORDER BY
          COALESCE(rm.is_favorite, false) DESC,
          rm.last_activity_at DESC NULLS LAST,
          r.created_at DESC;
      `,
      [userId]
    );

    return rows as UserRoom[];
  },

  async findActiveRoomById(roomId: string): Promise<Omit<RoomDetails, 'members'> | null> {
    // RF-06: obtiene los datos base de la sala antes de sumar integrantes.
    const { rows } = await pool.query(
      `
        SELECT id, name, description, mode, invite_code, owner_id, max_members, is_active, teams_enabled
        FROM rooms
        WHERE id = $1
        LIMIT 1;
      `,
      [roomId]
    );

    return (rows[0] as Omit<RoomDetails, 'members'> | undefined) ?? null;
  },

  async getActiveMembers(roomId: string): Promise<RoomMember[]> {
    // RF-06: cruza room_members con profiles para listar solo integrantes activos.
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
    // RF-05: resuelve la sala asociada al codigo ingresado por el usuario.
    const { rows } = await pool.query(
      `
        SELECT id, name, mode, invite_code, owner_id, max_members, is_active, teams_enabled
        FROM rooms
        WHERE invite_code = $1
        LIMIT 1;
      `,
      [inviteCode]
    );

    return (rows[0] as JoinableRoom | undefined) ?? null;
  },

  async countActiveMembers(roomId: string): Promise<number> {
    // Cuenta solo miembros activos para validar capacidad disponible.
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

  async findMembership(roomId: string, userId: string): Promise<{ id: string; is_active: boolean; role: string } | null> {
    // Busca si el usuario ya tiene una membresia previa en la sala.
    const { rows } = await pool.query(
      `
        SELECT id, is_active, role
        FROM room_members
        WHERE room_id = $1 AND user_id = $2
        LIMIT 1;
      `,
      [roomId, userId]
    );

    return (rows[0] as { id: string; is_active: boolean; role: string } | undefined) ?? null;
  },

  async joinRoom(room: JoinableRoom, userId: string, status: MembershipJoinStatus): Promise<JoinedRoom> {
    // Crea membresia nueva o reactiva la existente segun validateJoinConditions.
    if (status === 'new') {
      await pool.query(
        `
          INSERT INTO room_members (room_id, user_id, role, is_active, is_favorite)
          VALUES ($1, $2, 'member', true, false);
        `,
        [room.id, userId]
      );
    } else {
      await pool.query(
        `
          UPDATE room_members
          SET is_active = true, is_favorite = false, left_at = NULL, joined_at = NOW()
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
    // RF-07: baja logica; conserva historial y permite reactivacion futura.
    const query = `
      UPDATE room_members
      SET is_active = false, is_favorite = false, left_at = NOW()
      WHERE user_id = $1 AND room_id = $2 AND is_active = true
      RETURNING id, role;
    `;
    const { rows } = await pool.query(query, [userId, roomId]);
    return rows[0];
  },

  async countActiveRoomsByUserId(userId: string): Promise<number> {
    const { rows } = await pool.query(
      `
        SELECT COUNT(*)::int AS count
        FROM room_members rm
        JOIN rooms r ON r.id = rm.room_id
        WHERE rm.user_id = $1
          AND rm.is_active = true
          AND r.is_active = true;
      `,
      [userId]
    );

    return rows[0]?.count ?? 0;
  },

  async countRoomsCreatedToday(ownerId: string): Promise<number> {
    const { rows } = await pool.query(
      `
        SELECT COUNT(*)::int AS count
        FROM rooms
        WHERE owner_id = $1
          AND (created_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::date =
            (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
      `,
      [ownerId]
    );

    return rows[0]?.count ?? 0;
  },

  async countFavoriteRoomsByUserId(userId: string): Promise<number> {
    const { rows } = await pool.query(
      `
        SELECT COUNT(*)::int AS count
        FROM room_members rm
        JOIN rooms r ON r.id = rm.room_id
        WHERE rm.user_id = $1
          AND rm.is_active = true
          AND COALESCE(rm.is_favorite, false) = true
          AND r.is_active = true;
      `,
      [userId]
    );

    return rows[0]?.count ?? 0;
  },

  async setFavorite(userId: string, roomId: string, isFavorite: boolean): Promise<UserRoom | null> {
    await pool.query(
      `
        UPDATE room_members
        SET is_favorite = $3
        WHERE user_id = $1
          AND room_id = $2
          AND is_active = true;
      `,
      [userId, roomId, isFavorite]
    );

    return this.findActiveUserRoom(userId, roomId);
  },

  async findActiveUserRoom(userId: string, roomId: string): Promise<UserRoom | null> {
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
          COALESCE(rm.is_favorite, false) AS is_favorite,
          rm.last_activity_at,
          COUNT(active_members.id)::int AS members_count
        FROM room_members rm
        JOIN rooms r ON r.id = rm.room_id
        LEFT JOIN room_members active_members
          ON active_members.room_id = r.id
          AND active_members.is_active = true
        WHERE rm.user_id = $1
          AND rm.room_id = $2
          AND rm.is_active = true
          AND r.is_active = true
        GROUP BY r.id, rm.role, rm.is_favorite, rm.last_activity_at
        LIMIT 1;
      `,
      [userId, roomId]
    );

    return (rows[0] as UserRoom | undefined) ?? null;
  },

  async updateLastActivity(userId: string, roomId: string): Promise<void> {
    await pool.query(
      `
        UPDATE room_members
        SET last_activity_at = NOW()
        WHERE user_id = $1
          AND room_id = $2
          AND is_active = true;
      `,
      [userId, roomId]
    );
  },

  async transferOwnershipToOldestActiveMember(roomId: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `
          SELECT user_id
          FROM room_members
          WHERE room_id = $1
            AND is_active = true
          ORDER BY joined_at ASC
          LIMIT 1;
        `,
        [roomId]
      );

      const nextOwnerId = rows[0]?.user_id;

      if (nextOwnerId) {
        await client.query(
          `
            UPDATE room_members
            SET role = CASE WHEN user_id = $2 THEN 'owner' ELSE 'member' END
            WHERE room_id = $1
              AND is_active = true;
          `,
          [roomId, nextOwnerId]
        );

        await client.query(
          `
            UPDATE rooms
            SET owner_id = $2
            WHERE id = $1;
          `,
          [roomId, nextOwnerId]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async deactivateRoomIfEmpty(roomId: string): Promise<void> {
    await pool.query(
      `
        UPDATE rooms
        SET is_active = false
        WHERE id = $1
          AND NOT EXISTS (
            SELECT 1
            FROM room_members
            WHERE room_id = $1
              AND is_active = true
          );
      `,
      [roomId]
    );
  },

  async checkActiveMembership(userId: string, roomId: string): Promise<boolean> {
    // Verifica membresia activa para flujos que deben excluir usuarios salidos.
    const query = `
      SELECT 1
      FROM room_members
      WHERE user_id = $1 AND room_id = $2 AND is_active = true;
    `;
    const { rows } = await pool.query(query, [userId, roomId]);
    return rows.length > 0;
  },

  async updateRoom(roomId: string, data: UpdateRoomDTO): Promise<Omit<RoomDetails, 'members'> | null> {
    const { rows } = await pool.query(
      `
        UPDATE rooms
        SET
          name = COALESCE($2, name),
          description = CASE WHEN $3 THEN $4 ELSE description END,
          updated_at = NOW()
        WHERE id = $1
          AND is_active = true
        RETURNING id, name, description, mode, invite_code, owner_id, max_members, is_active, teams_enabled;
      `,
      [roomId, data.name ?? null, Object.prototype.hasOwnProperty.call(data, 'description'), data.description ?? null]
    );

    return (rows[0] as Omit<RoomDetails, 'members'> | undefined) ?? null;
  },

  async removeMember(roomId: string, targetUserId: string, ownerId: string) {
    const { rows } = await pool.query(
      `
        UPDATE room_members
        SET
          is_active = false,
          left_at = NOW(),
          removed_at = NOW(),
          removed_by = $3
        WHERE room_id = $1
          AND user_id = $2
          AND is_active = true
        RETURNING id, user_id, role;
      `,
      [roomId, targetUserId, ownerId]
    );

    return rows[0];
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
