import { pool } from '../../../common/config/db.js';
import type { BasicProfile, UpdateProfileDTO, VillageState, WeeklyStats } from '../types/users.types.js';

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
    // Mantiene la racha consistente al consultar perfil sin depender de un job externo.
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
    // Obtiene los datos base editables y calculados desde profiles.
    const { rows } = await pool.query(
      `
        SELECT id, username, email, avatar_url, bio, streak_days, total_study_minutes, coins_balance, expo_push_token
        FROM profiles
        WHERE id = $1 AND is_active = true
        LIMIT 1;
      `,
      [userId]
    );

    return (rows[0] as BasicProfile | undefined) ?? null;
  },

  async findProfileByUsername(username: string): Promise<{ id: string } | null> {
    // Verifica unicidad de username antes de actualizar.
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
    // Lee los acumulados semanales; si no hay fila, el service aplica defaults.
    const { rows } = await pool.query(
      `
        SELECT total_minutes, consistency_score, academic_score, bosses_count
        FROM user_weekly_stats
        WHERE user_id = $1 AND week_year = $2
        LIMIT 1;
      `,
      [userId, weekYear]
    );

    return (rows[0] as WeeklyStats | undefined) ?? null;
  },

  async getVillageState(userId: string): Promise<VillageState | null> {
    // Lee el nivel visual de aldea; si falta, el service devuelve nivel 1.
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
    // Devuelve proveedores vinculados y contempla usuarios previos sin auth_identities.
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

  async hasValidSessionToday(userId: string): Promise<boolean> {
    const { rows } = await pool.query(
      `
        SELECT 1
        FROM study_sessions
        WHERE user_id = $1
          AND status IN ('pending', 'completed', 'validated')
          AND (ended_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::date =
            (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
        
        UNION

        SELECT 1
        FROM user_streak_protections
        WHERE user_id = $1
          AND protected_date = (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
          AND applied_at IS NOT NULL
        LIMIT 1;
      `,
      [userId]
    );

    return rows.length > 0;
  },

  //REQ 15 PUSH
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
    // Construye un UPDATE dinamico para modificar solo campos enviados.
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
    
    //Lo agrego para el REQ 15
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
        RETURNING id, username, email, avatar_url, bio, streak_days, total_study_minutes, coins_balance;
      `,
      values
    );

    return (rows[0] as BasicProfile | undefined) ?? null;
  },
};
