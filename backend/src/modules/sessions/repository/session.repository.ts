import { pool } from '../../../common/config/db.js';
import type { EndSessionDTO, StartSessionDTO, StudySession, StudySessionPause } from '../types/session.types.js';

const VALID_MINUTES_THRESHOLD = 5;
const ROOM_ACTIVITY_MINUTES_THRESHOLD = 30;

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
        VALUES ($1, $2, $3, 'active', NOW(), true, 0, 'pending')
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

  async pauseSession(sessionId: string): Promise<StudySessionPause> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      await client.query(
        `UPDATE study_sessions SET status = 'paused' WHERE id = $1;`,
        [sessionId]
      );

      const { rows } = await client.query(
        `
          INSERT INTO study_session_pauses (session_id, paused_at)
          VALUES ($1, NOW())
          RETURNING id, session_id, paused_at, resumed_at, created_at;
        `,
        [sessionId]
      );

      await client.query('COMMIT');
      return rows[0] as StudySessionPause;
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('[sessionsRepository] pauseSession failed', {
        sessionId,
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
      });
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
        `
          UPDATE study_session_pauses
          SET resumed_at = NOW()
          WHERE session_id = $1 AND resumed_at IS NULL;
        `,
        [sessionId]
      );

      const totalPaused = await this.sumPausedSeconds(client, sessionId);

      const { rows } = await client.query(
        `
          UPDATE study_sessions 
          SET status = 'active', paused_seconds = $2
          WHERE id = $1
          RETURNING id AS session_id, status, paused_seconds;
        `,
        [sessionId, totalPaused]
      );

      await client.query('COMMIT');
      return rows[0];
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('[sessionsRepository] resumeSession failed', {
        sessionId,
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
      });
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
      `
        SELECT COALESCE(
          SUM(EXTRACT(EPOCH FROM (resumed_at - paused_at)))::integer, 
          0
        ) as total_seconds
        FROM study_session_pauses
        WHERE session_id = $1 AND resumed_at IS NOT NULL;
      `,
      [sessionId]
    );
    return rows[0].total_seconds;
  },

  async completeSession(session: StudySession, data: EndSessionDTO) {
    const valid = data.duration_minutes >= VALID_MINUTES_THRESHOLD;
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

      // ⚡ BYPASS SEGURO CORREGIDO: Si duration_minutes es 0 (cierres rápidos), actualizamos al estado nativo 'invalid'
      // y seteamos approval_status en 'rejected' para satisfacer al check constraint real de la BD.
      if (data.duration_minutes === 0) {
        const { rows } = await client.query(
          `
            UPDATE study_sessions
            SET
              status = 'invalid',
              valid = false,
              ended_at = $2,
              duration_minutes = 0,
              paused_seconds = $3,
              approval_status = 'rejected',
              updated_at = NOW()
            WHERE id = $1
            RETURNING id AS session_id, status, valid, duration_minutes;
          `,
          [session.id, endedAt, finalPausedSeconds]
        );

        await client.query('COMMIT');
        return rows[0];
      }

      // Si supera el umbral, usamos el estado permitido 'validated' y approval_status 'approved'
      const { rows } = await client.query(
        `
          UPDATE study_sessions
          SET
            status = CASE WHEN $2 THEN 'validated'::character varying ELSE 'invalid'::character varying END,
            valid = $2,
            ended_at = $3,
            duration_minutes = $4,
            paused_seconds = $5,
            approval_status = CASE WHEN $2 THEN 'approved'::character varying ELSE 'rejected'::character varying END,
            evidence_photo_url = CASE WHEN $2 AND $6::text IS NOT NULL THEN $6::text ELSE evidence_photo_url END,
            summary_text = CASE WHEN $2 AND $7::text IS NOT NULL THEN $7::text ELSE summary_text END,
            updated_at = NOW()
          WHERE id = $1
          RETURNING id AS session_id, status, valid, duration_minutes;
        `,
        [
          session.id,
          valid,
          endedAt,
          data.duration_minutes,
          finalPausedSeconds,
          data.evidence_photo_url ?? null,
          data.summary_text ?? null,
        ]
      );

      if (valid && data.duration_minutes > 0) {
        await client.query(
          `UPDATE profiles SET total_study_minutes = total_study_minutes + $2, updated_at = NOW() WHERE id = $1;`,
          [session.user_id, data.duration_minutes]
        );

        await updateUserStreakAfterValidSession(client, session.user_id, session.id);
        const weekYear = getWeekYear();

        await client.query(
          `
            INSERT INTO user_weekly_stats (user_id, week_year, total_minutes)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, week_year)
            DO UPDATE SET total_minutes = user_weekly_stats.total_minutes + EXCLUDED.total_minutes, updated_at = NOW();
          `,
          [session.user_id, weekYear, data.duration_minutes]
        );

        if (session.room_id) {
          await client.query(
            `
              INSERT INTO room_user_weekly_stats (room_id, user_id, week_year, total_minutes)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (room_id, user_id, week_year)
              DO UPDATE SET total_minutes = room_user_weekly_stats.total_minutes + EXCLUDED.total_minutes, updated_at = NOW();
            `,
            [session.room_id, session.user_id, weekYear, data.duration_minutes]
          );
        }
      }

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
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('[sessionsRepository] completeSession failed', {
        sessionId: session.id,
        message: error?.message,
        code: error?.code,
      });
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
};

async function updateUserStreakAfterValidSession(client: any, userId: string, sessionId: string) {
  await client.query(
    `
      WITH streak_state AS (
        SELECT
          EXISTS (
            SELECT 1 FROM study_sessions
            WHERE user_id = $1 AND id <> $2 AND status = 'validated' AND valid = true
              AND (ended_at AT TIME ZONE 'UTC')::date = (NOW() AT TIME ZONE 'UTC')::date
          ) AS has_valid_today,
          EXISTS (
            SELECT 1 FROM study_sessions
            WHERE user_id = $1 AND status = 'validated' AND valid = true
              AND (ended_at AT TIME ZONE 'UTC')::date = (NOW() AT TIME ZONE 'UTC')::date - INTERVAL '1 day'
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
    [userId, sessionId]
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
