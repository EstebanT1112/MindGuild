import { pool } from '../../../common/config/db.js';
import { BattleRoyaleRepository } from '../../battle-royale/repository/battle-royale.repository.js';
import { RoomsRepository } from '../../rooms/repository/rooms.repository.js';
import { rankingsRepository } from '../../rankings/repository/ranking.repository.js';
import { rankingsService } from '../../rankings/service/ranking.service.js';
import { TeamsRepository } from '../../teams/repository/teams.repository.js';
import { notificationService } from './notification.service.js';
import type { RankingType } from '../../rankings/types/ranking.types.js';

type ActiveRoomRow = {
  id: string;
  name: string;
  mode: 'survival' | 'battle_royale';
  teams_enabled: boolean | null;
};

type QuizNotificationRow = {
  id: string;
  room_id: string;
  title: string | null;
};

type TeamMemberRow = {
  user_id: string;
  team_id: string;
  team_name: string;
};

type RankingSnapshotRow = {
  position: number;
  leader_user_id: string | null;
};

type JobRankingEntry = {
  user_id: string;
  username: string;
  position: number;
};

const RANKING_TYPES: RankingType[] = ['time', 'qa', 'academic'];

export const notificationJobsService = {
  async runScheduledNotifications(): Promise<{
    weeklyQuizOpened: number;
    weeklyValidationOpened: number;
    rankingChanged: number;
    weekClosing: number;
    teamNeedsPoints: number;
  }> {
    const [
      weeklyQuizOpened,
      weeklyValidationOpened,
      rankingChanged,
      weekClosing,
      teamNeedsPoints,
    ] = await Promise.all([
      notifyWeeklyQuizOpened(),
      notifyWeeklyValidationOpened(),
      notifyRankingChanges(),
      notifyWeekClosing(),
      notifyTeamNeedsPoints(),
    ]);

    return {
      weeklyQuizOpened,
      weeklyValidationOpened,
      rankingChanged,
      weekClosing,
      teamNeedsPoints,
    };
  },
};

async function notifyWeeklyQuizOpened(): Promise<number> {
  const { rows: quizzes } = await pool.query<QuizNotificationRow>(
    `
      SELECT q.id, q.room_id, q.title
      FROM quizzes q
      JOIN rooms r ON r.id = q.room_id
      WHERE r.is_active = true
        AND r.mode = 'battle_royale'
        AND q.opens_at <= now()
        AND q.closes_at > now()
        AND q.status IN ('scheduled', 'open', 'in_validation');
    `
  );

  let created = 0;

  for (const quiz of quizzes) {
    const members = await RoomsRepository.getActiveMembers(quiz.room_id);

    for (const member of members) {
      const lockKey = `weekly_quiz_opened:${quiz.id}:${member.id}`;
      if (!(await acquireEventLock(lockKey))) continue;

      await notificationService.notifyWeeklyQuizOpened({
        userId: member.id,
        quizId: quiz.id,
        quizTitle: quiz.title ?? 'Quiz semanal',
      });
      created += 1;
    }
  }

  return created;
}

async function notifyWeeklyValidationOpened(): Promise<number> {
  const { rows: quizzes } = await pool.query<QuizNotificationRow>(
    `
      SELECT q.id, q.room_id, q.title
      FROM quizzes q
      JOIN rooms r ON r.id = q.room_id
      WHERE r.is_active = true
        AND r.mode = 'battle_royale'
        AND q.closes_at <= now()
        AND COALESCE(q.validation_closes_at, q.closes_at + interval '24 hours') > now()
        AND q.status IN ('scheduled', 'open', 'closed', 'in_validation');
    `
  );

  let created = 0;

  for (const quiz of quizzes) {
    const members = await RoomsRepository.getActiveMembers(quiz.room_id);

    for (const member of members) {
      const validationItems = await BattleRoyaleRepository.listValidationItems(quiz.room_id, member.id);
      if (validationItems.length === 0) continue;

      const lockKey = `weekly_validation_opened:${quiz.id}:${member.id}`;
      if (!(await acquireEventLock(lockKey))) continue;

      await notificationService.notifyWeeklyValidationOpened({
        userId: member.id,
        quizId: quiz.id,
        quizTitle: quiz.title ?? 'Quiz semanal',
      });
      created += 1;
    }
  }

  return created;
}

async function notifyRankingChanges(): Promise<number> {
  const weekYear = rankingsService.getCurrentWeekYear();
  const rooms = await getActiveRooms();
  let created = 0;

  for (const room of rooms) {
    const rankingTypes = getRoomRankingTypes(room.mode);

    for (const rankingType of rankingTypes) {
      const ranking = await getRoomRanking(room.id, rankingType, weekYear);
      const leader = ranking[0];
      if (!leader) continue;

      for (const entry of ranking) {
        const previous = await getRankingSnapshot(entry.user_id, room.id, rankingType, weekYear);
        await upsertRankingSnapshot({
          userId: entry.user_id,
          roomId: room.id,
          rankingType,
          weekYear,
          position: entry.position,
          leaderUserId: leader.user_id,
        });

        if (!previous || entry.position <= previous.position) continue;

        await notificationService.notifyRankingChanged({
          userId: entry.user_id,
          roomId: room.id,
          position: entry.position,
          leaderName: leader.username,
        });
        created += 1;
      }
    }
  }

  return created;
}

