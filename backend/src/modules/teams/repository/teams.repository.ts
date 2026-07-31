import { pool } from '../../../common/config/db.js';
import type { Team, TeamRankingEntry } from '../types/teams.types.js';

export interface TeamRoomAccess {
  id: string;
  mode: 'survival' | 'battle_royale';
  teams_enabled: boolean;
  is_owner: boolean;
  is_member: boolean;
}

export class TeamsRepository {
  static async getRoomAccess(roomId: string, userId: string): Promise<TeamRoomAccess | null> {
    const { rows } = await pool.query<TeamRoomAccess>(
      `
        SELECT
          r.id,
          r.mode,
          COALESCE(r.teams_enabled, false) AS teams_enabled,
          r.owner_id = $2 AS is_owner,
          EXISTS (
            SELECT 1
            FROM room_members rm
            WHERE rm.room_id = r.id
              AND rm.user_id = $2
              AND rm.is_active = true
          ) AS is_member
        FROM rooms r
        WHERE r.id = $1
          AND r.is_active = true
        LIMIT 1;
      `,
      [roomId, userId]
    );

    return rows[0] ?? null;
  }

  static async listTeams(roomId: string): Promise<Team[]> {
    const { rows } = await pool.query<Team>(
      `
        SELECT
          t.id,
          t.room_id,
          t.name,
          t.color,
          t.created_by,
          t.created_at,
          COALESCE(members.members, '[]'::json) AS members
        FROM teams t
        LEFT JOIN LATERAL (
          SELECT json_agg(
            json_build_object(
              'id', tm.id,
              'user_id', p.id,
              'username', p.username,
              'avatar_url', p.avatar_url,
              'role', tm.role,
              'joined_at', tm.joined_at
            )
            ORDER BY tm.joined_at ASC
          ) AS members
          FROM team_members tm
          JOIN profiles p ON p.id = tm.user_id
          JOIN room_members rm
            ON rm.room_id = t.room_id
           AND rm.user_id = tm.user_id
           AND rm.is_active = true
          WHERE tm.team_id = t.id
            AND tm.room_id = t.room_id
            AND tm.is_active = true
        ) members ON true
        WHERE t.room_id = $1
          AND t.is_active = true
        ORDER BY t.created_at ASC;
      `,
      [roomId]
    );

    return rows;
  }

  static async findTeam(roomId: string, teamId: string): Promise<{ id: string; room_id: string; name: string; color: string | null } | null> {
    const { rows } = await pool.query(
      `
        SELECT id, room_id, name, color
        FROM teams
        WHERE id = $1
          AND room_id = $2
          AND is_active = true
        LIMIT 1;
      `,
      [teamId, roomId]
    );

    return rows[0] ?? null;
  }

  static async findActiveTeamByUser(roomId: string, userId: string): Promise<{ team_id: string; team_name: string } | null> {
    const { rows } = await pool.query(
      `
        SELECT t.id AS team_id, t.name AS team_name
        FROM team_members tm
        JOIN teams t ON t.id = tm.team_id
        WHERE tm.room_id = $1
          AND tm.user_id = $2
          AND tm.is_active = true
          AND t.is_active = true
        LIMIT 1;
      `,
      [roomId, userId]
    );

    return rows[0] ?? null;
  }

  static async createTeam(roomId: string, userId: string, name: string, color: string | null): Promise<Team> {
    const { rows } = await pool.query<Team>(
      `
        INSERT INTO teams (room_id, name, color, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id, room_id, name, color, created_by, created_at, '[]'::json AS members;
      `,
      [roomId, name, color, userId]
    );

    return rows[0];
  }

  static async updateTeamName(roomId: string, teamId: string, name: string): Promise<Team | null> {
    const { rows } = await pool.query<Team>(
      `
        UPDATE teams
        SET name = $3,
            updated_at = now()
        WHERE id = $1
          AND room_id = $2
          AND is_active = true
        RETURNING id, room_id, name, color, created_by, created_at, '[]'::json AS members;
      `,
      [teamId, roomId, name]
    );

    return rows[0] ?? null;
  }

