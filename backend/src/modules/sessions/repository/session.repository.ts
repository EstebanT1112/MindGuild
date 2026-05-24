import { pool } from '../../../common/config/db.js';
import type { EndSessionDTO, StartSessionDTO, StudySession } from '../types/session.types.js';

const VALID_MINUTES_THRESHOLD = 60;

export const sessionsRepository = {
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

  async hasActiveRoomMembership(userId: string, roomId: string): Promise<boolean> {
    const { rows } = await pool.query(
      `
        SELECT 1
        FROM room_members
        WHERE user_id = $1
          AND room_id = $2
          AND is_active = true
        LIMIT 1;
      `,
      [userId, roomId]
    );

    return rows.length > 0;
  },

  async findActiveSessionByUser(userId: string): Promise<StudySession | null> {
    const { rows } = await pool.query(
      `
        SELECT id, user_id, room_id, mode, status, started_at, ended_at, duration_minutes, paused_seconds, valid
        FROM study_sessions
        WHERE user_id = $1
          AND status = 'active'
        LIMIT 1;
      `,
      [userId]
    );

    return (rows[0] as StudySession | undefined) ?? null;
  },

  async createSession(userId: string, data: StartSessionDTO) {
    const { rows } = await pool.query(
      `
        INSERT INTO study_sessions (user_id, room_id, mode, status, started_at, valid)
        VALUES ($1, $2, $3, 'active', NOW(), true)
        RETURNING id AS session_id, status, started_at;
      `,
      [userId, data.room_id, data.mode]
    );

    return rows[0];
  },

  async findSessionById(sessionId: string): Promise<StudySession | null> {
    const { rows } = await pool.query(
      `
        SELECT id, user_id, room_id, mode, status, started_at, ended_at, duration_minutes, paused_seconds, valid
        FROM study_sessions
        WHERE id = $1
        LIMIT 1;
      `,
      [sessionId]
    );

    return (rows[0] as StudySession | undefined) ?? null;
  },

  async completeSession(session: StudySession, data: EndSessionDTO) {
    const valid = data.duration_minutes >= VALID_MINUTES_THRESHOLD;
    const endedAt = data.ended_at ?? new Date().toISOString();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `
          UPDATE study_sessions
          SET
            status = 'completed',
            valid = $2,
            ended_at = $3,
            duration_minutes = $4,
            paused_seconds = $5,
            evidence_photo_url = $6,
            summary_text = $7
          WHERE id = $1
          RETURNING id AS session_id, status, valid, duration_minutes;
        `,
        [
          session.id,
          valid,
          endedAt,
          data.duration_minutes,
          data.paused_seconds ?? 0,
          valid ? data.evidence_photo_url ?? null : null,
          valid ? data.summary_text ?? null : null,
        ]
      );

      if (valid) {
        await client.query(
          `
            UPDATE profiles
            SET total_study_minutes = total_study_minutes + $2
            WHERE id = $1;
          `,
          [session.user_id, data.duration_minutes]
        );

        const weekYear = getWeekYear();

        await client.query(
          `
            INSERT INTO user_weekly_stats (user_id, week_year, total_minutes)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, week_year)
            DO UPDATE SET
              total_minutes = user_weekly_stats.total_minutes + EXCLUDED.total_minutes,
              updated_at = NOW();
          `,
          [session.user_id, weekYear, data.duration_minutes]
        );

        if (session.room_id) {
          await client.query(
            `
              INSERT INTO room_user_weekly_stats (room_id, user_id, week_year, total_minutes)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (room_id, user_id, week_year)
              DO UPDATE SET
                total_minutes = room_user_weekly_stats.total_minutes + EXCLUDED.total_minutes,
                updated_at = NOW();
            `,
            [session.room_id, session.user_id, weekYear, data.duration_minutes]
          );
        }
      }

      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async cancelSession(sessionId: string) {
    const { rows } = await pool.query(
      `
        UPDATE study_sessions
        SET
          status = 'cancelled',
          valid = false,
          ended_at = NOW()
        WHERE id = $1
        RETURNING id AS session_id, status;
      `,
      [sessionId]
    );

    return rows[0];
  },
};

function getWeekYear(): string {
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
}
