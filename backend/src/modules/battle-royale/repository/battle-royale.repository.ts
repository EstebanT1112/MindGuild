import { pool } from '../../../common/config/db.js';
import type {
  BattleMembership,
  BattleQuestion,
  BattleQuestionType,
  BattleRoom,
  QuestionOptionInput,
  AssignedQuizQuestion,
  ValidationItem,
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
          status = 'scheduled'
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

  async countUserEligibleQuestions(roomId: string, userId: string, weekYear: string): Promise<number> {
    const { rows } = await pool.query(
      `
        SELECT COUNT(*)::int AS count
        FROM questions
        WHERE room_id = $1
          AND author_id = $2
          AND week_year = $3
          AND status IN ('pending', 'answered', 'in_validation', 'validated');
      `,
      [roomId, userId, weekYear]
    );

    return rows[0]?.count ?? 0;
  },

  async listAssignableQuestions(roomId: string, userId: string, weekYear: string, limit: number): Promise<Array<{ id: string }>> {
    const { rows } = await pool.query(
      `
        SELECT q.id
        FROM questions q
        WHERE q.room_id = $1
          AND q.author_id <> $2
          AND q.week_year = $3
          AND q.status IN ('pending', 'answered', 'in_validation', 'validated')
        ORDER BY random()
        LIMIT $4;
      `,
      [roomId, userId, weekYear, limit]
    );

    return rows as Array<{ id: string }>;
  },

  async createAssignments(quizId: string, userId: string, questionIds: string[]): Promise<void> {
    if (questionIds.length === 0) return;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const questionId of questionIds) {
        await client.query(
          `
            INSERT INTO quiz_question_assignments (quiz_id, question_id, assigned_to_user_id)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING;
          `,
          [quizId, questionId, userId]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async countAssignedQuestions(quizId: string, userId: string): Promise<number> {
    const { rows } = await pool.query(
      `
        SELECT COUNT(*)::int AS count
        FROM quiz_question_assignments
        WHERE quiz_id = $1
          AND assigned_to_user_id = $2;
      `,
      [quizId, userId]
    );

    return rows[0]?.count ?? 0;
  },

  async countAnsweredQuestions(quizId: string, userId: string, attemptId?: string): Promise<number> {
    const { rows } = await pool.query(
      `
        SELECT COUNT(DISTINCT qqa.question_id)::int AS count
        FROM quiz_question_assignments qqa
        JOIN questions q ON q.id = qqa.question_id
        LEFT JOIN quiz_answers qa
          ON qa.question_id = qqa.question_id
          AND qa.attempt_id = $3
        LEFT JOIN question_responses qr
          ON qr.question_id = qqa.question_id
          AND qr.attempt_id = $3
        WHERE qqa.quiz_id = $1
          AND qqa.assigned_to_user_id = $2
          AND (qa.id IS NOT NULL OR qr.id IS NOT NULL);
      `,
      [quizId, userId, attemptId ?? null]
    );

    return rows[0]?.count ?? 0;
  },

  async findAttempt(quizId: string, userId: string): Promise<{ id: string; completed_at: string | null } | null> {
    const { rows } = await pool.query(
      `
        SELECT id, completed_at
        FROM quiz_attempts
        WHERE quiz_id = $1
          AND user_id = $2
        LIMIT 1;
      `,
      [quizId, userId]
    );

    return (rows[0] as { id: string; completed_at: string | null } | undefined) ?? null;
  },

  async createAttempt(quizId: string, userId: string): Promise<{ id: string; completed_at: string | null }> {
    const { rows } = await pool.query(
      `
        INSERT INTO quiz_attempts (quiz_id, user_id, started_at, validation_status)
        VALUES ($1, $2, NOW(), 'pending')
        RETURNING id, completed_at;
      `,
      [quizId, userId]
    );

    return rows[0] as { id: string; completed_at: string | null };
  },

  async listAssignedQuestions(quizId: string, userId: string): Promise<AssignedQuizQuestion[]> {
    const { rows } = await pool.query(
      `
        SELECT
          q.id,
          q.type,
          q.question_text,
          COALESCE(
            json_agg(
              json_build_object(
                'id', qo.id,
                'option_text', qo.option_text
              )
              ORDER BY qo.sort_order ASC
            ) FILTER (WHERE qo.id IS NOT NULL),
            '[]'
          ) AS options
        FROM quiz_question_assignments qqa
        JOIN questions q ON q.id = qqa.question_id
        LEFT JOIN question_options qo ON qo.question_id = q.id
        WHERE qqa.quiz_id = $1
          AND qqa.assigned_to_user_id = $2
        GROUP BY q.id
        ORDER BY q.created_at ASC;
      `,
      [quizId, userId]
    );

    return rows as AssignedQuizQuestion[];
  },

  async findAssignedQuestion(quizId: string, userId: string, questionId: string): Promise<{ id: string; type: BattleQuestionType; author_id: string } | null> {
    const { rows } = await pool.query(
      `
        SELECT q.id, q.type, q.author_id
        FROM quiz_question_assignments qqa
        JOIN questions q ON q.id = qqa.question_id
        WHERE qqa.quiz_id = $1
          AND qqa.assigned_to_user_id = $2
          AND qqa.question_id = $3
        LIMIT 1;
      `,
      [quizId, userId, questionId]
    );

    return (rows[0] as { id: string; type: BattleQuestionType; author_id: string } | undefined) ?? null;
  },

  async findAttemptById(attemptId: string): Promise<{ id: string; quiz_id: string; user_id: string; completed_at: string | null } | null> {
    const { rows } = await pool.query(
      `
        SELECT id, quiz_id, user_id, completed_at
        FROM quiz_attempts
        WHERE id = $1
        LIMIT 1;
      `,
      [attemptId]
    );

    return (rows[0] as { id: string; quiz_id: string; user_id: string; completed_at: string | null } | undefined) ?? null;
  },

  async optionBelongsToQuestion(optionId: string, questionId: string): Promise<{ id: string; option_text: string; is_correct: boolean } | null> {
    const { rows } = await pool.query(
      `
        SELECT id, option_text, is_correct
        FROM question_options
        WHERE id = $1
          AND question_id = $2
        LIMIT 1;
      `,
      [optionId, questionId]
    );

    return (rows[0] as { id: string; option_text: string; is_correct: boolean } | undefined) ?? null;
  },

  async hasAnswer(attemptId: string, questionId: string): Promise<boolean> {
    const { rows } = await pool.query(
      `
        SELECT 1
        FROM quiz_answers
        WHERE attempt_id = $1 AND question_id = $2
        UNION
        SELECT 1
        FROM question_responses
        WHERE attempt_id = $1 AND question_id = $2
        LIMIT 1;
      `,
      [attemptId, questionId]
    );

    return rows.length > 0;
  },

  async saveMultipleChoiceAnswer(input: {
    attemptId: string;
    questionId: string;
    responderUserId: string;
    selectedOptionId: string;
    selectedOption: string;
    isCorrect: boolean;
  }): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `
          INSERT INTO quiz_answers (attempt_id, question_id, selected_option_id, selected_option, is_correct, answer_text, validation_status)
          VALUES ($1, $2, $3, $4, $5, $4, 'pending');
        `,
        [input.attemptId, input.questionId, input.selectedOptionId, input.selectedOption, input.isCorrect]
      );

      await client.query(
        `
          INSERT INTO question_responses (question_id, responder_user_id, attempt_id, answer_text, status)
          VALUES ($1, $2, $3, $4, 'pending');
        `,
        [input.questionId, input.responderUserId, input.attemptId, input.selectedOption]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async saveOpenAnswer(input: {
    attemptId: string;
    questionId: string;
    responderUserId: string;
    answerText: string;
  }): Promise<void> {
    await pool.query(
      `
        INSERT INTO question_responses (question_id, responder_user_id, attempt_id, answer_text, status)
        VALUES ($1, $2, $3, $4, 'pending');
      `,
      [input.questionId, input.responderUserId, input.attemptId, input.answerText]
    );
  },

  async completeAttempt(attemptId: string): Promise<void> {
    await pool.query(
      `
        UPDATE quiz_attempts
        SET completed_at = NOW(), validation_status = 'pending'
        WHERE id = $1;
      `,
      [attemptId]
    );
  },

  async listValidationItems(roomId: string, userId: string): Promise<ValidationItem[]> {
    const questionItems = await pool.query(
      `
        SELECT
          'question' AS type,
          q.id AS question_id,
          NULL::uuid AS response_id,
          q.type AS question_type,
          q.question_text,
          q.expected_answer,
          NULL::text AS answer_text,
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
          ) AS options,
          json_build_object('id', p.id, 'username', p.username) AS author,
          NULL::json AS responder
        FROM questions q
        JOIN profiles p ON p.id = q.author_id
        LEFT JOIN question_options qo ON qo.question_id = q.id
        WHERE q.room_id = $1
          AND q.author_id <> $2
          AND q.status IN ('pending', 'answered', 'in_validation')
          AND NOT EXISTS (
            SELECT 1
            FROM question_votes qv
            WHERE qv.question_id = q.id
              AND qv.user_id = $2
          )
        GROUP BY q.id, p.id
        ORDER BY q.created_at ASC
        LIMIT 10;
      `,
      [roomId, userId]
    );

    const responseItems = await pool.query(
      `
        SELECT
          'response' AS type,
          q.id AS question_id,
          qr.id AS response_id,
          q.type AS question_type,
          q.question_text,
          q.expected_answer,
          qr.answer_text,
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
          ) AS options,
          NULL::json AS author,
          json_build_object('id', p.id, 'username', p.username) AS responder
        FROM question_responses qr
        JOIN questions q ON q.id = qr.question_id
        JOIN profiles p ON p.id = qr.responder_user_id
        LEFT JOIN question_options qo ON qo.question_id = q.id
        WHERE q.room_id = $1
          AND qr.responder_user_id <> $2
          AND q.author_id <> $2
          AND qr.status = 'pending'
          AND NOT EXISTS (
            SELECT 1
            FROM question_reviews qrv
            WHERE qrv.response_id = qr.id
              AND qrv.reviewer_user_id = $2
          )
        GROUP BY qr.id, q.id, p.id
        ORDER BY qr.created_at ASC
        LIMIT 10;
      `,
      [roomId, userId]
    );

    return [...questionItems.rows, ...responseItems.rows] as ValidationItem[];
  },

  async findQuestionForVote(questionId: string): Promise<{ id: string; author_id: string; room_id: string } | null> {
    const { rows } = await pool.query(
      `
        SELECT id, author_id, room_id
        FROM questions
        WHERE id = $1
        LIMIT 1;
      `,
      [questionId]
    );

    return (rows[0] as { id: string; author_id: string; room_id: string } | undefined) ?? null;
  },

  async findResponseForVote(responseId: string): Promise<{ id: string; question_id: string; responder_user_id: string; room_id: string } | null> {
    const { rows } = await pool.query(
      `
        SELECT qr.id, qr.question_id, qr.responder_user_id, q.room_id
        FROM question_responses qr
        JOIN questions q ON q.id = qr.question_id
        WHERE qr.id = $1
        LIMIT 1;
      `,
      [responseId]
    );

    return (rows[0] as { id: string; question_id: string; responder_user_id: string; room_id: string } | undefined) ?? null;
  },

  async saveQuestionVote(questionId: string, userId: string, vote: 'positive' | 'negative'): Promise<void> {
    const numericVote = vote === 'positive' ? 1 : -1;

    await pool.query(
      `
        INSERT INTO question_votes (question_id, user_id, vote)
        VALUES ($1, $2, $3);
      `,
      [questionId, userId, numericVote]
    );
  },

  async saveResponseVote(questionId: string, responseId: string, userId: string, vote: 'positive' | 'negative'): Promise<void> {
    await pool.query(
      `
        INSERT INTO question_reviews (question_id, response_id, reviewer_user_id, vote, review_type)
        VALUES ($1, $2, $3, $4, 'response');
      `,
      [questionId, responseId, userId, vote]
    );
  },

  async resolveQuestionVotes(roomId: string, quizId: string): Promise<{ validated_questions: number; deleted_questions: number }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `
          SELECT
            q.id,
            COUNT(qv.id)::int AS votes_count,
            COUNT(qv.id) FILTER (WHERE qv.vote = 1)::int AS positive_count,
            COUNT(qv.id) FILTER (WHERE qv.vote = -1)::int AS negative_count
          FROM questions q
          JOIN quiz_question_assignments qqa ON qqa.question_id = q.id
          LEFT JOIN question_votes qv ON qv.question_id = q.id
          WHERE q.room_id = $1
            AND qqa.quiz_id = $2
            AND q.status IN ('pending', 'answered', 'in_validation')
          GROUP BY q.id;
        `,
        [roomId, quizId]
      );

      let validated = 0;
      let deleted = 0;

      for (const row of rows as Array<{ id: string; votes_count: number; positive_count: number; negative_count: number }>) {
        const isValid = row.votes_count > 0 && row.positive_count >= row.negative_count;

        if (isValid) {
          await client.query(
            `
              UPDATE questions
              SET status = 'validated'
              WHERE id = $1;
            `,
            [row.id]
          );
          validated += 1;
        } else {
          await deleteQuestionCascade(client, row.id);
          deleted += 1;
        }
      }

      await client.query(
        `
          UPDATE quizzes
          SET status = 'validated'
          WHERE id = $1;
        `,
        [quizId]
      );

      await client.query('COMMIT');
      return { validated_questions: validated, deleted_questions: deleted };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};

async function deleteQuestionCascade(client: any, questionId: string) {
  await client.query('DELETE FROM question_reviews WHERE question_id = $1 OR response_id IN (SELECT id FROM question_responses WHERE question_id = $1);', [questionId]);
  await client.query('DELETE FROM question_votes WHERE question_id = $1;', [questionId]);
  await client.query('DELETE FROM quiz_answers WHERE question_id = $1;', [questionId]);
  await client.query('DELETE FROM question_responses WHERE question_id = $1;', [questionId]);
  await client.query('DELETE FROM quiz_question_assignments WHERE question_id = $1;', [questionId]);
  await client.query('DELETE FROM quiz_questions WHERE question_id = $1;', [questionId]);
  await client.query('DELETE FROM question_options WHERE question_id = $1;', [questionId]);
  await client.query('DELETE FROM questions WHERE id = $1;', [questionId]);
}