async function notifyWeekClosing(): Promise<number> {
  if (!isWeekClosingWindow()) return 0;

  const weekYear = rankingsService.getCurrentWeekYear();
  const rooms = await getActiveRooms();
  let created = 0;

  for (const room of rooms) {
    const members = await RoomsRepository.getActiveMembers(room.id);

    for (const member of members) {
      const lockKey = `week_closing:${weekYear}:${room.id}:${member.id}`;
      if (!(await acquireEventLock(lockKey))) continue;

      await notificationService.notifyWeekClosing({
        userId: member.id,
        roomId: room.id,
      });
      created += 1;
    }
  }

  return created;
}

async function notifyTeamNeedsPoints(): Promise<number> {
  const todayKey = getLocalDateKey();
  const weekYear = rankingsService.getCurrentWeekYear();
  const rooms = (await getActiveRooms()).filter(room => room.teams_enabled);
  let created = 0;

  for (const room of rooms) {
    const ranking = await TeamsRepository.getTeamRanking({
      roomId: room.id,
      weekYear,
      mode: room.mode,
    });
    const leader = ranking[0];
    if (!leader || ranking.length < 2) continue;

    const membersByTeam = await getActiveTeamMembers(room.id);

    for (const member of membersByTeam) {
      if (member.team_id === leader.team_id) continue;

      const lockKey = `team_needs_points:${todayKey}:${room.id}:${member.team_id}:${member.user_id}`;
      if (!(await acquireEventLock(lockKey))) continue;

      await notificationService.notifyTeamNeedsPoints({
        userId: member.user_id,
        roomId: room.id,
        teamName: member.team_name,
        leaderName: leader.team_name,
      });
      created += 1;
    }
  }

  return created;
}

async function getActiveRooms(): Promise<ActiveRoomRow[]> {
  const { rows } = await pool.query<ActiveRoomRow>(
    `
      SELECT id, name, mode, COALESCE(teams_enabled, false) AS teams_enabled
      FROM rooms
      WHERE is_active = true;
    `
  );

  return rows;
}

async function getRoomRanking(roomId: string, rankingType: RankingType, weekYear: string): Promise<JobRankingEntry[]> {
  const rawData = await rankingsRepository.getRankingData(rankingType, [weekYear], roomId);

  return rawData.map((item: any, index: number) => ({
    user_id: item.id || item.user_id,
    username: item.username,
    position: index + 1,
  }));
}

async function getActiveTeamMembers(roomId: string): Promise<TeamMemberRow[]> {
  const { rows } = await pool.query<TeamMemberRow>(
    `
      SELECT tm.user_id, tm.team_id, t.name AS team_name
      FROM team_members tm
      JOIN teams t
        ON t.id = tm.team_id
       AND t.room_id = tm.room_id
       AND t.is_active = true
      JOIN room_members rm
        ON rm.room_id = tm.room_id
       AND rm.user_id = tm.user_id
       AND rm.is_active = true
      WHERE tm.room_id = $1
        AND tm.is_active = true;
    `,
    [roomId]
  );

  return rows;
}

async function acquireEventLock(eventKey: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `
      INSERT INTO notification_event_locks (event_key)
      VALUES ($1)
      ON CONFLICT (event_key) DO NOTHING;
    `,
    [eventKey]
  );

  return (rowCount ?? 0) > 0;
}

async function getRankingSnapshot(
  userId: string,
  roomId: string,
  rankingType: string,
  weekYear: string
): Promise<RankingSnapshotRow | null> {
  const { rows } = await pool.query<RankingSnapshotRow>(
    `
      SELECT position, leader_user_id
      FROM notification_ranking_snapshots
      WHERE user_id = $1
        AND room_id = $2
        AND ranking_type = $3
        AND week_year = $4
      LIMIT 1;
    `,
    [userId, roomId, rankingType, weekYear]
  );

  return rows[0] ?? null;
}

async function upsertRankingSnapshot(input: {
  userId: string;
  roomId: string;
  rankingType: string;
  weekYear: string;
  position: number;
  leaderUserId: string | null;
}): Promise<void> {
  await pool.query(
    `
      INSERT INTO notification_ranking_snapshots (
        user_id,
        room_id,
        ranking_type,
        week_year,
        position,
        leader_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, room_id, ranking_type, week_year)
      DO UPDATE SET
        position = EXCLUDED.position,
        leader_user_id = EXCLUDED.leader_user_id,
        updated_at = now();
    `,
    [
      input.userId,
      input.roomId,
      input.rankingType,
      input.weekYear,
      input.position,
      input.leaderUserId,
    ]
  );
}

function getRoomRankingTypes(mode: string): RankingType[] {
  return mode === 'battle_royale'
    ? RANKING_TYPES
    : ['time'];
}

function isWeekClosingWindow(now = new Date()): boolean {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'short',
  }).format(now);

  return weekday === 'Sun';
}

function getLocalDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
