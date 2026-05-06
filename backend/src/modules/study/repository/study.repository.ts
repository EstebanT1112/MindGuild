import { pool } from '../../../common/config/db.js';

const getWeekYear = (): string => {
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
  return `${weekNumber}-${now.getFullYear()}`;
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
};
