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

      // Search vault materials (from rooms where user is a member)
      const materialsResult = await pool.query(
        `SELECT vm.id, vm.title, vm.resource_type, vm.file_name,
          r.name as room_name, r.id as room_id
         FROM vault_materials vm
         INNER JOIN rooms r ON r.id = vm.room_id
         INNER JOIN room_members rm ON rm.room_id = r.id
         WHERE rm.user_id = $1 AND vm.title ILIKE $2
         ORDER BY vm.created_at DESC
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
