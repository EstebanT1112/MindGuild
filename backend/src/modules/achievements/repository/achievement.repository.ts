import { pool } from '../../../common/config/db.js';
import { walletRepository } from '../../wallet/repository/wallet.repository.js';
import type {
  Achievement,
  UserAchievement,
  AchievementId,
  AchievementStatus
} from '../types/achievement.types.js';

const DEFAULT_ACHIEVEMENT_REWARD_COINS = 3;

const rewardCoinsSql = (alias?: string) => {
  const column = alias ? `${alias}.reward_coins` : 'reward_coins';

  return `
    CASE
      WHEN COALESCE(${column}, 0) > 0 THEN ${column}
      ELSE ${DEFAULT_ACHIEVEMENT_REWARD_COINS}
    END::int
  `;
};

const medalTierSql = (alias?: string) => {
  const column = alias ? `${alias}.medal_tier` : 'medal_tier';

  return `
    CASE
      WHEN ${column} IN ('bronze', 'silver', 'gold') THEN ${column}
      ELSE 'bronze'
    END
  `;
};

export const achievementRepository = {
  //Busca logros activos por evento Prompt 1-REQ13
  async getActiveAchievementsByType(type: string): Promise<Achievement[]> {
    const { rows } = await pool.query(
      `
        SELECT
          id,
          name,
          description,
          type,
          target_value,
          ${rewardCoinsSql()} AS reward_coins,
          benefit_description,
          ${medalTierSql()} AS medal_tier
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

  async getTotalStudyMinutes(userId: string): Promise<number> {
    const { rows } = await pool.query(
      `
        SELECT COALESCE(total_study_minutes, 0)::int AS total
        FROM profiles
        WHERE id = $1
        LIMIT 1;
      `,
      [userId]
    );

    return Number(rows[0]?.total) || 0;
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
          target_value,
          ${rewardCoinsSql()} AS reward_coins,
          benefit_description,
          ${medalTierSql()} AS medal_tier
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
          ${rewardCoinsSql('a')} AS reward_coins,
          a.benefit_description,
          ${medalTierSql('a')} AS medal_tier,
          CASE
            WHEN a.type = 'session_completed' THEN (
              SELECT COUNT(*)::int
              FROM study_sessions ss
              WHERE ss.user_id = $1
                AND ss.status = 'completed'
                AND ss.valid = true
                AND ss.duration_minutes >= 60
            )
            WHEN a.type = 'streak_updated' THEN (
              SELECT COALESCE(p.streak_days, 0)::int
              FROM profiles p
              WHERE p.id = $1
              LIMIT 1
            )
            WHEN a.type = 'room_participation' THEN (
              SELECT COUNT(*)::int
              FROM room_members rm
              JOIN rooms r ON r.id = rm.room_id
              WHERE rm.user_id = $1
                AND rm.is_active = true
                AND r.is_active = true
            )
            WHEN a.type = 'study_minutes' THEN (
              SELECT COALESCE(p.total_study_minutes, 0)::int
              FROM profiles p
              WHERE p.id = $1
              LIMIT 1
            )
            ELSE 0
          END AS progress_value,
          ua.unlocked_at,
          ua.reward_claimed_at
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
      reward_coins: row.reward_coins,
      benefit_description: row.benefit_description ?? null,
      medal_tier: row.medal_tier ?? 'bronze',
      progress_value: Number(row.progress_value) || 0,
      progress_percentage: Math.min(
        100,
        Math.floor(((Number(row.progress_value) || 0) / Math.max(Number(row.target_value) || 1, 1)) * 100)
      ),
      //La linea de abajo convierte  null a false y date a true
      unlocked: !!row.unlocked_at,
      unlocked_at: row.unlocked_at ?? null,
      reward_claimed_at: row.reward_claimed_at ?? null,
    }));
  },

  async claimAchievementReward(userId: string, achievementId: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `
          SELECT
            ua.user_id,
            ua.achievement_id,
            ua.reward_claimed_at,
            a.name,
            ${rewardCoinsSql('a')} AS reward_coins
          FROM user_achievements ua
          INNER JOIN achievements a ON a.id = ua.achievement_id
          WHERE ua.user_id = $1
            AND ua.achievement_id = $2
          FOR UPDATE OF ua;
        `,
        [userId, achievementId]
      );

      const achievement = rows[0];

      if (!achievement) {
        throw new Error('Logro no desbloqueado');
      }

      const rewardCoins = Number(achievement.reward_coins) || 0;

      if (rewardCoins > 0) {
        await walletRepository.creditCoins(client, {
          userId,
          amount: rewardCoins,
          type: 'achievement_reward',
          referenceType: 'achievement',
          referenceId: achievementId,
          description: `Recompensa de logro: ${achievement.name}`,
        });
      }

      if (!achievement.reward_claimed_at) {
        await client.query(
          `
            UPDATE user_achievements
            SET reward_claimed_at = NOW()
            WHERE user_id = $1
              AND achievement_id = $2;
          `,
          [userId, achievementId]
        );
      }

      const coinsBalance = await getProfileCoinsBalance(client, userId);

      await client.query('COMMIT');

      return {
        achievement_id: achievementId,
        reward_coins: rewardCoins,
        coins_balance: coinsBalance,
        already_claimed: Boolean(achievement.reward_claimed_at),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};

async function getProfileCoinsBalance(client: { query: (text: string, params?: any[]) => Promise<any> }, userId: string): Promise<number> {
  const { rows } = await client.query(
    `
      SELECT COALESCE(coins_balance, 0)::int AS coins_balance
      FROM profiles
      WHERE id = $1
      LIMIT 1;
    `,
    [userId]
  );

  return Number(rows[0]?.coins_balance) || 0;
}
