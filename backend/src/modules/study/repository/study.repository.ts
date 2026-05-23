import { pool } from '../../../common/config/db.js';

const getWeekYear = (): string => {
  const now = new Date();
  const current = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const currentDay = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - currentDay);

  const weekYear = current.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(weekYear, 0, 4));
  const day = firstThursday.getUTCDay() || 7;
  const yearStart = new Date(firstThursday);
  yearStart.setUTCDate(firstThursday.getUTCDate() - day + 1);
  const weekNumber = Math.ceil((((current.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${weekYear}-W${String(weekNumber).padStart(2, '0')}`;
};

export const studyRepository = {
  async getSessionForValidation(sessionId: string) {
    const { rows } = await pool.query(
      `
        SELECT user_id, room_id, duration_minutes, status, valid, approval_status
        FROM study_sessions
        WHERE id = $1
        LIMIT 1;
      `,
      [sessionId]
    );

    return rows[0] ?? null;
  },

  async updateUserTotalMinutes(userId: string, durationMinutes: number) {
    const { rows } = await pool.query(
      `
        UPDATE profiles
        SET total_study_minutes = total_study_minutes + $2
        WHERE id = $1
        RETURNING total_study_minutes;
      `,
      [userId, durationMinutes]
    );

    if (!rows[0]) throw new Error('Usuario inexistente');
    return rows[0].total_study_minutes;
  },

  async updateWeeklyStats(userId: string, roomId: string | null, durationMinutes: number) {
    const weekYear = getWeekYear();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `
          INSERT INTO user_weekly_stats (user_id, week_year, total_minutes)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, week_year)
          DO UPDATE SET
            total_minutes = user_weekly_stats.total_minutes + EXCLUDED.total_minutes,
            updated_at = NOW();
        `,
        [userId, weekYear, durationMinutes]
      );

      if (roomId) {
        await client.query(
          `
            INSERT INTO room_user_weekly_stats (room_id, user_id, week_year, total_minutes)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (room_id, user_id, week_year)
            DO UPDATE SET
              total_minutes = room_user_weekly_stats.total_minutes + EXCLUDED.total_minutes,
              updated_at = NOW();
          `,
          [roomId, userId, weekYear, durationMinutes]
        );
      }

      await client.query('COMMIT');
      return { weekYear };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  // RF-10: Obtención de sesiones filtradas y ordenadas
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

  // RF-10: Obtener solo el total acumulado del perfil
  async getUserTotalMinutes(userId: string) {
    const { rows } = await pool.query(
      `SELECT total_study_minutes FROM profiles WHERE id = $1 LIMIT 1;`,
      [userId]
    );
    
    if (!rows[0]) return 0;
    return rows[0].total_study_minutes;
  }
};
