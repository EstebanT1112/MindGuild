import { pool } from '../../../common/config/db.js';
import type { RoomInvitationStatus } from '../types/room-invitations.types.js';

export const RoomInvitationsRepository = {
  // 🔍 Busca una sala activa por su ID
  async findActiveRoomById(roomId: string) {
    const query = `
      SELECT id, name, max_members, is_active 
      FROM rooms 
      WHERE id = $1 AND is_active = true 
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [roomId]);
    return rows[0] ?? null;
  },

  // 👥 Verifica si existe una amistad aceptada entre dos perfiles
  async areFriends(userId: string, friendId: string): Promise<boolean> {
    const query = `
      SELECT 1 
      FROM friendships 
      WHERE user_id = $1 AND friend_id = $2
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [userId, friendId]);
    return rows.length > 0;
  },

  // 📝 Busca una invitación pendiente idéntica para evitar duplicados
  async findPendingInvitation(roomId: string, senderId: string, receiverId: string) {
    const query = `
      SELECT id 
      FROM room_invitations 
      WHERE room_id = $1 AND sender_id = $2 AND receiver_id = $3 AND status = 'pending'
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [roomId, senderId, receiverId]);
    return rows[0] ?? null;
  },

  // ➕ Inserta la nueva invitación pendiente en la DB
  async createInvitation(roomId: string, senderId: string, receiverId: string) {
    const query = `
      INSERT INTO room_invitations (room_id, sender_id, receiver_id, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING id, status;
    `;
    const { rows } = await pool.query(query, [roomId, senderId, receiverId]);
    return rows[0];
  },

  // 📬 Lista las invitaciones pendientes recibidas cruzando salas y emisores
  async listPendingReceivedInvitations(userId: string) {
    const query = `
      SELECT 
        ri.id,
        ri.status,
        ri.created_at,
        json_build_object(
          'id', r.id,
          'name', r.name,
          'mode', r.mode,
          'max_members', r.max_members,
          'members_count', (SELECT COUNT(*)::int FROM room_members WHERE room_id = r.id AND is_active = true)
        ) as room,
        json_build_object(
          'id', p.id,
          'username', p.username,
          'avatar_url', p.avatar_url
        ) as sender
      FROM room_invitations ri
      INNER JOIN rooms r ON r.id = ri.room_id
      INNER JOIN profiles p ON p.id = ri.sender_id
      WHERE ri.receiver_id = $1 AND ri.status = 'pending' AND r.is_active = true
      ORDER BY ri.created_at DESC;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  },

  // 🔍 Busca una invitación específica por su ID
  async findInvitationById(invitationId: string) {
    const query = `
      SELECT id, room_id, sender_id, receiver_id, status 
      FROM room_invitations 
      WHERE id = $1 
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [invitationId]);
    return rows[0] ?? null;
  },

  // ⚡ ACTUALIZACIÓN Y ALTA TRANSACCIONAL (Membresía + Estado de Invitación)
  async acceptInvitationTransaction(invitationId: string, roomId: string, userId: string, isReactivation: boolean) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Bloquear y verificar la capacidad actual de la sala dentro de la transacción
      const memberCountRes = await client.query(
        `SELECT COUNT(*)::int AS count FROM room_members WHERE room_id = $1 AND is_active = true;`,
        [roomId]
      );
      const maxMembersRes = await client.query(
        `SELECT max_members FROM rooms WHERE id = $1 AND is_active = true;`,
        [roomId]
      );

      const activeCount = memberCountRes.rows[0]?.count ?? 0;
      const maxMembers = maxMembersRes.rows[0]?.max_members ?? 0;

      if (activeCount >= maxMembers) {
        throw new Error('CAPACITY_EXCEEDED');
      }

      // 2. Crear o reactivar la membresía según corresponda (Reutilizando la lógica de tu equipo)
      if (!isReactivation) {
        await client.query(
          `INSERT INTO room_members (room_id, user_id, role, is_active) VALUES ($1, $2, 'member', true);`,
          [roomId, userId]
        );
      } else {
        await client.query(
          `UPDATE room_members SET is_active = true, left_at = NULL, joined_at = NOW() WHERE room_id = $1 AND user_id = $2;`,
          [roomId, userId]
        );
      }

      // 3. Marcar la invitación como aceptada
      await client.query(
        `UPDATE room_invitations SET status = 'accepted', responded_at = NOW() WHERE id = $1;`,
        [invitationId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 🛑 Rechaza la invitación actualizando el estado
  async rejectInvitation(invitationId: string): Promise<void> {
    const query = `
      UPDATE room_invitations
      SET status = 'rejected', responded_at = NOW()
      WHERE id = $1;
    `;
    await pool.query(query, [invitationId]);
  },

  // 🧹 Limpieza automática si el usuario ya entró por código previamente
  async autoAcceptInvitation(roomId: string, userId: string) {
    const query = `
      UPDATE room_invitations 
      SET status = 'accepted', responded_at = NOW() 
      WHERE room_id = $1 AND receiver_id = $2 AND status = 'pending';
    `;
    await pool.query(query, [roomId, userId]);
  }
};