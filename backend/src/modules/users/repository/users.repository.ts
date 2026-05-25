import { pool } from '../../../common/config/db.js';
import type { BasicProfile, UpdateProfileDTO, VillageState, WeeklyStats } from '../types/users.types.js';

export const UsersRepository = {
  async findProfileById(userId: string): Promise<BasicProfile | null> {
    const { rows } = await pool.query(
      `
        SELECT id, username, email, avatar_url, bio, streak_days, total_study_minutes, expo_push_token
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
        RETURNING id, username, email, avatar_url, bio, streak_days, total_study_minutes;
      `,
      values
    );

    return (rows[0] as BasicProfile | undefined) ?? null;
  },
};
