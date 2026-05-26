import { pool } from '../../../common/config/db.js';
import type {
  Achievement,
  UserAchievement,
  AchievementId,
  AchievementStatus
} from '../types/achievement.types.js';
export const achievementRepository = {
  //Busca logros activos por evento Prompt 1-REQ13
  async getActiveAchievementsByType(type: string): Promise<Achievement[]> {
    const { rows } = await pool.query(
      `
        SELECT id, name, description, type, target_value
        FROM achievements
        WHERE type = $1
        AND is_active = true;
      `,
      [type]
    );

    return rows;
  },
  //Busca logros ya desbloqueados rapidamente Prompt 1-REQ13
  async getUnlockedAchievements(userId: string): Promise<AchievementId[]> {
    const { rows } = await pool.query(
      `
        SELECT achievement_id
        FROM user_achievements
        WHERE user_id = $1;
      `,
      [userId]
    );

    return rows;
  },
  //Busca logros ya desbloqueados para el front Prompt 2-REQ14
  async getUserUnlockedAchievements(userId: string): Promise<UserAchievement[]> {
    const { rows } = await pool.query(
      `
        SELECT
          achievement_id,
          unlocked_at
        FROM user_achievements
        WHERE user_id = $1;
      `,
      [userId]
    );

    return rows;
  },
  //Obtengo el progreso de sesiones completadas
  async countCompletedSessions(userId: string):Promise<number> {
    const { rows } = await pool.query(
      `
        SELECT COUNT(*)::int as total
        FROM study_sessions
        WHERE user_id = $1
        AND status = 'completed'
        AND valid = true
        AND duration_minutes >= 60;
      `,
      [userId]
    );

    return rows[0]?.total ?? 0;
  },

  async getCurrentStreak(userId: string): Promise<number> {
    const { rows } = await pool.query(
      `
        SELECT streak_days
        FROM profiles
        WHERE id = $1
        LIMIT 1;
      `,
      [userId]
    );

    return rows[0]?.streak_days ?? 0;
  },

  async countActiveRoomMemberships(userId: string): Promise<number> {
    const { rows } = await pool.query(
      `
        SELECT COUNT(*)::int AS total
        FROM room_members rm
        JOIN rooms r ON r.id = rm.room_id
        WHERE rm.user_id = $1
          AND rm.is_active = true
          AND r.is_active = true;
      `,
      [userId]
    );

    return rows[0]?.total ?? 0;
  },

  //Persistencia de logros desbloqueados Prompt 2-REQ13
  async saveUnlockedAchievements(userId: string, achievementIds: string[]): Promise<UserAchievement[]> {
    if (achievementIds.length === 0) return [];

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const inserted = [];

      for (const achievementId of achievementIds) {
        const { rows } = await client.query(
          `
            INSERT INTO user_achievements (
              user_id,
              achievement_id,
              unlocked_at
            )
            VALUES ($1, $2, NOW())
            ON CONFLICT (user_id, achievement_id)
            DO NOTHING
            RETURNING *;
          `,
          [userId, achievementId]
        );

        if (rows[0]) {
          inserted.push(rows[0]);
        }
      }

      await client.query('COMMIT');

      return inserted;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  // REQ 14 - Lista todos los achievements activos
  async getAllActiveAchievements(): Promise<Achievement[]> {

    const { rows } = await pool.query(
      `
        SELECT
          id,
          name,
          description,
          badge_icon,
          type,
          target_value
        FROM achievements
        WHERE is_active = true;
      `
    );

    return rows;
  },

  //REQ 14- PROMPT 3
  // LEFT JOIN permite incluir achievements pendientes
  // aunque el usuario todavía no los haya desbloqueado
  async getUserAchievements(userId: string):Promise<AchievementStatus[]> {
    const { rows } = await pool.query(
      `
        SELECT
          a.id,
          a.name,
          a.description,
          a.badge_icon,
          a.type,
          a.target_value,
          ua.unlocked_at
        FROM achievements a
        LEFT JOIN user_achievements ua
          ON ua.achievement_id = a.id
          AND ua.user_id = $1
        WHERE a.is_active = true
        ORDER BY ua.unlocked_at DESC NULLS LAST;
      `,
      [userId]
    );

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      badge_icon: row.badge_icon,
      type: row.type,
      target_value: row.target_value,
      //La linea de abajo convierte  null a false y date a true
      unlocked: !!row.unlocked_at,
      unlocked_at: row.unlocked_at ?? null,
    }));
  },
};
