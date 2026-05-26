import { pool } from '../../../common/config/db.js';

export const studyRepository = {
  async getUserSessions(userId: string, limit: number = 20) {
    const { rows } = await pool.query(
      `
        SELECT
          s.id,
          s.room_id,
          r.name as room_name,
          s.mode,
          s.status,
          s.approval_status,
          s.duration_minutes,
          s.started_at,
          s.ended_at
        FROM study_sessions s
        LEFT JOIN rooms r ON s.room_id = r.id
        WHERE s.user_id = $1
        ORDER BY s.created_at DESC
        LIMIT $2;
      `,
      [userId, limit]
    );

    return rows;
  },

  async getUserTotalMinutes(userId: string) {
    const { rows } = await pool.query(
      `
        SELECT total_study_minutes
        FROM profiles
        WHERE id = $1
        LIMIT 1;
      `,
      [userId]
    );

    return rows[0]?.total_study_minutes ?? 0;
  },
};
