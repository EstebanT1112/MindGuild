import { pool } from '../../../common/config/db.js';
import { notificationService } from '../../notifications/service/notification.service.js';
import { walletRepository } from '../../wallet/repository/wallet.repository.js';
import {
  missionsRepository,
  type Mission,
  type MissionFrequency,
  type MissionPeriod,
  type UserMissionRow,
} from '../repository/missions.repository.js';

const DAILY_MISSION_LIMIT = 2;
const DAILY_MISSION_MIN = 1;
const WEEKLY_MISSION_LIMIT = 3;
const APP_TIMEZONE = 'America/Argentina/Buenos_Aires';

export interface GroupedMissions {
  daily: UserMissionRow[];
  weekly: UserMissionRow[];
  expired: UserMissionRow[];
}

export const missionsService = {
  async getAndAssignMissions(userId: string, frequency: 'daily' | 'weekly' | 'all' = 'all'): Promise<GroupedMissions> {
    if (!userId) {
      throw new Error('El ID de usuario es requerido para procesar misiones.');
    }

    const periods = getCurrentMissionPeriods();

    if (frequency === 'all' || frequency === 'daily') {
      const dailyMissions = await missionsRepository.getActiveMissions('daily');
      await missionsRepository.assignMissionsToUserForPeriod(
        userId,
        selectMissions(dailyMissions, DAILY_MISSION_LIMIT, DAILY_MISSION_MIN),
        periods.daily.key,
        periods.daily.expiresAt
      );
    }

    if (frequency === 'all' || frequency === 'weekly') {
      const weeklyMissions = await missionsRepository.getActiveMissions('weekly');
      await missionsRepository.assignMissionsToUserForPeriod(
        userId,
        selectMissions(weeklyMissions, WEEKLY_MISSION_LIMIT),
        periods.weekly.key,
        periods.weekly.expiresAt
      );
    }

    return groupMissions(
      await missionsRepository.getUserMissionsForPeriods(userId, [
        periods.daily.key,
        periods.weekly.key,
      ]),
      frequency
    );
  },

  async getMissionDetail(userId: string, userMissionId: string): Promise<UserMissionRow> {
    if (!userId) {
      throw new Error('El ID de usuario es requerido para consultar la mision.');
    }

    if (!userMissionId) {
      throw new Error('El ID de mision de usuario es requerido.');
    }

    const mission = await missionsRepository.getUserMissionById(userId, userMissionId);

    if (!mission) {
      throw new Error('Mision no encontrada');
    }

    return mission;
  },

  async updateProgress(userId: string, missionType: string, incrementValue: number): Promise<GroupedMissions> {
    if (!userId) {
      throw new Error('El ID de usuario es requerido para actualizar el progreso.');
    }
    if (!missionType) {
      throw new Error('El tipo de mision es requerido para procesar el incremento.');
    }
    if (incrementValue <= 0) {
      throw new Error('El valor de incremento debe ser mayor a cero.');
    }

    const periods = getCurrentMissionPeriods();

    const completedMissions = await missionsRepository.updateMissionProgressForCurrentPeriods(
      userId,
      missionType,
      incrementValue,
      [periods.daily.key, periods.weekly.key]
    );

    for (const mission of completedMissions) {
      try {
        await notificationService.notifyMissionCompleted({
          userId,
          userMissionId: mission.user_mission_id,
          title: mission.title,
          rewardCoins: Number(mission.reward_coins) || 0,
        });
        const rewardCoins = Number(mission.reward_coins) || 0;
        if (rewardCoins > 0) {
          await notificationService.notifyRewardAvailable({
            userId,
            referenceType: 'user_mission',
            referenceId: mission.user_mission_id,
            title: 'Recompensa disponible',
            body: `Tenes ${rewardCoins} monedas para reclamar por "${mission.title}".`,
          });
        }
      } catch (error) {
        console.error('Error notifying mission completion', error);
      }
    }

    return this.getAndAssignMissions(userId);
  },

  async claimMissionReward(userId: string, userMissionId: string) {
    if (!userId) {
      throw new Error('El ID de usuario es requerido para reclamar la mision.');
    }

    if (!userMissionId) {
      throw new Error('El ID de mision de usuario es requerido.');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `
          SELECT
            um.id AS user_mission_id,
            um.completed,
            COALESCE(um.claimed, false) AS claimed,
            um.expires_at,
            m.id AS mission_id,
            m.title,
            m.reward_coins
          FROM user_missions um
          INNER JOIN missions m ON m.id = um.mission_id
          WHERE um.id = $1
            AND um.user_id = $2
          FOR UPDATE OF um;
        `,
        [userMissionId, userId]
      );

      const mission = rows[0];

      if (!mission) {
        throw new Error('Mision no encontrada');
      }

      if (!mission.completed) {
        throw new Error('La mision todavia no esta completada');
      }

      if (mission.claimed) {
        throw new Error('La recompensa de esta mision ya fue reclamada');
      }

      const rewardCoins = Number(mission.reward_coins) || 0;

      let coinsBalance = null;
      if (rewardCoins > 0) {
        coinsBalance = await walletRepository.creditCoins(client, {
          userId,
          amount: rewardCoins,
          type: 'mission_reward',
          referenceType: 'user_mission',
          referenceId: userMissionId,
          description: `Recompensa de mision: ${mission.title}`,
        });
      }

      const { rows: updatedRows } = await client.query(
        `
          UPDATE user_missions
          SET claimed = true,
              claimed_at = NOW()
          WHERE id = $1
            AND user_id = $2
          RETURNING claimed_at;
        `,
        [userMissionId, userId]
      );

      await client.query('COMMIT');

      return {
        user_mission_id: userMissionId,
        reward_coins: rewardCoins,
        coins_balance: coinsBalance,
        claimed_at: updatedRows[0]?.claimed_at ?? null,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async expireOldMissions(): Promise<void> {
    await missionsRepository.expireOldMissions();
  },

  async resetAllUserMissions(): Promise<void> {
    await this.expireOldMissions();
  },
};

function selectMissions(missions: Mission[], limit: number, minimum = 0): Mission[] {
  if (missions.length < minimum) {
    throw new Error(`No hay suficientes misiones activas para asignar el minimo requerido (${minimum}).`);
  }

  return missions.slice(0, limit);
}

function groupMissions(missions: UserMissionRow[], frequency: 'daily' | 'weekly' | 'all'): GroupedMissions {
  const visible = frequency === 'all'
    ? missions
    : missions.filter(mission => mission.frequency === frequency || mission.expired);

  return {
    daily: visible
      .filter(mission => !mission.expired && mission.frequency === 'daily')
      .slice(0, DAILY_MISSION_LIMIT),
    weekly: visible
      .filter(mission => !mission.expired && mission.frequency === 'weekly')
      .slice(0, WEEKLY_MISSION_LIMIT),
    expired: visible.filter(mission => mission.expired),
  };
}

function getCurrentMissionPeriods(now = new Date()): MissionPeriod {
  const local = getArgentinaDateParts(now);
  const dailyKey = local.dateKey;
  const nextDayStartUtc = argentinaLocalDateStartUtc(local.year, local.month, local.day + 1);

  const week = getIsoWeek(local.year, local.month, local.day);
  const weekStartUtc = argentinaLocalDateStartUtc(local.year, local.month, local.day - (week.weekday - 1));
  const nextWeekStartUtc = new Date(weekStartUtc.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    daily: {
      key: dailyKey,
      expiresAt: nextDayStartUtc,
    },
    weekly: {
      key: `${week.year}-W${String(week.week).padStart(2, '0')}`,
      expiresAt: nextWeekStartUtc,
    },
  };
}

function getArgentinaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = Number(parts.find(part => part.type === 'year')?.value);
  const month = Number(parts.find(part => part.type === 'month')?.value);
  const day = Number(parts.find(part => part.type === 'day')?.value);

  return {
    year,
    month,
    day,
    dateKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
}

function argentinaLocalDateStartUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0));
}

function getIsoWeek(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const weekYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return {
    year: weekYear,
    week,
    weekday,
  };
}
