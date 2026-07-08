import { pool } from '../../../common/config/db.js';
import type { FriendProfile } from '../types/friends.types.js';

export const FriendsRepository = {
  async findProfileByUsername(username: string): Promise<FriendProfile | null> {
    const query = `
      SELECT id, username, avatar_url, streak_days, total_study_minutes, last_login_at
      FROM profiles
      WHERE username = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [username]);
    return (rows[0] as FriendProfile | undefined) ?? null;
  },

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

  async findPendingRequestBetween(userA: string, userB: string) {
    const query = `
      SELECT id, sender_id, receiver_id, status
      FROM friend_requests
      WHERE status = 'pending'
        AND ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [userA, userB]);
    return rows[0] ?? null;
  },

  async createFriendRequest(senderId: string, receiverId: string) {
    const query = `
      INSERT INTO friend_requests (sender_id, receiver_id, status)
      VALUES ($1, $2, 'pending')
      RETURNING id, status;
    `;
    const { rows } = await pool.query(query, [senderId, receiverId]);
    return rows[0] as { id: string; status: string };
  },

  async findRequestById(requestId: string) {
    const query = `
      SELECT id, sender_id, receiver_id, status
      FROM friend_requests
      WHERE id = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [requestId]);
    return rows[0] ?? null;
  },

  async acceptRequestTransaction(requestId: string, senderId: string, receiverId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Actualizar estado de la solicitud
      await client.query(
        `UPDATE friend_requests 
         SET status = 'accepted', responded_at = NOW() 
         WHERE id = $1;`,
        [requestId]
      );

      // 2. Insertar par bidireccional en friendships (Evitamos duplicados con ON CONFLICT)
      await client.query(
        `INSERT INTO friendships (user_id, friend_id)
         VALUES ($1, $2), ($2, $1)
         ON CONFLICT DO NOTHING;`,
        [senderId, receiverId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async rejectRequest(requestId: string): Promise<void> {
    const query = `
      UPDATE friend_requests
      SET status = 'rejected', responded_at = NOW()
      WHERE id = $1;
    `;
    await pool.query(query, [requestId]);
  },

  async getFriends(userId: string): Promise<FriendProfile[]> {
    const query = `
      SELECT p.id, p.username, p.avatar_url, p.streak_days, p.total_study_minutes, p.last_login_at
      FROM friendships f
      INNER JOIN profiles p ON p.id = f.friend_id
      WHERE f.user_id = $1;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows as FriendProfile[];
  },

  async getReceivedRequests(userId: string) {
    const query = `
      SELECT 
        fr.id, 
        fr.created_at,
        json_build_object(
          'id', p.id,
          'username', p.username,
          'avatar_url', p.avatar_url,
          'last_login_at', p.last_login_at
        ) as sender
      FROM friend_requests fr
      INNER JOIN profiles p ON p.id = fr.sender_id
      WHERE fr.receiver_id = $1 AND fr.status = 'pending';
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  },
};