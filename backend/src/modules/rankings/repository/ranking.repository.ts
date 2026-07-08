import { pool } from '../../../common/config/db.js';
import { walletRepository } from '../../wallet/repository/wallet.repository.js';
import type { RankingScope } from '../types/ranking.types.js';

export const rankingsRepository = {
  async roomExists(roomId: string): Promise<boolean> {
    const { rows } = await pool.query(
      `SELECT 1 FROM rooms WHERE id = $1 LIMIT 1;`,
      [roomId]
    );

    return rows.length > 0;
  },

  async getMemberStatus(roomId: string, userId: string) {
    const { rows } = await pool.query(
      `SELECT is_active FROM room_members WHERE room_id = $1 AND user_id = $2 LIMIT 1`,
      [roomId, userId]
    );
    return rows[0] || null;
  },

  // ✅ Agregamos scope y userId como parámetros
  async getRankingData(
    type: string,
    weekYears: string[],
    roomId?: string,
    scope: RankingScope = 'global',
    userId?: string
  ) {
    const normalizedType = normalizeRankingType(type);
    const isFriends = scope === 'friends' && userId;

    // Función auxiliar para agregar el JOIN de amigos
    const getFriendsJoin = () => {
      if (!isFriends) return '';
      return `
        INNER JOIN friendships f ON (
          (f.user_id = $${getParamIndex()} AND f.friend_id = p.id) OR
          (f.friend_id = $${getParamIndex()} AND f.user_id = p.id)
        )
      `;
    };

    let paramIndex = 3; // Empezamos después de los parámetros base
    const getParamIndex = () => paramIndex++;

    // Construimos los parámetros base
    const baseParams: any[] = [weekYears];
    let params = [...baseParams];

    if (normalizedType === 'time' && !roomId) {
      // ✅ Ranking de tiempo global con filtro de amigos
      let query = `
        SELECT
          p.id,
          p.username,
          p.avatar_url,
          COALESCE(SUM(uws.total_minutes), 0)::int AS total_minutes
        FROM profiles p
        LEFT JOIN user_weekly_stats uws
          ON uws.user_id = p.id
          AND uws.week_year = ANY($1::text[])
      `;

      if (isFriends) {
        params.push(userId);
        query += `
          INNER JOIN friendships f ON (
            (f.user_id = $${params.length} AND f.friend_id = p.id) OR
            (f.friend_id = $${params.length} AND f.user_id = p.id)
          )
        `;
      }

      query += `
        GROUP BY p.id, p.username, p.avatar_url
        ORDER BY COALESCE(SUM(uws.total_minutes), 0) DESC, p.username ASC
        LIMIT 50;
      `;

      const { rows } = await pool.query(query, params);
      return rows;
    }

    if (normalizedType === 'racha') {
      // ✅ Ranking de racha con filtro de amigos
      let query = `
        SELECT id, username, avatar_url, streak_days 
        FROM profiles p
      `;

      if (isFriends) {
        params.push(userId);
        query += `
          INNER JOIN friendships f ON (
            (f.user_id = $${params.length} AND f.friend_id = p.id) OR
            (f.friend_id = $${params.length} AND f.user_id = p.id)
          )
        `;
      }

      query += `
        ORDER BY streak_days DESC 
        LIMIT 50
      `;

      const { rows } = await pool.query(query, params);
      return rows;
    }

    if (!roomId && normalizedType === 'qa') {
      // ✅ Ranking Q&A global con filtro de amigos
      let query = `
        SELECT
          p.id,
          p.username,
          p.avatar_url,
          COALESCE(SUM(rws.quiz_score), 0)::int AS quiz_score
        FROM profiles p
        JOIN room_members rm
          ON rm.user_id = p.id
          AND rm.is_active = true
        JOIN rooms r
          ON r.id = rm.room_id
          AND r.is_active = true
        LEFT JOIN room_user_weekly_stats rws
          ON rws.user_id = p.id
          AND rws.room_id = rm.room_id
          AND rws.week_year = ANY($1::text[])
      `;

      if (isFriends) {
        params.push(userId);
        query += `
          INNER JOIN friendships f ON (
            (f.user_id = $${params.length} AND f.friend_id = p.id) OR
            (f.friend_id = $${params.length} AND f.user_id = p.id)
          )
        `;
      }

      query += `
        GROUP BY p.id, p.username, p.avatar_url
        ORDER BY COALESCE(SUM(rws.quiz_score), 0) DESC, p.username ASC
        LIMIT 50;
      `;

      const { rows } = await pool.query(query, params);
      return rows;
    }

    if (!roomId && normalizedType === 'academic') {
      // ✅ Ranking académico global con filtro de amigos
      let query = `
        SELECT
          p.id,
          p.username,
          p.avatar_url,
          COALESCE(SUM(rws.academic_score), 0)::int AS academic_score
        FROM profiles p
        JOIN room_members rm
          ON rm.user_id = p.id
          AND rm.is_active = true
        JOIN rooms r
          ON r.id = rm.room_id
          AND r.is_active = true
        LEFT JOIN room_user_weekly_stats rws
          ON rws.user_id = p.id
          AND rws.room_id = rm.room_id
          AND rws.week_year = ANY($1::text[])
      `;

      if (isFriends) {
        params.push(userId);
        query += `
          INNER JOIN friendships f ON (
            (f.user_id = $${params.length} AND f.friend_id = p.id) OR
            (f.friend_id = $${params.length} AND f.user_id = p.id)
          )
        `;
      }

      query += `
        GROUP BY p.id, p.username, p.avatar_url
        ORDER BY COALESCE(SUM(rws.academic_score), 0) DESC, p.username ASC
        LIMIT 50;
      `;

      const { rows } = await pool.query(query, params);
      return rows;
    }

    if (!roomId && normalizedType === 'boss') {
      // ✅ Ranking de jefes global con filtro de amigos
      let query = `
        SELECT
          p.id,
          p.username,
          p.avatar_url,
          COALESCE(SUM(rws.bosses_count), 0)::int AS bosses_count
        FROM profiles p
        JOIN room_members rm
          ON rm.user_id = p.id
          AND rm.is_active = true
        JOIN rooms r
          ON r.id = rm.room_id
          AND r.is_active = true
        LEFT JOIN room_user_weekly_stats rws
          ON rws.user_id = p.id
          AND rws.room_id = rm.room_id
      `;

      if (isFriends) {
        params.push(userId);
        query += `
          INNER JOIN friendships f ON (
            (f.user_id = $${params.length} AND f.friend_id = p.id) OR
            (f.friend_id = $${params.length} AND f.user_id = p.id)
          )
        `;
      }

      query += `
        GROUP BY p.id, p.username, p.avatar_url
        ORDER BY COALESCE(SUM(rws.bosses_count), 0) DESC, p.username ASC
        LIMIT 50;
      `;

      const { rows } = await pool.query(query, params);
      return rows;
    }

    const columnMap: Record<string, string> = {
      time: 'total_minutes',
      qa: 'quiz_score',
      academic: 'academic_score',
      boss: 'bosses_count',
    };

    const column = columnMap[normalizedType] || 'total_minutes';

    if (roomId && normalizedType === 'boss') {
      const { rows } = await pool.query(
        `
          SELECT
            p.id,
            p.username,
            p.avatar_url,
            team.name AS team_name,
            team.color AS team_color,
            tr.role_label AS temporary_role,
            COALESCE(bw.boss_user_id = p.id, false) AS is_boss,
            COALESCE(SUM(ru.total_minutes), 0)::int AS total_minutes,
            COALESCE(SUM(ru.quiz_score), 0)::int AS quiz_score,
            COALESCE(SUM(ru.academic_score), 0)::int AS academic_score,
            COALESCE(SUM(ru.bosses_count), 0)::int AS bosses_count
          FROM room_members rm
          INNER JOIN profiles p ON p.id = rm.user_id
          LEFT JOIN team_members tm
            ON tm.room_id = rm.room_id
            AND tm.user_id = rm.user_id
            AND tm.is_active = true
          LEFT JOIN teams team
            ON team.id = tm.team_id
            AND team.room_id = rm.room_id
            AND team.is_active = true
          LEFT JOIN room_user_weekly_stats ru
            ON ru.room_id = rm.room_id
            AND ru.user_id = rm.user_id
          LEFT JOIN boss_weeks bw
            ON bw.room_id = rm.room_id
            AND bw.week_year = $2
          LEFT JOIN room_member_temporary_roles tr
            ON tr.room_id = rm.room_id
            AND tr.user_id = rm.user_id
            AND tr.week_year = $2
          WHERE rm.room_id = $1
            AND rm.is_active = true
          GROUP BY p.id, p.username, p.avatar_url, team.name, team.color, tr.role_label, bw.boss_user_id
          ORDER BY COALESCE(SUM(ru.${column}), 0) DESC, p.username ASC
          LIMIT 50;
        `,
        [roomId, weekYears[0]]
      );
      return rows;
    }

    // ✅ Ranking de sala con posibles filtros (no se aplica filtro de amigos en salas)
    if (roomId) {
      const { rows } = await pool.query(
        `
          SELECT
            p.id,
            p.username,
            p.avatar_url,
            team.name AS team_name,
            team.color AS team_color,
            tr.role_label AS temporary_role,
            COALESCE(bw.boss_user_id = p.id, false) AS is_boss,
            COALESCE(SUM(ru.total_minutes), 0)::int AS total_minutes,
            COALESCE(SUM(ru.quiz_score), 0)::int AS quiz_score,
            COALESCE(SUM(ru.academic_score), 0)::int AS academic_score,
            COALESCE(SUM(ru.bosses_count), 0)::int AS bosses_count
          FROM room_members rm
          INNER JOIN profiles p ON p.id = rm.user_id
          LEFT JOIN team_members tm
            ON tm.room_id = rm.room_id
            AND tm.user_id = rm.user_id
            AND tm.is_active = true
          LEFT JOIN teams team
            ON team.id = tm.team_id
            AND team.room_id = rm.room_id
            AND team.is_active = true
          LEFT JOIN room_user_weekly_stats ru
            ON ru.room_id = rm.room_id
            AND ru.user_id = rm.user_id
            AND ru.week_year = ANY($1::text[])
          LEFT JOIN boss_weeks bw
            ON bw.room_id = rm.room_id
            AND bw.week_year = $3
          LEFT JOIN room_member_temporary_roles tr
            ON tr.room_id = rm.room_id
            AND tr.user_id = rm.user_id
            AND tr.week_year = $3
          WHERE rm.room_id = $2
            AND rm.is_active = true
          GROUP BY p.id, p.username, p.avatar_url, team.name, team.color, tr.role_label, bw.boss_user_id
          ORDER BY COALESCE(SUM(ru.${column}), 0) DESC, p.username ASC
          LIMIT 50;
        `,
        [weekYears, roomId, weekYears[0]]
      );
      return rows;
    }

    // ✅ Ranking global por defecto (con filtro de amigos aplicado)
    let query = `
      SELECT
        ru.total_minutes,
        ru.quiz_score,
        ru.academic_score,
        ru.bosses_count,
        p.id,
        p.username,
        p.avatar_url
      FROM user_weekly_stats ru
      INNER JOIN profiles p ON ru.user_id = p.id
    `;

    if (isFriends) {
      params.push(userId);
      query += `
        INNER JOIN friendships f ON (
          (f.user_id = $${params.length} AND f.friend_id = p.id) OR
          (f.friend_id = $${params.length} AND f.user_id = p.id)
        )
      `;
    }

    query += `
      WHERE ru.week_year = ANY($1::text[])
      ORDER BY ru.${column} DESC
      LIMIT 50;
    `;

    const { rows } = await pool.query(query, params);
    return rows;
  },

  async getRoomTimeRanking(roomId: string) {
    const { rows } = await pool.query(
      `
        SELECT
          p.id AS user_id,
          p.username,
          p.avatar_url,
          COALESCE(SUM(rws.total_minutes), 0)::int AS total_minutes
        FROM room_members rm
        JOIN profiles p ON p.id = rm.user_id
        LEFT JOIN room_user_weekly_stats rws
          ON rws.user_id = rm.user_id
          AND rws.room_id = rm.room_id
        WHERE rm.room_id = $1
          AND rm.is_active = true
        GROUP BY p.id, p.username, p.avatar_url
        ORDER BY total_minutes DESC;
      `,
      [roomId]
    );

    return rows;
  },

  async recalculateAcademicScores(weekYear: string, roomId?: string) {
    const params = roomId ? [weekYear, roomId] : [weekYear];
    await pool.query(
      `
        UPDATE room_user_weekly_stats
        SET academic_score = FLOOR((total_minutes * quiz_score) / 60.0)::int,
            updated_at = NOW()
        WHERE week_year = $1
        ${roomId ? 'AND room_id = $2' : ''};
      `,
      params
    );
  },

  async findRoomsForWeeklyClose(roomId?: string): Promise<Array<{ id: string; name: string; mode: string }>> {
    const { rows } = await pool.query(
      `
        SELECT id, name, mode
        FROM rooms
        WHERE is_active = true
        ${roomId ? 'AND id = $1' : ''};
      `,
      roomId ? [roomId] : []
    );
    return rows;
  },

  async findWeeklyBossCandidate(roomId: string, weekYear: string, mode: string): Promise<{ user_id: string } | null> {
    const isBattleRoyale = mode === 'battle_royale';
    const orderColumn = isBattleRoyale ? 'academic_score' : 'total_minutes';

    const { rows } = await pool.query(
      `
        SELECT user_id
        FROM room_user_weekly_stats
        WHERE room_id = $1
          AND week_year = $2
        ORDER BY ${orderColumn} DESC, quiz_score DESC, total_minutes DESC, user_id ASC
        LIMIT 1;
      `,
      [roomId, weekYear]
    );

    return rows[0] ?? null;
  },

  async deleteExpiredTemporaryRoles(roomId: string, activeWeekYear: string): Promise<void> {
    await pool.query(
      `
        DELETE FROM room_member_temporary_roles
        WHERE room_id = $1
          AND week_year <> $2;
      `,
      [roomId, activeWeekYear]
    );
  },

  async assignWeeklyBoss(roomId: string, weekYear: string, bossUserId: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const insertResult = await client.query<{ id: string }>(
        `
          INSERT INTO boss_weeks (room_id, week_year, boss_user_id)
          VALUES ($1, $2, $3)
          ON CONFLICT (room_id, week_year) DO NOTHING
          RETURNING id;
        `,
        [roomId, weekYear, bossUserId]
      );

      if (insertResult.rowCount === 0) {
        await client.query('COMMIT');
        return { assigned: false, boss_user_id: bossUserId, boss_week_id: null };
      }

      await client.query(
        `
          INSERT INTO room_user_weekly_stats (room_id, user_id, week_year, bosses_count)
          VALUES ($1, $2, $3, 1)
          ON CONFLICT (room_id, user_id, week_year)
          DO UPDATE SET
            bosses_count = room_user_weekly_stats.bosses_count + 1,
            updated_at = NOW();
        `,
        [roomId, bossUserId, weekYear]
      );

      await client.query(
        `
          INSERT INTO user_weekly_stats (user_id, week_year, bosses_count)
          VALUES ($1, $2, 1)
          ON CONFLICT (user_id, week_year)
          DO UPDATE SET
            bosses_count = user_weekly_stats.bosses_count + 1,
            updated_at = NOW();
        `,
        [bossUserId, weekYear]
      );

      await walletRepository.creditCoins(client, {
        userId: bossUserId,
        amount: 10,
        type: 'ranking_reward',
        referenceType: 'boss_week',
        referenceId: `${roomId}:${weekYear}`,
        description: 'Premio por jefe semanal',
      });

      await client.query('COMMIT');
      return { assigned: true, boss_user_id: bossUserId, boss_week_id: insertResult.rows[0]?.id ?? null };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

function normalizeRankingType(type: string) {
  const map: Record<string, string> = {
    semanal: 'time',
    academico: 'academic',
    jefes: 'boss',
  };

  return map[type] ?? type;
}