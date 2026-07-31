import { pool } from '../../../common/config/db.js';

export type MissionFrequency = 'daily' | 'weekly';

export interface Mission {
  id: string;
  title: string;
  description: string | null;
  type: string;
  frequency: MissionFrequency;
  target_value: number;
  reward_coins: number;
  active: boolean;
  sort_order: number;
}

export interface MissionPeriod {
  daily: {
    key: string;
    expiresAt: Date;
  };
  weekly: {
    key: string;
    expiresAt: Date;
  };
}

export interface UserMissionRow {
  user_mission_id: string;
  mission_id: string;
  title: string;
  description: string | null;
  type: string;
  frequency: MissionFrequency;
  period_key: string;
  progress: number;
  target_value: number;
  completed: boolean;
  completed_at: string | null;
  claimed: boolean;
  claimed_at: string | null;
  reward_coins: number;
  expires_at: string | null;
  expired: boolean;
}

export interface CompletedMissionNotificationRow {
  user_mission_id: string;
  title: string;
  reward_coins: number;
}

const VISIBLE_EXPIRED_DAYS = 2;

export const missionsRepository = {
  async getActiveMissions(frequency?: MissionFrequency): Promise<Mission[]> {
    const params: any[] = [];
    const frequencyFilter = frequency ? `AND COALESCE(frequency, 'daily') = $1` : '';
    if (frequency) params.push(frequency);

    const { rows } = await pool.query(
      `
        SELECT
          id,
          title,
          description,
          type,
          COALESCE(frequency, 'daily') AS frequency,
          target_value,
          reward_coins,
          active,
          sort_order
        FROM missions
        WHERE COALESCE(active, true) = true
          ${frequencyFilter}
        ORDER BY sort_order ASC, title ASC;
      `,
      params
    );

    return rows as Mission[];
  },

  async assignMissionsToUserForPeriod(
    userId: string,
    missions: Mission[],
    periodKey: string,
    expiresAt: Date
  ): Promise<void> {
    if (missions.length === 0) return;

    for (const mission of missions) {
      await pool.query(
        `
          INSERT INTO user_missions (
            user_id,
            mission_id,
            period_key,
            expires_at,
            progress,
            completed,
            claimed
          )
          VALUES ($1, $2, $3, $4, 0, false, false)
          ON CONFLICT (user_id, mission_id, period_key) DO NOTHING;
        `,
        [userId, mission.id, periodKey, expiresAt]
      );
    }
  },

  async getUserMissionsForPeriods(
    userId: string,
    periodKeys: string[]
  ): Promise<UserMissionRow[]> {
    const { rows } = await pool.query(
      `
        SELECT
          um.id AS user_mission_id,
          m.id AS mission_id,
          m.title,
          m.description,
          m.type,
          COALESCE(m.frequency, 'daily') AS frequency,
          um.period_key,
          um.progress,
          m.target_value,
          um.completed,
          um.completed_at,
          COALESCE(um.claimed, false) AS claimed,
          um.claimed_at,
          m.reward_coins,
          um.expires_at,
          CASE
            WHEN um.expires_at IS NOT NULL AND um.expires_at <= NOW() THEN true
            ELSE false
          END AS expired
        FROM user_missions um
        INNER JOIN missions m ON m.id = um.mission_id
        WHERE um.user_id = $1
          AND (
            um.period_key = ANY($2)
            OR (
              um.expires_at IS NOT NULL
              AND um.expires_at <= NOW()
              AND um.expires_at >= NOW() - ($3::int * INTERVAL '1 day')
            )
          )
        ORDER BY
          expired ASC,
          COALESCE(m.frequency, 'daily') ASC,
          um.completed ASC,
          m.sort_order ASC,
          m.title ASC;
      `,
      [userId, periodKeys, VISIBLE_EXPIRED_DAYS]
    );

    return rows.map(mapUserMissionRow);
  },

  async getUserMissionById(userId: string, userMissionId: string): Promise<UserMissionRow | null> {
    const { rows } = await pool.query(
      `
        SELECT
          um.id AS user_mission_id,
          m.id AS mission_id,
          m.title,
          m.description,
          m.type,
          COALESCE(m.frequency, 'daily') AS frequency,
          um.period_key,
          um.progress,
          m.target_value,
          um.completed,
          um.completed_at,
          COALESCE(um.claimed, false) AS claimed,
          um.claimed_at,
          m.reward_coins,
          um.expires_at,
          CASE
            WHEN um.expires_at IS NOT NULL AND um.expires_at <= NOW() THEN true
            ELSE false
          END AS expired
        FROM user_missions um
        INNER JOIN missions m ON m.id = um.mission_id
        WHERE um.user_id = $1
          AND um.id = $2
        LIMIT 1;
      `,
      [userId, userMissionId]
    );

    return rows[0] ? mapUserMissionRow(rows[0]) : null;
  },

  async updateMissionProgressForCurrentPeriods(
    userId: string,
    missionType: string,
    incrementValue: number,
    periodKeys: string[]
  ): Promise<CompletedMissionNotificationRow[]> {
    const { rows } = await pool.query<CompletedMissionNotificationRow>(
      `
        WITH updated AS (
          UPDATE user_missions um
          SET
            progress = LEAST(m.target_value, um.progress + $3),
            completed = CASE
              WHEN (um.progress + $3) >= m.target_value THEN true
              ELSE um.completed
            END,
            completed_at = CASE
              WHEN (um.progress + $3) >= m.target_value AND um.completed = false THEN NOW()
              ELSE um.completed_at
            END
          FROM missions m
          WHERE um.mission_id = m.id
            AND um.user_id = $1
            AND m.type = $2
            AND um.period_key = ANY($4)
            AND um.completed = false
            AND (um.expires_at IS NULL OR um.expires_at > NOW())
          RETURNING
            um.id AS user_mission_id,
            m.title,
            COALESCE(m.reward_coins, 0)::int AS reward_coins,
            um.completed
        )
        SELECT user_mission_id, title, reward_coins
        FROM updated
        WHERE completed = true;
      `,
      [userId, missionType, incrementValue, periodKeys]
    );

    return rows;
  },

  async expireOldMissions(): Promise<void> {
    await pool.query(
      `
        UPDATE user_missions
        SET completed = false
        WHERE completed = false
          AND expires_at IS NOT NULL
          AND expires_at <= NOW();
      `
    );
  },
};

function mapUserMissionRow(row: any): UserMissionRow {
  return {
    user_mission_id: row.user_mission_id,
    mission_id: row.mission_id,
    title: row.title,
    description: row.description ?? null,
    type: row.type,
    frequency: row.frequency,
    period_key: row.period_key,
    progress: Number(row.progress) || 0,
    target_value: Number(row.target_value) || 1,
    completed: Boolean(row.completed),
    completed_at: row.completed_at ?? null,
    claimed: Boolean(row.claimed),
    claimed_at: row.claimed_at ?? null,
    reward_coins: Number(row.reward_coins) || 0,
    expires_at: row.expires_at ?? null,
    expired: Boolean(row.expired),
  };
}
