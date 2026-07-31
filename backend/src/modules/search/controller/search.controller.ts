import type { Request, Response } from 'express';
import { pool } from '../../../common/config/db.js';

export const searchController = {
  async globalSearch(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autorizado.' });
      }

      const query = String(req.query.q || '').trim();
      if (query.length < 2) {
        return res.status(200).json({ success: true, data: { rooms: [], friends: [], materials: [] } });
      }

      const searchTerm = `%${query}%`;

      // Search rooms (where user is a member)
      const roomsResult = await pool.query(
        `SELECT r.id, r.name, r.mode, r.teams_enabled,
          (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as members_count
         FROM rooms r
         INNER JOIN room_members rm ON rm.room_id = r.id
         WHERE rm.user_id = $1 AND r.is_active = true AND r.name ILIKE $2
         ORDER BY r.name
         LIMIT 5;`,
        [userId, searchTerm]
      );

      // Search friends
      const friendsResult = await pool.query(
        `SELECT p.id, p.username, p.avatar_url, p.streak_days, p.total_study_minutes
         FROM friendships f
         INNER JOIN profiles p ON p.id = f.friend_id
         WHERE f.user_id = $1 AND p.username ILIKE $2
         ORDER BY p.username
         LIMIT 5;`,
        [userId, searchTerm]
      );

      // Search Vault materials from rooms where the user is an active member.
      const materialsResult = await pool.query(
        `SELECT rmv.id, rmv.title, rmv.resource_type, rmv.file_name,
          r.name as room_name, r.id as room_id
         FROM room_materials rmv
         INNER JOIN rooms r ON r.id = rmv.room_id
         INNER JOIN room_members rm ON rm.room_id = r.id
         WHERE rm.user_id = $1
           AND rm.is_active = true
           AND r.is_active = true
           AND rmv.is_active = true
           AND (
             rmv.title ILIKE $2
             OR rmv.file_name ILIKE $2
             OR EXISTS (
               SELECT 1
               FROM room_material_topics rmt
               JOIN academic_topics at ON at.id = rmt.topic_id
               WHERE rmt.material_id = rmv.id
                 AND at.is_active = true
                 AND (at.name ILIKE $2 OR at.slug ILIKE $2)
             )
           )
         ORDER BY rmv.created_at DESC
         LIMIT 5;`,
        [userId, searchTerm]
      );

      return res.status(200).json({
        success: true,
        data: {
          rooms: roomsResult.rows,
          friends: friendsResult.rows,
          materials: materialsResult.rows,
        },
      });
    } catch (error: any) {
      console.error('❌ Error en searchController.globalSearch:', error);
      return res.status(500).json({ error: 'Error interno en la búsqueda' });
    }
  },
};
