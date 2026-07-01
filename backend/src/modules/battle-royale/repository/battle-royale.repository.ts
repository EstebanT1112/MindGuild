import { pool } from '../../../common/config/db.js';
import type {
  BattleMembership,
  BattleQuestion,
  BattleQuestionType,
  AcademicTopic,
  BattleRoom,
  QuestionOptionInput,
  AssignedQuizQuestion,
  PracticeQuestion,
  ValidationItem,
  WeeklyQuiz,
  WeeklyQuizResult,
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
    topicIds: string[];
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

      if (input.topicIds.length > 0) {
        await client.query(
          `
            INSERT INTO question_topics (question_id, topic_id)
            SELECT $1, academic_topics.id
            FROM academic_topics
            WHERE academic_topics.room_id = $2
              AND academic_topics.is_active = true
              AND academic_topics.id = ANY($3::uuid[])
            ON CONFLICT DO NOTHING;
          `,
          [question.id, input.roomId, input.topicIds]
        );
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

  async listRoomTopics(roomId: string): Promise<AcademicTopic[]> {
    const { rows } = await pool.query(
      `
        SELECT id, room_id, name, slug, color, created_by, is_active
        FROM academic_topics
        WHERE room_id = $1
          AND is_active = true
        ORDER BY name ASC;
      `,
      [roomId]
    );

    return rows as AcademicTopic[];
  },

  async countActiveTopicsByIds(roomId: string, topicIds: string[]): Promise<number> {
    if (topicIds.length === 0) return 0;

    const { rows } = await pool.query(
      `
        SELECT COUNT(*)::int AS count
        FROM academic_topics
        WHERE room_id = $1
          AND is_active = true
          AND id = ANY($2::uuid[]);
      `,
      [roomId, topicIds]
    );

    return Number(rows[0]?.count ?? 0);
  },

  async createRoomTopic(input: {
    roomId: string;
    name: string;
    slug: string;
    color: string | null;
    createdBy: string;
  }): Promise<AcademicTopic> {
    const { rows } = await pool.query(
      `
        INSERT INTO academic_topics (room_id, name, slug, color, created_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (room_id, slug)
        WHERE is_active = true
        DO UPDATE SET
          name = EXCLUDED.name,
          color = COALESCE(EXCLUDED.color, academic_topics.color),
          updated_at = NOW()
        RETURNING id, room_id, name, slug, color, created_by, is_active;
      `,
      [input.roomId, input.name, input.slug, input.color, input.createdBy]
    );

    return rows[0] as AcademicTopic;
  },

  async findQuestionOwnership(questionId: string): Promise<{
    id: string;
    room_id: string;
    author_id: string;
    status: string;
    used_count: number;
  } | null> {
    const { rows } = await pool.query(
      `
        SELECT
          q.id,
          q.room_id,
          q.author_id,
          q.status,
          (
            SELECT COUNT(*)::int
            FROM quiz_answers qa
            WHERE qa.question_id = q.id
          ) + (
            SELECT COUNT(*)::int
            FROM question_responses qr
            WHERE qr.question_id = q.id
          ) + (
            SELECT COUNT(*)::int
            FROM quiz_question_assignments qqa
            WHERE qqa.question_id = q.id
          ) AS used_count
        FROM questions q
        WHERE q.id = $1;
      `,
      [questionId]
    );

    return rows[0] ?? null;
  },

  async deleteOwnUnusedQuestion(questionId: string): Promise<{ success: true }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await deleteQuestionCascade(client, questionId);
      await client.query('COMMIT');
      return { success: true };
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
          options.options,
          topics.topics
        FROM questions q
        JOIN profiles p ON p.id = q.author_id
        LEFT JOIN LATERAL (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'id', qo.id,
                'option_text', qo.option_text,
                'is_correct', qo.is_correct,
                'sort_order', qo.sort_order
              )
              ORDER BY qo.sort_order ASC
            ),
            '[]'::json
          ) AS options
          FROM question_options qo
          WHERE qo.question_id = q.id
        ) options ON true
        LEFT JOIN LATERAL (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'id', at.id,
                'name', at.name,
                'color', at.color
              )
              ORDER BY at.name ASC
            ),
            '[]'::json
          ) AS topics
          FROM question_topics qt
          JOIN academic_topics at ON at.id = qt.topic_id
          WHERE qt.question_id = q.id
            AND at.is_active = true
        ) topics ON true
        WHERE q.room_id = $1
          AND q.author_id = $2
          AND q.status IN ('pending', 'answered', 'in_validation')
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

  async countAssignableQuestions(roomId: string, userId: string, weekYear: string): Promise<number> {
    const { rows } = await pool.query(
      `
        SELECT COUNT(*)::int AS count
        FROM questions q
        WHERE q.room_id = $1
          AND q.author_id <> $2
          AND q.week_year = $3
          AND q.status IN ('pending', 'answered', 'in_validation', 'validated');
      `,
      [roomId, userId, weekYear]
    );

    return rows[0]?.count ?? 0;
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
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `
          INSERT INTO quiz_answers (attempt_id, question_id, answer_text, is_correct, validation_status)
          VALUES ($1, $2, $3, false, 'pending');
        `,
        [input.attemptId, input.questionId, input.answerText]
      );

      await client.query(
        `
          INSERT INTO question_responses (question_id, responder_user_id, attempt_id, answer_text, status)
          VALUES ($1, $2, $3, $4, 'pending');
        `,
        [input.questionId, input.responderUserId, input.attemptId, input.answerText]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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

  async resolveQuestionVotes(roomId: string, quizId: string): Promise<{ validated_questions: number; rejected_questions: number; validated_answers: number; rejected_answers: number }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `
          SELECT
            q.id,
            q.author_id,
            q.week_year,
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
      let rejected = 0;
      let validatedAnswers = 0;
      let rejectedAnswers = 0;

      for (const row of rows as Array<{ id: string; author_id: string; week_year: string; votes_count: number; positive_count: number; negative_count: number }>) {
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
          await upsertQuizStats(client, roomId, row.author_id, row.week_year, 1);
          validated += 1;
        } else {
          await client.query(
            `
              UPDATE questions
              SET status = 'rejected'
              WHERE id = $1;
            `,
            [row.id]
          );
          rejected += 1;
        }
      }

      const responseResult = await client.query(
        `
          SELECT
            qr.id,
            qr.attempt_id,
            qr.question_id,
            COUNT(qrv.id)::int AS votes_count,
            COUNT(qrv.id) FILTER (WHERE qrv.vote = 'positive')::int AS positive_count,
            COUNT(qrv.id) FILTER (WHERE qrv.vote = 'negative')::int AS negative_count
          FROM question_responses qr
          JOIN questions q ON q.id = qr.question_id
          JOIN quiz_question_assignments qqa ON qqa.question_id = q.id
          LEFT JOIN question_reviews qrv ON qrv.response_id = qr.id
          WHERE q.room_id = $1
            AND qqa.quiz_id = $2
            AND q.status = 'validated'
            AND qr.status = 'pending'
          GROUP BY qr.id;
        `,
        [roomId, quizId]
      );

      for (const row of responseResult.rows as Array<{ id: string; attempt_id: string; question_id: string; votes_count: number; positive_count: number; negative_count: number }>) {
        const isCorrect = row.votes_count > 0 && row.positive_count >= row.negative_count;
        const status = isCorrect ? 'validated' : 'rejected';

        await client.query(
          `
            UPDATE question_responses
            SET status = $2, reviewed_at = NOW()
            WHERE id = $1;
          `,
          [row.id, status]
        );

        await client.query(
          `
            UPDATE quiz_answers
            SET validation_status = $3, is_correct = $4
            WHERE attempt_id = $1
              AND question_id = $2;
          `,
          [row.attempt_id, row.question_id, status, isCorrect]
        );

        if (isCorrect) {
          validatedAnswers += 1;
        } else {
          rejectedAnswers += 1;
        }
      }

      const attemptResult = await client.query(
        `
          WITH attempt_scores AS (
            SELECT
              qa.id AS attempt_id,
              qa.user_id,
              COUNT(q.id)::int AS total_questions,
              COUNT(qr.id) FILTER (WHERE qr.status = 'validated')::int AS correct_count,
              COUNT(qr.id) FILTER (WHERE qr.status = 'rejected')::int AS incorrect_count
            FROM quiz_attempts qa
            JOIN quiz_question_assignments qqa
              ON qqa.quiz_id = qa.quiz_id
              AND qqa.assigned_to_user_id = qa.user_id
            JOIN questions q
              ON q.id = qqa.question_id
              AND q.status = 'validated'
            LEFT JOIN question_responses qr
              ON qr.attempt_id = qa.id
              AND qr.question_id = q.id
            WHERE qa.quiz_id = $1
              AND qa.completed_at IS NOT NULL
              AND qa.validation_status <> 'validated'
            GROUP BY qa.id, qa.user_id
          )
          UPDATE quiz_attempts qa
          SET
            total_questions = attempt_scores.total_questions,
            correct_count = attempt_scores.correct_count,
            incorrect_count = attempt_scores.incorrect_count,
            score = attempt_scores.correct_count,
            validation_status = 'validated'
          FROM attempt_scores
          WHERE qa.id = attempt_scores.attempt_id
          RETURNING qa.user_id, qa.score;
        `,
        [quizId]
      );

      for (const row of attemptResult.rows as Array<{ user_id: string; score: number | string }>) {
        await upsertQuizStats(client, roomId, row.user_id, null, Number(row.score));
      }

      await client.query(
        `
          DELETE FROM question_reviews
          WHERE response_id IN (
            SELECT id
            FROM question_responses
            WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE quiz_id = $1)
          );
        `,
        [quizId]
      );

      await client.query('DELETE FROM question_responses WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE quiz_id = $1);', [quizId]);

      await client.query(
        `
          UPDATE quizzes
          SET status = 'validated'
          WHERE id = $1;
        `,
        [quizId]
      );

      await client.query('COMMIT');
      return {
        validated_questions: validated,
        rejected_questions: rejected,
        validated_answers: validatedAnswers,
        rejected_answers: rejectedAnswers,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getWeeklyQuizResult(roomId: string, quizId: string, userId: string): Promise<WeeklyQuizResult | null> {
    const { rows: attemptRows } = await pool.query(
      `
        SELECT
          qa.id,
          qa.score,
          qa.correct_count,
          qa.incorrect_count,
          qa.total_questions,
          qa.duration_seconds,
          qa.validation_status,
          q.title AS quiz_title,
          q.status AS quiz_status,
          r.name AS room_name
        FROM quiz_attempts qa
        JOIN quizzes q ON q.id = qa.quiz_id
        JOIN rooms r ON r.id = q.room_id
        WHERE qa.quiz_id = $1
          AND qa.user_id = $2
          AND q.room_id = $3
          AND qa.completed_at IS NOT NULL
        LIMIT 1;
      `,
      [quizId, userId, roomId]
    );

    const attempt = attemptRows[0] as
      | {
          id: string;
          score: number | null;
          correct_count: number | null;
          incorrect_count: number | null;
          total_questions: number | null;
          duration_seconds: number | null;
          validation_status: string;
          quiz_title: string;
          quiz_status: string;
          room_name: string;
        }
      | undefined;

    if (!attempt) {
      return null;
    }

    const isValidated = attempt.quiz_status === 'validated' && attempt.validation_status === 'validated';

    if (!isValidated) {
      return {
        status: 'pending_validation',
        quiz: { id: quizId, title: attempt.quiz_title },
        room: { id: roomId, name: attempt.room_name },
        summary: null,
        details: [],
        proposed_questions: {
          validated_count: 0,
          rejected_count: null,
          items: [],
        },
      };
    }

    const { rows: detailRows } = await pool.query(
      `
        SELECT
          q.id AS question_id,
          q.question_text,
          q.type AS question_type,
          COALESCE(qa.answer_text, qa.selected_option) AS answer_text,
          COALESCE(
            q.expected_answer,
            (
              SELECT qo.option_text
              FROM question_options qo
              WHERE qo.question_id = q.id
                AND qo.is_correct = true
              ORDER BY qo.sort_order ASC
              LIMIT 1
            )
          ) AS expected_answer,
          COALESCE(qa.validation_status, 'pending') AS validation_status,
          COALESCE(qa.is_correct, false) AS is_correct
        FROM quiz_answers qa
        JOIN questions q ON q.id = qa.question_id
        WHERE qa.attempt_id = $1
          AND q.status = 'validated'
        ORDER BY q.created_at ASC;
      `,
      [attempt.id]
    );

    const { rows: proposedRows } = await pool.query(
      `
        SELECT
          q.id AS question_id,
          q.question_text,
          q.type AS question_type,
          q.status
        FROM questions q
        WHERE q.room_id = $1
          AND q.author_id = $2
          AND q.week_year = (SELECT week_year FROM quizzes WHERE id = $3)
          AND q.status IN ('validated', 'rejected')
        ORDER BY q.created_at ASC;
      `,
      [roomId, userId, quizId]
    );

    const totalQuestions = Number(attempt.total_questions ?? 0);
    const correctCount = Number(attempt.correct_count ?? 0);
    const incorrectCount = Number(attempt.incorrect_count ?? Math.max(totalQuestions - correctCount, 0));

    return {
      status: 'validated',
      quiz: { id: quizId, title: attempt.quiz_title },
      room: { id: roomId, name: attempt.room_name },
      summary: {
        score: Number(attempt.score ?? correctCount),
        total_questions: totalQuestions,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        accuracy_percentage: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
        duration_seconds: attempt.duration_seconds,
      },
      details: detailRows as WeeklyQuizResult['details'],
      proposed_questions: {
        validated_count: proposedRows.filter(row => row.status === 'validated').length,
        rejected_count: proposedRows.filter(row => row.status === 'rejected').length,
        items: proposedRows as WeeklyQuizResult['proposed_questions']['items'],
      },
    };
  },

  async resetWeeklyQuiz(roomId: string, quizId: string, weekYear: string): Promise<{ success: true; deleted_questions: number }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows: questionRows } = await client.query(
        `
          SELECT id
          FROM questions
          WHERE room_id = $1
            AND week_year = $2
            AND status IN ('pending', 'answered', 'in_validation', 'rejected');
        `,
        [roomId, weekYear]
      );
      const questionIds = questionRows.map(row => row.id as string);

      await client.query(
        `
          DELETE FROM question_reviews
          WHERE question_id = ANY($1::uuid[])
             OR response_id IN (
               SELECT id
               FROM question_responses
               WHERE question_id = ANY($1::uuid[])
                  OR attempt_id IN (SELECT id FROM quiz_attempts WHERE quiz_id = $2)
             );
        `,
        [questionIds, quizId]
      );

      await client.query('DELETE FROM question_votes WHERE question_id = ANY($1::uuid[]);', [questionIds]);
      await client.query('DELETE FROM quiz_answers WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE quiz_id = $1) OR question_id = ANY($2::uuid[]);', [quizId, questionIds]);
      await client.query('DELETE FROM question_responses WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE quiz_id = $1) OR question_id = ANY($2::uuid[]);', [quizId, questionIds]);
      await client.query('DELETE FROM quiz_question_assignments WHERE quiz_id = $1 OR question_id = ANY($2::uuid[]);', [quizId, questionIds]);
      await client.query('DELETE FROM quiz_questions WHERE quiz_id = $1 OR question_id = ANY($2::uuid[]);', [quizId, questionIds]);
      await client.query('DELETE FROM question_topics WHERE question_id = ANY($1::uuid[]);', [questionIds]);
      await client.query('DELETE FROM question_options WHERE question_id = ANY($1::uuid[]);', [questionIds]);
      await client.query('DELETE FROM questions WHERE id = ANY($1::uuid[]);', [questionIds]);
      await client.query('DELETE FROM quiz_attempts WHERE quiz_id = $1;', [quizId]);
      await client.query('DELETE FROM quizzes WHERE id = $1;', [quizId]);

      await client.query('COMMIT');
      return { success: true, deleted_questions: questionIds.length };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async listPracticeQuestions(input: {
    roomId: string;
    limit: number;
    types: string[];
  }): Promise<PracticeQuestion[]> {
    const { rows } = await pool.query(
      `
        SELECT
          q.id,
          q.room_id,
          q.type,
          q.question_text,
          NULL::text AS expected_answer,
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
        FROM questions q
        JOIN rooms r ON r.id = q.room_id
        LEFT JOIN question_options qo ON qo.question_id = q.id
        WHERE q.room_id = $1
          AND q.status = 'validated'
          AND q.type = ANY($2::text[])
          AND r.is_active = true
        GROUP BY q.id
        ORDER BY random()
        LIMIT $3;
      `,
      [input.roomId, input.types, input.limit]
    );

    return rows as PracticeQuestion[];
  },

  async findPracticeQuestion(questionId: string): Promise<{
    id: string;
    room_id: string;
    type: 'multiple_choice' | 'open';
    expected_answer: string | null;
  } | null> {
    const { rows } = await pool.query(
      `
        SELECT id, room_id, type, expected_answer
        FROM questions
        WHERE id = $1
          AND status = 'validated'
        LIMIT 1;
      `,
      [questionId]
    );

    return rows[0] ?? null;
  },

  async findCorrectOption(questionId: string): Promise<{ id: string; option_text: string } | null> {
    const { rows } = await pool.query(
      `
        SELECT id, option_text
        FROM question_options
        WHERE question_id = $1
          AND is_correct = true
        ORDER BY sort_order ASC
        LIMIT 1;
      `,
      [questionId]
    );

    return rows[0] ?? null;
  },
};

async function deleteQuestionCascade(client: any, questionId: string) {
  await client.query('DELETE FROM question_reviews WHERE question_id = $1 OR response_id IN (SELECT id FROM question_responses WHERE question_id = $1);', [questionId]);
  await client.query('DELETE FROM question_votes WHERE question_id = $1;', [questionId]);
  await client.query('DELETE FROM quiz_answers WHERE question_id = $1;', [questionId]);
  await client.query('DELETE FROM question_responses WHERE question_id = $1;', [questionId]);
  await client.query('DELETE FROM quiz_question_assignments WHERE question_id = $1;', [questionId]);
  await client.query('DELETE FROM quiz_questions WHERE question_id = $1;', [questionId]);
  await client.query('DELETE FROM question_topics WHERE question_id = $1;', [questionId]);
  await client.query('DELETE FROM question_options WHERE question_id = $1;', [questionId]);
  await client.query('DELETE FROM questions WHERE id = $1;', [questionId]);
}

async function upsertQuizStats(client: any, roomId: string, userId: string, weekYear: string | null, score: number) {
  const resolvedWeekYear = weekYear ?? getCurrentWeekYear();
  const normalizedScore = Math.trunc(Number.isFinite(score) ? score : 0);

  await client.query(
    `
      INSERT INTO room_user_weekly_stats (room_id, user_id, week_year, quiz_score, academic_score)
      VALUES ($1, $2, $3, $4, 0)
      ON CONFLICT (room_id, user_id, week_year)
      DO UPDATE SET
        quiz_score = room_user_weekly_stats.quiz_score + EXCLUDED.quiz_score,
        academic_score = FLOOR((room_user_weekly_stats.total_minutes * (room_user_weekly_stats.quiz_score + EXCLUDED.quiz_score)) / 60.0)::int,
        updated_at = NOW();
    `,
    [roomId, userId, resolvedWeekYear, normalizedScore]
  );

  await client.query(
    `
      INSERT INTO user_weekly_stats (user_id, week_year, academic_score)
      VALUES ($1, $2, 0)
      ON CONFLICT (user_id, week_year)
      DO UPDATE SET
        academic_score = user_weekly_stats.academic_score + FLOOR((user_weekly_stats.total_minutes * $3) / 60.0)::int,
        updated_at = NOW();
    `,
    [userId, resolvedWeekYear, normalizedScore]
  );
}

function getCurrentWeekYear() {
  const date = new Date();
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}