  static async deactivateTeam(roomId: string, teamId: string): Promise<boolean> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rowCount } = await client.query(
        `
          UPDATE teams
          SET is_active = false,
              updated_at = now()
          WHERE id = $1
            AND room_id = $2
            AND is_active = true;
        `,
        [teamId, roomId]
      );

      if ((rowCount ?? 0) === 0) {
        await client.query('COMMIT');
        return false;
      }

      await client.query(
        `
          UPDATE team_members
          SET is_active = false,
              left_at = now()
          WHERE team_id = $1
            AND room_id = $2
            AND is_active = true;
        `,
        [teamId, roomId]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async joinTeam(roomId: string, teamId: string, userId: string): Promise<void> {
    await pool.query(
      `
        INSERT INTO team_members (team_id, room_id, user_id, role, is_active, joined_at, left_at)
        VALUES ($1, $2, $3, 'member', true, now(), NULL)
        ON CONFLICT (team_id, user_id)
        WHERE is_active = true
        DO NOTHING;
      `,
      [teamId, roomId, userId]
    );
  }

  static async leaveTeam(roomId: string, teamId: string, userId: string): Promise<boolean> {
    const { rowCount } = await pool.query(
      `
        UPDATE team_members
        SET is_active = false,
            left_at = now()
        WHERE room_id = $1
          AND team_id = $2
          AND user_id = $3
          AND is_active = true;
      `,
      [roomId, teamId, userId]
    );

    return (rowCount ?? 0) > 0;
  }

  static async getTeamRanking(input: {
    roomId: string;
    weekYear: string;
    mode: 'survival' | 'battle_royale';
  }): Promise<TeamRankingEntry[]> {
    const orderExpression = input.mode === 'battle_royale'
      ? 'academic_score DESC, quiz_score DESC, total_minutes DESC'
      : 'total_minutes DESC, academic_score DESC, quiz_score DESC';

    const { rows } = await pool.query<TeamRankingEntry>(
      `
        WITH team_scores AS (
          SELECT
            t.id AS team_id,
            t.name AS team_name,
            t.color,
            COUNT(tm.user_id)::int AS members_count,
            COALESCE(SUM(rws.total_minutes), 0)::int AS total_minutes,
            COALESCE(SUM(rws.quiz_score), 0)::int AS quiz_score,
            COALESCE(SUM(rws.academic_score), 0)::float AS academic_score,
            COALESCE(SUM(rws.bosses_count), 0)::int AS bosses_count
          FROM teams t
          LEFT JOIN team_members tm
            ON tm.team_id = t.id
           AND tm.room_id = t.room_id
           AND tm.is_active = true
          LEFT JOIN room_members rm
            ON rm.room_id = t.room_id
           AND rm.user_id = tm.user_id
           AND rm.is_active = true
          LEFT JOIN room_user_weekly_stats rws
            ON rws.room_id = t.room_id
           AND rws.user_id = tm.user_id
           AND rws.week_year = $2
          WHERE t.room_id = $1
            AND t.is_active = true
          GROUP BY t.id, t.name, t.color
        )
        SELECT
          team_id,
          team_name,
          color,
          members_count,
          total_minutes,
          quiz_score,
          academic_score,
          bosses_count,
          ROW_NUMBER() OVER (ORDER BY ${orderExpression})::int AS position
        FROM team_scores
        ORDER BY position ASC;
      `,
      [input.roomId, input.weekYear]
    );

    return rows.map(row => ({
      ...row,
      total_minutes: Number(row.total_minutes) || 0,
      quiz_score: Number(row.quiz_score) || 0,
      academic_score: Number(row.academic_score) || 0,
      bosses_count: Number(row.bosses_count) || 0,
      members_count: Number(row.members_count) || 0,
      position: Number(row.position) || 0,
    }));
  }

  static async findWinningTeamLeader(input: {
    roomId: string;
    weekYear: string;
    mode: 'survival' | 'battle_royale';
  }): Promise<{ team_id: string; user_id: string } | null> {
    const teamOrderExpression = input.mode === 'battle_royale'
      ? 'academic_score DESC, quiz_score DESC, total_minutes DESC, team_name ASC'
      : 'total_minutes DESC, academic_score DESC, quiz_score DESC, team_name ASC';
    const memberOrderExpression = input.mode === 'battle_royale'
      ? 'COALESCE(rws.academic_score, 0) DESC, COALESCE(rws.quiz_score, 0) DESC, COALESCE(rws.total_minutes, 0) DESC, tm.joined_at ASC'
      : 'COALESCE(rws.total_minutes, 0) DESC, COALESCE(rws.academic_score, 0) DESC, COALESCE(rws.quiz_score, 0) DESC, tm.joined_at ASC';
    const positiveScoreExpression = input.mode === 'battle_royale'
      ? '(academic_score > 0 OR quiz_score > 0 OR total_minutes > 0)'
      : '(total_minutes > 0 OR academic_score > 0 OR quiz_score > 0)';

    const { rows } = await pool.query<{ team_id: string; user_id: string }>(
      `
        WITH team_scores AS (
          SELECT
            t.id AS team_id,
            t.name AS team_name,
            COALESCE(SUM(rws.total_minutes), 0)::int AS total_minutes,
            COALESCE(SUM(rws.quiz_score), 0)::int AS quiz_score,
            COALESCE(SUM(rws.academic_score), 0)::float AS academic_score
          FROM teams t
          JOIN team_members tm
            ON tm.team_id = t.id
           AND tm.room_id = t.room_id
           AND tm.is_active = true
          JOIN room_members rm
            ON rm.room_id = t.room_id
           AND rm.user_id = tm.user_id
           AND rm.is_active = true
          LEFT JOIN room_user_weekly_stats rws
            ON rws.room_id = t.room_id
           AND rws.user_id = tm.user_id
           AND rws.week_year = $2
          WHERE t.room_id = $1
            AND t.is_active = true
          GROUP BY t.id, t.name
        ),
        winning_team AS (
          SELECT team_id
          FROM team_scores
          WHERE ${positiveScoreExpression}
          ORDER BY ${teamOrderExpression}
          LIMIT 1
        )
        SELECT
          tm.team_id,
          tm.user_id
        FROM team_members tm
        JOIN winning_team wt ON wt.team_id = tm.team_id
        JOIN room_members rm
          ON rm.room_id = tm.room_id
         AND rm.user_id = tm.user_id
         AND rm.is_active = true
        LEFT JOIN room_user_weekly_stats rws
          ON rws.room_id = tm.room_id
         AND rws.user_id = tm.user_id
         AND rws.week_year = $2
        WHERE tm.room_id = $1
          AND tm.is_active = true
        ORDER BY ${memberOrderExpression}
        LIMIT 1;
      `,
      [input.roomId, input.weekYear]
    );

    return rows[0] ?? null;
  }
}
