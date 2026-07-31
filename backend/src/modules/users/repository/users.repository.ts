import { pool } from '../../../common/config/db.js';
import type { BasicProfile, StreakProtectionState, UpdateProfileDTO, VillageState, WeeklyStats } from '../types/users.types.js';

const APP_TIMEZONE = 'America/Argentina/Buenos_Aires';

export const UsersRepository = {
  async applyDueStreakProtections(userId: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows: protectionRows } = await client.query(
        `
          SELECT protected_date
          FROM user_streak_protections
          WHERE user_id = $1
            AND protected_date <= (NOW() AT TIME ZONE $2)::date
            AND applied_at IS NULL
          ORDER BY protected_date ASC
          FOR UPDATE;
        `,
        [userId, APP_TIMEZONE]
      );

      for (const protection of protectionRows) {
        const protectedDate = protection.protected_date;

        await client.query(
          `
            UPDATE user_streak_protections
            SET applied_at = NOW()
            WHERE user_id = $1
              AND protected_date = $2::date
              AND applied_at IS NULL;
          `,
          [userId, protectedDate]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async resetExpiredStreak(userId: string): Promise<void> {
    await pool.query(
      `
        UPDATE profiles
        SET
          streak_days = 0,
          updated_at = NOW()
        WHERE id = $1
          AND streak_days > 0
          AND NOT EXISTS (
            SELECT 1
            FROM study_sessions
            WHERE user_id = $1
              AND status IN ('pending', 'completed', 'validated')
              AND (ended_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::date BETWEEN
                (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date - INTERVAL '1 day'
                AND (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
          )
          AND NOT EXISTS (
            SELECT 1
            FROM user_streak_protections
            WHERE user_id = $1
              AND applied_at IS NOT NULL
              AND protected_date BETWEEN
                (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date - INTERVAL '1 day'
                AND (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
          );
      `,
      [userId]
    );
  },

  async findProfileById(userId: string): Promise<BasicProfile | null> {
    const { rows } = await pool.query(
      `
        SELECT id, username, email, avatar_url, bio, streak_days, total_study_minutes, coins_balance, expo_push_token, last_login_at
        FROM profiles
        WHERE id = $1 AND is_active = true
        LIMIT 1;
      `,
      [userId]
    );

    return (rows[0] as BasicProfile | undefined) ?? null;
  },

  async findProfileByUsername(username: string): Promise<{ id: string } | null> {
    const { rows } = await pool.query(
      `
        SELECT id
        FROM profiles
        WHERE username = $1
        LIMIT 1;
      `,
      [username]
    );

    return (rows[0] as { id: string } | undefined) ?? null;
  },

  async getWeeklyStats(userId: string, weekYear: string): Promise<WeeklyStats | null> {
    const { rows } = await pool.query(
      `
        SELECT total_minutes, consistency_score, academic_score, bosses_count, 0 AS coins_earned
        FROM user_weekly_stats
        WHERE user_id = $1 AND week_year = $2
        LIMIT 1;
      `,
      [userId, weekYear]
    );

    return (rows[0] as WeeklyStats | undefined) ?? null;
  },

  async getWeeklyCoinsEarned(userId: string): Promise<number> {
    const { rows } = await pool.query(
      `
        WITH current_week AS (
          SELECT
            date_trunc('week', (NOW() AT TIME ZONE $2)::timestamp) AS starts_at,
            date_trunc('week', (NOW() AT TIME ZONE $2)::timestamp) + INTERVAL '7 days' AS ends_at
        )
        SELECT COALESCE(SUM(wm.amount), 0)::int AS coins_earned
        FROM wallet_movements wm
        CROSS JOIN current_week cw
        WHERE wm.user_id = $1
          AND wm.amount > 0
          AND (wm.created_at AT TIME ZONE $2) >= cw.starts_at
          AND (wm.created_at AT TIME ZONE $2) < cw.ends_at;
      `,
      [userId, 'America/Argentina/Buenos_Aires']
    );

    return Number(rows[0]?.coins_earned ?? 0);
  },

  async getWeeklyDailyMinutes(userId: string): Promise<Array<{ day: string; minutes: number }>> {
    const { rows } = await pool.query(
      `
        WITH current_week AS (
          SELECT date_trunc('week', (NOW() AT TIME ZONE $2)::timestamp)::date AS starts_on
        ),
        week_days AS (
          SELECT
            generate_series(0, 6) AS day_index,
            starts_on + generate_series(0, 6) AS day_date
          FROM current_week
        ),
        session_minutes AS (
          SELECT
            ((COALESCE(ended_at, updated_at, created_at) AT TIME ZONE $2)::date) AS session_date,
            COALESCE(SUM(duration_minutes), 0)::int AS minutes
          FROM study_sessions
          CROSS JOIN current_week cw
          WHERE user_id = $1
            AND valid = true
            AND duration_minutes > 0
            AND ((COALESCE(ended_at, updated_at, created_at) AT TIME ZONE $2)::date) >= cw.starts_on
            AND ((COALESCE(ended_at, updated_at, created_at) AT TIME ZONE $2)::date) < cw.starts_on + 7
          GROUP BY session_date
        )
        SELECT
          CASE wd.day_index
            WHEN 0 THEN 'Lun'
            WHEN 1 THEN 'Mar'
            WHEN 2 THEN 'Mie'
            WHEN 3 THEN 'Jue'
            WHEN 4 THEN 'Vie'
            WHEN 5 THEN 'Sab'
            ELSE 'Dom'
          END AS day,
          COALESCE(sm.minutes, 0)::int AS minutes
        FROM week_days wd
        LEFT JOIN session_minutes sm ON sm.session_date = wd.day_date
        ORDER BY wd.day_index ASC;
      `,
      [userId, 'America/Argentina/Buenos_Aires']
    );

    return rows.map(row => ({
      day: String(row.day),
      minutes: Number(row.minutes) || 0,
    }));
  },

  async getVillageState(userId: string): Promise<VillageState | null> {
    const { rows } = await pool.query(
      `
        SELECT village_level
        FROM user_villages
        WHERE user_id = $1
        LIMIT 1;
      `,
      [userId]
    );

    return (rows[0] as VillageState | undefined) ?? null;
  },

  async getAuthProviders(userId: string): Promise<string[]> {
    const { rows } = await pool.query(
      `
        SELECT provider
        FROM auth_identities
        WHERE profile_id = $1

        UNION

        SELECT
          CASE
            WHEN auth0_user_id LIKE '%|%' THEN split_part(auth0_user_id, '|', 1)
            WHEN auth_provider IS NOT NULL THEN auth_provider
            ELSE 'auth0'
          END AS provider
        FROM profiles
        WHERE id = $1
          AND is_active = true;
      `,
      [userId]
    );

    return rows
      .map(row => row.provider)
      .filter((provider): provider is string => Boolean(provider));
  },

  async hasCompletedValidSessionToday(userId: string): Promise<boolean> {
    const { rows } = await pool.query(
      `
        SELECT 1
        FROM study_sessions
        WHERE user_id = $1
          AND status IN ('pending', 'completed', 'validated')
          AND (ended_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::date =
            (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
        LIMIT 1;
      `,
      [userId]
    );

    return rows.length > 0;
  },

  async getStreakProtectionState(userId: string): Promise<StreakProtectionState> {
    const { rows } = await pool.query(
      `
        SELECT
          MAX(protected_date)::text AS protected_until,
          BOOL_OR(protected_date = (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date) AS active_today
        FROM user_streak_protections
        WHERE user_id = $1
          AND protected_date >= (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
      `,
      [userId]
    );

    return {
      active: Boolean(rows[0]?.active_today),
      protected_until: rows[0]?.protected_until ?? null,
    };
  },

  async getExpoPushToken(userId: string) {
    const { rows } = await pool.query(
      `
        SELECT expo_push_token
        FROM profiles
        WHERE id = $1
        LIMIT 1;
      `,
      [userId]
    );

    return rows[0]?.expo_push_token ?? null;
  },

  async updateProfile(userId: string, data: UpdateProfileDTO): Promise<BasicProfile | null> {
    const fields: string[] = [];
    const values: Array<string | null> = [];

    if (Object.prototype.hasOwnProperty.call(data, 'username')) {
      values.push(data.username ?? null);
      fields.push(`username = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(data, 'avatar_url')) {
      values.push(data.avatar_url ?? null);
      fields.push(`avatar_url = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(data, 'bio')) {
      values.push(data.bio ?? null);
      fields.push(`bio = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(data, 'expo_push_token')) {
      values.push(data.expo_push_token ?? null);
      fields.push(`expo_push_token = $${values.length}`);
    }

    if (fields.length === 0) {
      return this.findProfileById(userId);
    }

    values.push(userId);

    const { rows } = await pool.query(
      `
        UPDATE profiles
        SET ${fields.join(', ')}
        WHERE id = $${values.length} AND is_active = true
        RETURNING id, username, email, avatar_url, bio, streak_days, total_study_minutes, coins_balance, last_login_at;
      `,
      values
    );

    return (rows[0] as BasicProfile | undefined) ?? null;
  },
};