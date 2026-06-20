import { pool } from '../../../common/config/db.js';
import type {
  BattleMembership,
  BattleQuestion,
  BattleQuestionType,
  BattleRoom,
  QuestionOptionInput,
  WeeklyQuiz,
} from '../types/battle-royale.types.js';

export const BattleRoyaleRepository = {
  async findRoomById(roomId: string): Promise<BattleRoom | null> {
    const { rows } = await pool.query(
      `
        SELECT id, mode, owner_id, is_active
        FROM rooms
        WHERE id = $1
        LIMIT 1;
      `,
      [roomId]
    );

    return (rows[0] as BattleRoom | undefined) ?? null;
  },

  async findMembership(roomId: string, userId: string): Promise<BattleMembership | null> {
    const { rows } = await pool.query(
      `
        SELECT id, role, is_active
        FROM room_members
        WHERE room_id = $1 AND user_id = $2
        LIMIT 1;
      `,
      [roomId, userId]
    );

    return (rows[0] as BattleMembership | undefined) ?? null;
  },

  async findWeeklyQuiz(roomId: string, weekYear: string): Promise<WeeklyQuiz | null> {
    const { rows } = await pool.query(
      `
        SELECT
          id,
          room_id,
          created_by,
          title,
          week_year,
          status,
          weekday,
          start_time::text AS start_time,
          duration_minutes,
          scheduled_at,
          opens_at,
          closes_at,
          validation_opens_at,
          validation_closes_at
        FROM quizzes
        WHERE room_id = $1
          AND week_year = $2
        ORDER BY created_at DESC
        LIMIT 1;
      `,
      [roomId, weekYear]
    );

    return (rows[0] as WeeklyQuiz | undefined) ?? null;
  },

  async findWeeklyQuizById(roomId: string, quizId: string): Promise<WeeklyQuiz | null> {
    const { rows } = await pool.query(
      `
        SELECT
          id,
          room_id,
          created_by,
          title,
          week_year,
          status,
          weekday,
          start_time::text AS start_time,
          duration_minutes,
          scheduled_at,
          opens_at,
          closes_at,
          validation_opens_at,
          validation_closes_at
        FROM quizzes
        WHERE room_id = $1
          AND id = $2
        LIMIT 1;
      `,
      [roomId, quizId]
    );

    return (rows[0] as WeeklyQuiz | undefined) ?? null;
  },

  async createWeeklyQuiz(input: {
    roomId: string;
    createdBy: string;
    title: string;
    weekYear: string;
    weekday: string;
    startTime: string;
    durationMinutes: number;
    scheduledAt: Date;
    opensAt: Date;
    closesAt: Date;
  }): Promise<WeeklyQuiz> {
    const { rows } = await pool.query(
      `
        INSERT INTO quizzes (
          room_id,
          created_by,
          title,
          week_year,
          status,
          weekday,
          start_time,
          duration_minutes,
          scheduled_at,
          opens_at,
          closes_at
        )
        VALUES ($1, $2, $3, $4, 'scheduled', $5, $6, $7, $8, $9, $10)
        RETURNING
          id,
          room_id,
          created_by,
          title,
          week_year,
          status,
          weekday,
          start_time::text AS start_time,
          duration_minutes,
          scheduled_at,
          opens_at,
          closes_at,
          validation_opens_at,
          validation_closes_at;
      `,
      [
        input.roomId,
        input.createdBy,
        input.title,
        input.weekYear,
        input.weekday,
        input.startTime,
        input.durationMinutes,
        input.scheduledAt,
        input.opensAt,
        input.closesAt,
      ]
    );

    return rows[0] as WeeklyQuiz;
  },

  async updateWeeklyQuiz(
    quizId: string,
    input: {
      title: string;
      weekday: string;
      startTime: string;
      durationMinutes: number;
      scheduledAt: Date;
      opensAt: Date;
      closesAt: Date;
    }
  ): Promise<WeeklyQuiz> {
    const { rows } = await pool.query(
      `
        UPDATE quizzes
        SET
          title = $2,
          weekday = $3,
          start_time = $4,
          duration_minutes = $5,
          scheduled_at = $6,
          opens_at = $7,
          closes_at = $8,
          status = 'scheduled',
          updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          room_id,
          created_by,
          title,
          week_year,
          status,
          weekday,
          start_time::text AS start_time,
          duration_minutes,
          scheduled_at,
          opens_at,
          closes_at,
          validation_opens_at,
          validation_closes_at;
      `,
      [
        quizId,
        input.title,
        input.weekday,
        input.startTime,
        input.durationMinutes,
        input.scheduledAt,
        input.opensAt,
        input.closesAt,
      ]
    );

    return rows[0] as WeeklyQuiz;
  },

  async createQuestion(input: {
    roomId: string;
    authorId: string;
    type: BattleQuestionType;
    questionText: string;
    expectedAnswer: string | null;
    weekYear: string;
    options: Required<QuestionOptionInput>[];
  }): Promise<{ id: string; status: string }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const questionResult = await client.query(
        `
          INSERT INTO questions (
            room_id,
            author_id,
            type,
            question_text,
            expected_answer,
            status,
            week_year
          )
          VALUES ($1, $2, $3, $4, $5, 'pending', $6)
          RETURNING id, status;
        `,
        [
          input.roomId,
          input.authorId,
          input.type,
          input.questionText,
          input.expectedAnswer,
          input.weekYear,
        ]
      );

      const question = questionResult.rows[0] as { id: string; status: string };

      if (input.type === 'multiple_choice') {
        for (const [index, option] of input.options.entries()) {
          await client.query(
            `
              INSERT INTO question_options (question_id, option_text, is_correct, sort_order)
              VALUES ($1, $2, $3, $4);
            `,
            [question.id, option.option_text, option.is_correct, index]
          );
        }
      }

      await client.query('COMMIT');
      return question;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async listRoomQuestions(roomId: string, authorId: string): Promise<BattleQuestion[]> {
    const { rows } = await pool.query(
      `
        SELECT
          q.id,
          q.room_id,
          q.author_id,
          q.type,
          q.question_text,
          q.expected_answer,
          q.status,
          q.week_year,
          json_build_object(
            'id', p.id,
            'username', p.username,
            'avatar_url', p.avatar_url
          ) AS author,
          COALESCE(
            json_agg(
              json_build_object(
                'id', qo.id,
                'option_text', qo.option_text,
                'is_correct', qo.is_correct,
                'sort_order', qo.sort_order
              )
              ORDER BY qo.sort_order ASC
            ) FILTER (WHERE qo.id IS NOT NULL),
            '[]'
          ) AS options
        FROM questions q
        JOIN profiles p ON p.id = q.author_id
        LEFT JOIN question_options qo ON qo.question_id = q.id
        WHERE q.room_id = $1
          AND q.author_id = $2
        GROUP BY q.id, p.id
        ORDER BY q.created_at DESC;
      `,
      [roomId, authorId]
    );

    return rows as BattleQuestion[];
  },
};
