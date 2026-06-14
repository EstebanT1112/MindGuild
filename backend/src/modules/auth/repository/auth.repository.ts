import { pool } from '../../../common/config/db.js';
import type { AuthIdentity, RegisterProfileDTO, RegisteredProfile } from '../types/auth.types.js';

export const AuthRepository = {
  async findExistingProfile({ auth_user_id, email, username }: RegisterProfileDTO) {
    // Busca duplicados antes del insert para devolver errores de negocio claros.
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
    // Crea el perfil y su aldea inicial en una transaccion para evitar estados parciales.
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
          INSERT INTO auth_identities (
            profile_id,
            provider,
            provider_user_id,
            email,
            email_verified
          )
          VALUES ($1, $2, $3, $4, false)
          ON CONFLICT DO NOTHING;
        `,
        [profile.id, extractProvider(data.auth_user_id), data.auth_user_id, data.email]
      );

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

  async findProfileByAuth0UserId(authUserId: string): Promise<RegisteredProfile | null> {
    // Resuelve el perfil local a partir del sub de Auth0.
    const { rows } = await pool.query(
      `
        SELECT id, email, username
        FROM profiles
        WHERE auth0_user_id = $1 AND is_active = true
        LIMIT 1;
      `,
      [authUserId]
    );

    return (rows[0] as RegisteredProfile | undefined) ?? null;
  },

  async findProfileById(profileId: string): Promise<RegisteredProfile | null> {
    const { rows } = await pool.query(
      `
        SELECT id, email, username
        FROM profiles
        WHERE id = $1 AND is_active = true
        LIMIT 1;
      `,
      [profileId]
    );

    return (rows[0] as RegisteredProfile | undefined) ?? null;
  },

  async findProfileByEmail(email: string): Promise<RegisteredProfile | null> {
    // Permite vincular social login a un perfil existente sin duplicar usuarios.
    const { rows } = await pool.query(
      `
        SELECT id, email, username
        FROM profiles
        WHERE email = $1 AND is_active = true
        LIMIT 1;
      `,
      [email]
    );

    return (rows[0] as RegisteredProfile | undefined) ?? null;
  },

  async findProfileByIdentity(provider: string, providerUserId: string): Promise<RegisteredProfile | null> {
    // Resuelve perfiles por identidad externa, fuente principal para multiples proveedores.
    const { rows } = await pool.query(
      `
        SELECT p.id, p.email, p.username
        FROM auth_identities ai
        INNER JOIN profiles p ON p.id = ai.profile_id
        WHERE ai.provider = $1
          AND ai.provider_user_id = $2
          AND p.is_active = true
        LIMIT 1;
      `,
      [provider, providerUserId]
    );

    return (rows[0] as RegisteredProfile | undefined) ?? null;
  },

  async findIdentity(provider: string, providerUserId: string): Promise<AuthIdentity | null> {
    const { rows } = await pool.query(
      `
        SELECT id, profile_id, provider, provider_user_id, email, email_verified
        FROM auth_identities
        WHERE provider = $1
          AND provider_user_id = $2
        LIMIT 1;
      `,
      [provider, providerUserId]
    );

    return (rows[0] as AuthIdentity | undefined) ?? null;
  },

  async createAuthIdentity(input: {
    profileId: string;
    provider: string;
    providerUserId: string;
    email: string;
    emailVerified: boolean;
  }): Promise<AuthIdentity> {
    // Vincula una identidad externa con un perfil local existente.
    const { rows } = await pool.query(
      `
        INSERT INTO auth_identities (
          profile_id,
          provider,
          provider_user_id,
          email,
          email_verified
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (provider, provider_user_id)
        DO UPDATE SET
          email = EXCLUDED.email,
          email_verified = EXCLUDED.email_verified
        RETURNING id, profile_id, provider, provider_user_id, email, email_verified;
      `,
      [input.profileId, input.provider, input.providerUserId, input.email, input.emailVerified]
    );

    return rows[0] as AuthIdentity;
  },

  async usernameExists(username: string): Promise<boolean> {
    const { rows } = await pool.query(
      `
        SELECT 1
        FROM profiles
        WHERE username = $1
        LIMIT 1;
      `,
      [username]
    );

    return rows.length > 0;
  },

  async getAuthProviders(profileId: string): Promise<string[]> {
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
      [profileId]
    );

    return rows
      .map(row => row.provider)
      .filter((provider): provider is string => Boolean(provider));
  },

  async updateLastLoginAt(profileId: string): Promise<void> {
    // Registra actividad de login sin modificar datos editables del perfil.
    await pool.query(
      `
        UPDATE profiles
        SET last_login_at = NOW()
        WHERE id = $1;
      `,
      [profileId]
    );
  },
};

function extractProvider(authUserId: string): string {
  return authUserId.includes('|') ? authUserId.split('|')[0] : 'auth0';
}
