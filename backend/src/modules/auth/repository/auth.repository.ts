import { pool } from '../../../common/config/db.js';
import type { RegisterProfileDTO, RegisteredProfile } from '../types/auth.types.js';

export const AuthRepository = {
  async findExistingProfile({ auth_user_id, email, username }: RegisterProfileDTO) {
    const query = `
      SELECT auth0_user_id, email, username
      FROM profiles
      WHERE auth0_user_id = $1 OR email = $2 OR username = $3
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [auth_user_id, email, username]);
    return rows[0] as
      | { auth0_user_id: string; email: string; username: string }
      | undefined;
  },

  async createProfile(data: RegisterProfileDTO): Promise<RegisteredProfile> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const profileQuery = `
        INSERT INTO profiles (
          auth0_user_id,
          email,
          auth_provider,
          username,
          streak_days,
          total_study_minutes,
          coins_balance,
          is_active
        )
        VALUES ($1, $2, 'auth0', $3, 0, 0, 0, true)
        RETURNING id, email, username;
      `;

      const { rows } = await client.query(profileQuery, [
        data.auth_user_id,
        data.email,
        data.username,
      ]);

      const profile = rows[0] as RegisteredProfile;

      await client.query(
        `
          INSERT INTO user_villages (
            user_id,
            village_level,
            central_object_stage,
            zoom_level,
            is_public,
            friends_can_visit
          )
          VALUES ($1, 1, 1, 1, true, true)
          ON CONFLICT (user_id) DO NOTHING;
        `,
        [profile.id]
      );

      await client.query('COMMIT');
      return profile;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};
