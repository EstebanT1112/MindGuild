import { pool } from '../../../common/config/db.js';
import type { EndSessionDTO, StartSessionDTO, StudySession, StudySessionPause } from '../types/session.types.js';

const VALID_MINUTES_THRESHOLD = 30;
const ROOM_ACTIVITY_MINUTES_THRESHOLD = 30;
const APP_TIMEZONE = 'America/Argentina/Buenos_Aires';

export const sessionsRepository = {
  async userExists(userId: string): Promise<boolean> {
    const { rows } = await pool.query(
      `SELECT 1 FROM profiles WHERE id = $1 AND is_active = true LIMIT 1;`,
      [userId]
    );
    return rows.length > 0;
  },

  async hasActiveRoomMembership(userId: string, roomId: string): Promise<boolean> {
    const { rows } = await pool.query(
      `SELECT 1 FROM room_members WHERE user_id = $1 AND room_id = $2 AND is_active = true LIMIT 1;`,
      [userId, roomId]
    );
    return rows.length > 0;
  },

  async findActiveSessionByUser(userId: string): Promise<StudySession | null> {
    const { rows } = await pool.query(
      `
        SELECT id, user_id, room_id, mode, status, started_at, ended_at, duration_minutes, paused_seconds, valid
        FROM study_sessions
        WHERE user_id = $1 AND status IN ('active', 'paused')
        LIMIT 1;
      `,
      [userId]
    );
    return (rows[0] as StudySession | undefined) ?? null;
  },

  async findActiveSessionByUserAndRoom(userId: string, roomId: string): Promise<StudySession | null> {
    const { rows } = await pool.query(
      `
        SELECT id, user_id, room_id, mode, status, started_at, ended_at, duration_minutes, paused_seconds, valid
        FROM study_sessions
        WHERE user_id = $1
          AND room_id = $2
          AND status IN ('active', 'paused')
        LIMIT 1;
      `,
      [userId, roomId]
    );

    return (rows[0] as StudySession | undefined) ?? null;
  },

  async createSession(userId: string, data: StartSessionDTO) {
    const { rows } = await pool.query(
      `
        INSERT INTO study_sessions (user_id, room_id, mode, status, started_at, valid, paused_seconds, approval_status)
        VALUES ($1, $2, $3, 'active', NOW(), false, 0, 'pending')
        RETURNING id AS session_id, status, started_at;
      `,
      [userId, data.room_id, data.mode]
    );
    return rows[0];
  },

  async findSessionById(sessionId: string): Promise<StudySession | null> {
    const { rows } = await pool.query(
      `
        SELECT id, user_id, room_id, mode, status, started_at, ended_at, duration_minutes, paused_seconds, valid, approval_status, is_impacted
        FROM study_sessions
        WHERE id = $1
        LIMIT 1;
      `,
      [sessionId]
    );
    return (rows[0] as StudySession | undefined) ?? null;
  },

  async pauseSession(sessionId: string): Promise<StudySessionPause> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE study_sessions SET status = 'paused' WHERE id = $1;`, [sessionId]);
      const { rows } = await client.query(
        `INSERT INTO study_session_pauses (session_id, paused_at) VALUES ($1, NOW()) RETURNING *;`,
        [sessionId]
      );
      await client.query('COMMIT');
      return rows[0] as StudySessionPause;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async resumeSession(sessionId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE study_session_pauses SET resumed_at = NOW() WHERE session_id = $1 AND resumed_at IS NULL;`,
        [sessionId]
      );
      const totalPaused = await this.sumPausedSeconds(client, sessionId);
      const { rows } = await client.query(
        `UPDATE study_sessions SET status = 'active', paused_seconds = $2 WHERE id = $1 RETURNING id AS session_id, status, paused_seconds;`,
        [sessionId, totalPaused]
      );
      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async findOpenPause(client: any, sessionId: string): Promise<boolean> {
    const { rows } = await client.query(
      `SELECT 1 FROM study_session_pauses WHERE session_id = $1 AND resumed_at IS NULL LIMIT 1;`,
      [sessionId]
    );
    return rows.length > 0;
  },

  async sumPausedSeconds(client: any, sessionId: string): Promise<number> {
    const { rows } = await client.query(
      `SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (resumed_at - paused_at)))::integer, 0) as total_seconds
       FROM study_session_pauses WHERE session_id = $1 AND resumed_at IS NOT NULL;`,
      [sessionId]
    );
    return rows[0].total_seconds;
  },

  async completeSession(session: StudySession, data: EndSessionDTO) {
    const isPendingThreshold = data.duration_minutes >= VALID_MINUTES_THRESHOLD;
    const endedAt = data.ended_at ?? new Date().toISOString();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const hasOpenPause = await this.findOpenPause(client, session.id);
      if (hasOpenPause) {
        await client.query(
          `UPDATE study_session_pauses SET resumed_at = $2 WHERE session_id = $1 AND resumed_at IS NULL;`,
          [session.id, endedAt]
        );
      }

      const finalPausedSeconds = await this.sumPausedSeconds(client, session.id);

      if (!isPendingThreshold) {
        const { rows } = await client.query(
          `UPDATE study_sessions
           SET status = 'invalid', valid = false, ended_at = $2, duration_minutes = $3, paused_seconds = $4, approval_status = 'not_required', updated_at = NOW()
           WHERE id = $1 RETURNING id AS session_id, status, valid, duration_minutes;`,
          [session.id, endedAt, data.duration_minutes, finalPausedSeconds]
        );
        await client.query('COMMIT');
        return rows[0];
      }

      const { rows } = await client.query(
        `UPDATE study_sessions
         SET status = 'pending', valid = false, ended_at = $2, duration_minutes = $3, paused_seconds = $4, approval_status = 'pending',
             evidence_photo_url = $5::text, summary_text = $6::text, updated_at = NOW()
         WHERE id = $1 RETURNING id AS session_id, status, valid, duration_minutes;`,
        [session.id, endedAt, data.duration_minutes, finalPausedSeconds, data.evidence_photo_url, data.summary_text]
      );

      await updateUserStreakAfterValidSession(client, session.user_id, session.id);

      if (session.room_id && data.duration_minutes >= ROOM_ACTIVITY_MINUTES_THRESHOLD) {
        await client.query(
          `
            UPDATE room_members
            SET last_activity_at = NOW()
            WHERE room_id = $1
              AND user_id = $2
              AND is_active = true;
          `,
          [session.room_id, session.user_id]
        );
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
        SET status = 'cancelled', valid = false, ended_at = NOW(), approval_status = 'rejected'
        WHERE id = $1
        RETURNING id AS session_id, status;
      `,
      [sessionId]
    );
    return rows[0];
  },

  async listUserSessions(userId: string, statusFilter?: string) {
    let query = `SELECT s.*, r.name as room_name FROM study_sessions s 
                 LEFT JOIN rooms r ON s.room_id = r.id 
                 WHERE s.user_id = $1`;
    const params: any[] = [userId];
    if (statusFilter) {
      params.push(statusFilter);
      query += ` AND s.status = $2`;
    }
    query += ` ORDER BY s.created_at DESC;`;
    const { rows } = await pool.query(query, params);
    return rows;
  },

  async listPendingSessionsForRoom(roomId: string, reviewerId: string) {
    const { rows } = await pool.query(
      `SELECT s.id, s.duration_minutes, s.evidence_photo_url, s.summary_text, s.created_at, p.username, p.avatar_url
       FROM study_sessions s
       JOIN profiles p ON s.user_id = p.id
       WHERE s.room_id = $1 AND s.status = 'pending' AND s.user_id <> $2
       AND NOT EXISTS (
         SELECT 1 FROM study_session_reviews WHERE session_id = s.id AND reviewer_user_id = $2
       ) ORDER BY s.created_at ASC;`,
      [roomId, reviewerId]
    );
    return rows;
  },

  async createSessionReview(client: any, sessionId: string, reviewerId: string, vote: string, comment: string) {
    await client.query(
      `INSERT INTO study_session_reviews (session_id, reviewer_user_id, vote, comment, created_at)
       VALUES ($1, $2, $3, $4, NOW());`,
      [sessionId, reviewerId, vote, comment]
    );
  },

  async validateAndImpactSession(sessionId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: sessionRows } = await client.query(
        `UPDATE study_sessions SET status = 'validated', valid = true, approval_status = 'approved', is_impacted = true, updated_at = NOW()
         WHERE id = $1 AND status = 'pending' AND is_impacted = false RETURNING *;`,
        [sessionId]
      );
      const session = sessionRows[0];
      if (!session) {
        throw new Error('Sesion no elegible para impacto o ya procesada');
      }

      await client.query(
        `UPDATE profiles SET total_study_minutes = total_study_minutes + $2, updated_at = NOW() WHERE id = $1;`,
        [session.user_id, session.duration_minutes]
      );

      const weekYear = getWeekYear();
      await client.query(
        `INSERT INTO user_weekly_stats (user_id, week_year, total_minutes) VALUES ($1, $2, $3)
         ON CONFLICT (user_id, week_year) DO UPDATE SET total_minutes = user_weekly_stats.total_minutes + EXCLUDED.total_minutes, updated_at = NOW();`,
        [session.user_id, weekYear, session.duration_minutes]
      );

      if (session.room_id) {
        await client.query(
          `INSERT INTO room_user_weekly_stats (room_id, user_id, week_year, total_minutes) VALUES ($1, $2, $3, $4)
           ON CONFLICT (room_id, user_id, week_year) DO UPDATE SET total_minutes = room_user_weekly_stats.total_minutes + EXCLUDED.total_minutes, updated_at = NOW();`,
          [session.room_id, session.user_id, weekYear, session.duration_minutes]
        );
      }

      await client.query('COMMIT');
      return session;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async deleteRejectedSession(sessionId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM study_session_reviews WHERE session_id = $1;`, [sessionId]);
      await client.query(`DELETE FROM study_sessions WHERE id = $1;`, [sessionId]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async cleanupExpiredSessionsManual() {
    const cutoffDate = new Date();
    cutoffDate.setHours(0, 0, 0, 0);

    const { rows: expired } = await pool.query(
      `UPDATE study_sessions SET status = 'expired', approval_status = 'expired'
       WHERE status = 'pending' AND ended_at < $1 RETURNING id;`,
      [cutoffDate.toISOString()]
    );

    const { rowCount: deleted } = await pool.query(
      `DELETE FROM study_sessions WHERE status IN ('invalid', 'validated', 'cancelled', 'expired') AND ended_at < $1;`,
      [cutoffDate.toISOString()]
    );

    return { expired_sessions: expired.length, deleted_sessions: deleted ?? 0 };
  }
};

async function updateUserStreakAfterValidSession(client: any, userId: string, sessionId: string) {
  await client.query(
    `
      WITH streak_state AS (
        SELECT
          EXISTS (
            SELECT 1
            FROM study_sessions
            WHERE user_id = $1
              AND id <> $2
              AND status IN ('validated', 'pending', 'completed')
              AND (ended_at AT TIME ZONE $3)::date = (NOW() AT TIME ZONE $3)::date
          ) AS has_valid_today,
          EXISTS (
            SELECT 1
            FROM study_sessions
            WHERE user_id = $1
              AND status IN ('validated', 'pending', 'completed')
              AND (ended_at AT TIME ZONE $3)::date = (NOW() AT TIME ZONE $3)::date - INTERVAL '1 day'
          ) OR EXISTS (
            SELECT 1
            FROM user_streak_protections
            WHERE user_id = $1
              AND protected_date = (NOW() AT TIME ZONE $3)::date - INTERVAL '1 day'
              AND applied_at IS NOT NULL
          ) AS has_valid_yesterday
      )
      UPDATE profiles
      SET
        streak_days = CASE
          WHEN streak_state.has_valid_today THEN profiles.streak_days
          WHEN streak_state.has_valid_yesterday THEN profiles.streak_days + 1
          ELSE 1
        END,
        updated_at = NOW()
      FROM streak_state
      WHERE profiles.id = $1;
    `,
    [userId, sessionId, APP_TIMEZONE]
  );
}

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
