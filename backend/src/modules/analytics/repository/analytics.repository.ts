import { pool } from '../../../common/config/db.js';
import type { DashboardSummary, DifficultyHeatmapTopic } from '../types/analytics.types.js';

type DifficultyRow = {
  topic_id: string | null;
  topic_name: string;
  total_answers: number | string;
  wrong_answers: number | string;
};

export const AnalyticsRepository = {
  async isActiveRoomMember(roomId: string, userId: string): Promise<boolean> {
    const { rows } = await pool.query(
      `
        SELECT 1
        FROM rooms r
        JOIN room_members rm ON rm.room_id = r.id
        WHERE r.id = $1
          AND r.is_active = true
          AND rm.user_id = $2
          AND rm.is_active = true
        LIMIT 1;
      `,
      [roomId, userId]
    );

    return rows.length > 0;
  },

  async getUserDifficultyHeatmap(input: {
    userId: string;
    period: 'week' | 'all';
    weekYear?: string;
  }): Promise<DifficultyHeatmapTopic[]> {
    const params: any[] = [input.userId];
    const filters = [
      'qa_attempt.user_id = $1',
      'qa_attempt.completed_at IS NOT NULL',
      "qa.validation_status IN ('validated', 'rejected')",
      "q.status = 'validated'",
    ];

    appendWeekFilter(filters, params, input.period, input.weekYear);

    const { rows } = await pool.query<DifficultyRow>(
      `
        SELECT
          at.id::text AS topic_id,
          COALESCE(at.name, 'Sin clasificar') AS topic_name,
          COUNT(*)::int AS total_answers,
          COUNT(*) FILTER (
            WHERE qa.validation_status = 'rejected'
               OR COALESCE(qa.is_correct, false) = false
          )::int AS wrong_answers
        FROM quiz_answers qa
        JOIN quiz_attempts qa_attempt ON qa_attempt.id = qa.attempt_id
        JOIN quizzes quiz ON quiz.id = qa_attempt.quiz_id
        JOIN questions q ON q.id = qa.question_id
        LEFT JOIN question_topics qt ON qt.question_id = q.id
        LEFT JOIN academic_topics at ON at.id = qt.topic_id AND at.is_active = true
        WHERE ${filters.join(' AND ')}
        GROUP BY at.id, COALESCE(at.name, 'Sin clasificar')
        ORDER BY wrong_answers DESC, total_answers DESC, topic_name ASC;
      `,
      params
    );

    return mapDifficultyRows(rows);
  },

  async getRoomDifficultyHeatmap(input: {
    roomId: string;
    period: 'week' | 'all';
    weekYear?: string;
  }): Promise<DifficultyHeatmapTopic[]> {
    const params: any[] = [input.roomId];
    const filters = [
      'q.room_id = $1',
      'qa_attempt.completed_at IS NOT NULL',
      "qa.validation_status IN ('validated', 'rejected')",
      "q.status = 'validated'",
      'rm.is_active = true',
    ];

    appendWeekFilter(filters, params, input.period, input.weekYear);

    const { rows } = await pool.query<DifficultyRow>(
      `
        SELECT
          at.id::text AS topic_id,
          COALESCE(at.name, 'Sin clasificar') AS topic_name,
          COUNT(*)::int AS total_answers,
          COUNT(*) FILTER (
            WHERE qa.validation_status = 'rejected'
               OR COALESCE(qa.is_correct, false) = false
          )::int AS wrong_answers
        FROM quiz_answers qa
        JOIN quiz_attempts qa_attempt ON qa_attempt.id = qa.attempt_id
        JOIN quizzes quiz ON quiz.id = qa_attempt.quiz_id
        JOIN questions q ON q.id = qa.question_id
        JOIN room_members rm
          ON rm.room_id = q.room_id
         AND rm.user_id = qa_attempt.user_id
        LEFT JOIN question_topics qt ON qt.question_id = q.id
        LEFT JOIN academic_topics at ON at.id = qt.topic_id AND at.is_active = true
        WHERE ${filters.join(' AND ')}
        GROUP BY at.id, COALESCE(at.name, 'Sin clasificar')
        ORDER BY wrong_answers DESC, total_answers DESC, topic_name ASC;
      `,
      params
    );

    return mapDifficultyRows(rows);
  },

  async getUserWeeklyStats(userId: string, weekYear: string): Promise<Pick<DashboardSummary, 'total_minutes' | 'academic_score'>> {
    const { rows } = await pool.query(
      `
        SELECT
          COALESCE(total_minutes, 0)::int AS total_minutes,
          COALESCE(academic_score, 0)::float AS academic_score
        FROM user_weekly_stats
        WHERE user_id = $1
          AND week_year = $2
        LIMIT 1;
      `,
      [userId, weekYear]
    );

    return {
      total_minutes: Number(rows[0]?.total_minutes ?? 0),
      academic_score: Number(rows[0]?.academic_score ?? 0),
    };
  },

  async getRoomWeeklyStats(
    userId: string,
    roomId: string,
    weekYear: string
  ): Promise<Pick<DashboardSummary, 'total_minutes' | 'academic_score'>> {
    const { rows } = await pool.query(
      `
        SELECT
          COALESCE(total_minutes, 0)::int AS total_minutes,
          COALESCE(academic_score, 0)::float AS academic_score
        FROM room_user_weekly_stats
        WHERE user_id = $1
          AND room_id = $2
          AND week_year = $3
        LIMIT 1;
      `,
      [userId, roomId, weekYear]
    );

    return {
      total_minutes: Number(rows[0]?.total_minutes ?? 0),
      academic_score: Number(rows[0]?.academic_score ?? 0),
    };
  },

  async getSessionActivity(input: {
    userId: string;
    roomId?: string;
    from: Date;
    to: Date;
  }): Promise<Pick<DashboardSummary, 'sessions_count' | 'days_active'>> {
    const params: any[] = [input.userId, input.from.toISOString(), input.to.toISOString()];
    const filters = [
      'user_id = $1',
      'ended_at >= $2::timestamptz',
      'ended_at < $3::timestamptz',
      "(valid = true OR status = 'validated' OR approval_status = 'approved')",
    ];

    if (input.roomId) {
      params.push(input.roomId);
      filters.push(`room_id = $${params.length}`);
    }

    const { rows } = await pool.query(
      `
        SELECT
          COUNT(*)::int AS sessions_count,
          COUNT(DISTINCT (ended_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::date)::int AS days_active
        FROM study_sessions
        WHERE ${filters.join(' AND ')};
      `,
      params
    );

    return {
      sessions_count: Number(rows[0]?.sessions_count ?? 0),
      days_active: Number(rows[0]?.days_active ?? 0),
    };
  },

  async getQuizAverage(input: {
    userId: string;
    roomId?: string;
    weekYear: string;
  }): Promise<number> {
    const params: any[] = [input.userId, input.weekYear];
    const filters = [
      'qa.user_id = $1',
      'q.week_year = $2',
      'qa.completed_at IS NOT NULL',
    ];

    if (input.roomId) {
      params.push(input.roomId);
      filters.push(`q.room_id = $${params.length}`);
    }

    const { rows } = await pool.query(
      `
        SELECT COALESCE(AVG(
          CASE
            WHEN qa.total_questions > 0 THEN (qa.correct_count::float / qa.total_questions::float) * 100
            ELSE qa.score::float
          END
        ), 0)::float AS avg_quiz_score
        FROM quiz_attempts qa
        JOIN quizzes q ON q.id = qa.quiz_id
        WHERE ${filters.join(' AND ')};
      `,
      params
    );

    return Number(rows[0]?.avg_quiz_score ?? 0);
  },
};

function appendWeekFilter(filters: string[], params: any[], period: 'week' | 'all', weekYear?: string) {
  if (period !== 'week') return;

  params.push(weekYear);
  filters.push(`quiz.week_year = $${params.length}`);
}

function mapDifficultyRows(rows: DifficultyRow[]): DifficultyHeatmapTopic[] {
  return rows.map(row => {
    const totalAnswers = Number(row.total_answers) || 0;
    const wrongAnswers = Number(row.wrong_answers) || 0;
    const difficultyScore = totalAnswers > 0 ? wrongAnswers / totalAnswers : 0;

    return {
      topic_id: row.topic_id,
      topic_name: row.topic_name,
      total_answers: totalAnswers,
      wrong_answers: wrongAnswers,
      difficulty_score: Number(difficultyScore.toFixed(2)),
      level: getDifficultyLevel(difficultyScore),
    };
  });
}

function getDifficultyLevel(score: number) {
  if (score <= 0.3) return 'low';
  if (score <= 0.6) return 'medium';
  return 'high';
}
