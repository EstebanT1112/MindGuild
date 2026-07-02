import { BattleRoyaleRepository } from '../repository/battle-royale.repository.js';
import { RoomsRepository } from '../../rooms/repository/rooms.repository.js';
import { notificationService } from '../../notifications/service/notification.service.js';
import {
  BattleRoyaleConflictError,
  BattleRoyaleForbiddenError,
  BattleRoyaleNotFoundError,
  BattleRoyaleValidationError,
  type BattleQuestionType,
  type CheckPracticeAnswerInput,
  type CreateQuestionInput,
  type GeneratePracticeInput,
  type SaveAnswerInput,
  type VoteInput,
  type WeeklyQuizInput,
} from '../types/battle-royale.types.js';

const VALID_WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DEFAULT_QUIZ_DURATION_MINUTES = 1440;
const EDITABLE_QUIZ_STATUSES = ['draft', 'scheduled'];
const MIN_OWN_QUESTIONS_TO_PARTICIPATE = 3;
const MAX_ASSIGNED_QUESTIONS = 8;
const DEFAULT_PRACTICE_LIMIT = 10;
const MAX_PRACTICE_LIMIT = 20;

export const BattleRoyaleService = {
  async getConfig(userId: string, roomId: string) {
    await assertBattleRoyaleAccess(userId, roomId);
    const weekYear = getCurrentWeekYear();
    const quiz = await BattleRoyaleRepository.findWeeklyQuiz(roomId, weekYear);

    return {
      room_id: roomId,
      quiz,
    };
  },

  async createWeeklyQuiz(userId: string, roomId: string, input: WeeklyQuizInput) {
    await assertBattleRoyaleAccess(userId, roomId, { ownerOnly: true });
    const data = normalizeWeeklyQuizInput(input);
    const weekYear = getCurrentWeekYear();
    const schedule = buildWeeklySchedule(data.weekday, data.start_time, data.duration_minutes);
    const existingQuiz = await BattleRoyaleRepository.findWeeklyQuiz(roomId, weekYear);

    if (existingQuiz) {
      if (!EDITABLE_QUIZ_STATUSES.includes(existingQuiz.status)) {
        throw new BattleRoyaleConflictError('El cuestionario ya no se puede editar');
      }

      const updatedQuiz = await BattleRoyaleRepository.updateWeeklyQuiz(existingQuiz.id, {
        title: data.title,
        weekday: data.weekday,
        startTime: data.start_time,
        durationMinutes: data.duration_minutes,
        ...schedule,
      });

      await notifyWeeklyQuizConfiguredForRoom(roomId, userId, updatedQuiz.id, updatedQuiz.title, true);
      return updatedQuiz;
    }

    const quiz = await BattleRoyaleRepository.createWeeklyQuiz({
      roomId,
      createdBy: userId,
      title: data.title,
      weekYear,
      weekday: data.weekday,
      startTime: data.start_time,
      durationMinutes: data.duration_minutes,
      ...schedule,
    });

    await notifyWeeklyQuizConfiguredForRoom(roomId, userId, quiz.id, quiz.title, false);
    return quiz;
  },

  async updateWeeklyQuiz(userId: string, roomId: string, quizId: string, input: WeeklyQuizInput) {
    await assertBattleRoyaleAccess(userId, roomId, { ownerOnly: true });
    const existingQuiz = await BattleRoyaleRepository.findWeeklyQuizById(roomId, quizId);

    if (!existingQuiz) {
      throw new BattleRoyaleNotFoundError('Cuestionario no encontrado');
    }

    if (!EDITABLE_QUIZ_STATUSES.includes(existingQuiz.status)) {
      throw new BattleRoyaleConflictError('El cuestionario ya no se puede editar');
    }

    const data = normalizeWeeklyQuizInput(input, {
      title: existingQuiz.title,
      weekday: existingQuiz.weekday,
      start_time: existingQuiz.start_time.slice(0, 5),
      duration_minutes: existingQuiz.duration_minutes,
    });
    const schedule = buildWeeklySchedule(data.weekday, data.start_time, data.duration_minutes);

    const updatedQuiz = await BattleRoyaleRepository.updateWeeklyQuiz(quizId, {
      title: data.title,
      weekday: data.weekday,
      startTime: data.start_time,
      durationMinutes: data.duration_minutes,
      ...schedule,
    });

    await notifyWeeklyQuizConfiguredForRoom(roomId, userId, updatedQuiz.id, updatedQuiz.title, true);
    return updatedQuiz;
  },

  async listQuestions(userId: string, roomId: string) {
    await assertBattleRoyaleAccess(userId, roomId);
    return BattleRoyaleRepository.listRoomQuestions(roomId, userId);
  },

  async listTopics(userId: string, roomId: string) {
    await assertBattleRoyaleAccess(userId, roomId);
    return BattleRoyaleRepository.listRoomTopics(roomId);
  },

  async createTopic(userId: string, roomId: string, input: { name?: string; color?: string | null } = {}) {
    await assertBattleRoyaleAccess(userId, roomId);
    const name = String(input.name ?? '').trim();
    const color = normalizeTopicColor(input.color);

    if (name.length < 2 || name.length > 50) {
      throw new BattleRoyaleValidationError('El tema debe tener entre 2 y 50 caracteres');
    }

    const slug = slugify(name);

    if (!slug) {
      throw new BattleRoyaleValidationError('El tema debe incluir letras o numeros');
    }

    const existingTopic = await BattleRoyaleRepository.findRoomTopicBySlug(roomId, slug);
    if (existingTopic) {
      return existingTopic;
    }

    return BattleRoyaleRepository.createRoomTopic({
      roomId,
      name,
      slug,
      color,
      createdBy: userId,
    });
  },

  async createQuestion(userId: string, roomId: string, input: CreateQuestionInput) {
    await assertBattleRoyaleAccess(userId, roomId);
    const question = normalizeQuestionInput(input);

    if (question.topicIds.length > 0) {
      const validTopicsCount = await BattleRoyaleRepository.countActiveTopicsByIds(roomId, question.topicIds);

      if (validTopicsCount !== question.topicIds.length) {
        throw new BattleRoyaleValidationError('Uno o mas temas no pertenecen a esta sala');
      }
    }

    return BattleRoyaleRepository.createQuestion({
      roomId,
      authorId: userId,
      weekYear: getCurrentWeekYear(),
      ...question,
    });
  },

  async deleteQuestion(userId: string, roomId: string, questionId: string) {
    await assertBattleRoyaleAccess(userId, roomId);

    const question = await BattleRoyaleRepository.findQuestionOwnership(questionId);
    if (!question || question.room_id !== roomId) {
      throw new BattleRoyaleNotFoundError('Pregunta no encontrada');
    }

    if (question.author_id !== userId) {
      throw new BattleRoyaleForbiddenError('Solo podes eliminar tus propias preguntas');
    }

    if (!['pending', 'draft'].includes(question.status)) {
      throw new BattleRoyaleConflictError('No se puede eliminar una pregunta que ya fue tomada por el quiz');
    }

    if (Number(question.used_count) > 0) {
      throw new BattleRoyaleConflictError('No se puede eliminar una pregunta que ya fue asignada o respondida');
    }

    return BattleRoyaleRepository.deleteOwnUnusedQuestion(questionId);
  },

  async getWeeklyQuizStatus(userId: string, roomId: string) {
    await assertBattleRoyaleAccess(userId, roomId);
    const quiz = await getCurrentQuizOrNull(roomId);

    if (!quiz) {
      return {
        quiz_id: null,
        status: 'not_configured',
        can_start: false,
        can_resolve: false,
        must_validate: false,
        has_completed: false,
        assigned_questions_count: 0,
        answered_questions_count: 0,
        proposed_count: 0,
        opens_at: null,
        closes_at: null,
        result_available_at: null,
        reason: 'El cuestionario semanal no esta configurado',
      };
    }

    const attempt = await BattleRoyaleRepository.findAttempt(quiz.id, userId);
    const assignedCount = await BattleRoyaleRepository.countAssignedQuestions(quiz.id, userId);
    const answeredCount = await BattleRoyaleRepository.countAnsweredQuestions(quiz.id, userId, attempt?.id);
    const isOpen = isQuizOpen(quiz);
    const isClosed = isQuizClosed(quiz);
    const resultAvailableAt = getResultAvailableAt(quiz);
    const validationItems = await BattleRoyaleRepository.listValidationItems(roomId, userId);
    const ownQuestionsCount = await BattleRoyaleRepository.countUserEligibleQuestions(roomId, userId, quiz.week_year);
    const assignableQuestionsCount = await BattleRoyaleRepository.countAssignableQuestions(roomId, userId, quiz.week_year);
    const hasCompletedAttempt = Boolean(attempt?.completed_at);
    const hasEnoughOwnQuestions = ownQuestionsCount >= MIN_OWN_QUESTIONS_TO_PARTICIPATE;
    const hasAssignedOrAssignableQuestions = assignedCount > 0 || assignableQuestionsCount > 0;
    const canStart = isOpen && !hasCompletedAttempt && hasEnoughOwnQuestions && hasAssignedOrAssignableQuestions;

    const statusResult = {
      quiz_id: quiz.id,
      status: quiz.status,
      can_start: canStart,
      can_resolve: Date.now() >= resultAvailableAt.getTime(),
      must_validate: Boolean(isClosed && validationItems.length > 0),
      has_completed: hasCompletedAttempt,
      assigned_questions_count: assignedCount,
      answered_questions_count: answeredCount,
      proposed_count: ownQuestionsCount,
      opens_at: quiz.opens_at,
      closes_at: quiz.closes_at,
      result_available_at: resultAvailableAt.toISOString(),
      reason: getWeeklyQuizUnavailableReason({
        isOpen,
        hasCompletedAttempt,
        ownQuestionsCount,
        hasAssignedOrAssignableQuestions,
      }),
    };

    return statusResult;
  },

  async startWeeklyQuiz(userId: string, roomId: string) {
    await assertBattleRoyaleAccess(userId, roomId);
    const quiz = await getCurrentQuiz(roomId);

    if (!isQuizOpen(quiz)) {
      throw new BattleRoyaleConflictError('El cuestionario esta fuera de la ventana activa');
    }

    const ownQuestionsCount = await BattleRoyaleRepository.countUserEligibleQuestions(roomId, userId, quiz.week_year);

    if (ownQuestionsCount < MIN_OWN_QUESTIONS_TO_PARTICIPATE) {
      throw new BattleRoyaleConflictError('Debes cargar al menos 3 preguntas elegibles para participar del quiz semanal');
    }

    let assignedCount = await BattleRoyaleRepository.countAssignedQuestions(quiz.id, userId);

    if (assignedCount === 0) {
      const assignableQuestions = await BattleRoyaleRepository.listAssignableQuestions(
        roomId,
        userId,
        quiz.week_year,
        MAX_ASSIGNED_QUESTIONS
      );

      await BattleRoyaleRepository.createAssignments(
        quiz.id,
        userId,
        assignableQuestions.map(question => question.id)
      );

      assignedCount = assignableQuestions.length;
    }

    const attempt =
      (await BattleRoyaleRepository.findAttempt(quiz.id, userId)) ??
      (await BattleRoyaleRepository.createAttempt(quiz.id, userId));

    if (assignedCount === 0) {
      return {
        attempt_id: attempt.id,
        quiz_id: quiz.id,
        questions: [],
      };
    }

    return {
      attempt_id: attempt.id,
      quiz_id: quiz.id,
      questions: await BattleRoyaleRepository.listAssignedQuestions(quiz.id, userId),
    };
  },

  async saveWeeklyQuizAnswer(userId: string, attemptId: string, input: SaveAnswerInput) {
    const attempt = await getAttempt(attemptId);
    const questionId = String(input.question_id ?? '').trim();

    if (!questionId) {
      throw new BattleRoyaleValidationError('question_id es requerido');
    }

    if (attempt.user_id !== userId) {
      throw new BattleRoyaleForbiddenError('No podes responder un intento de otro usuario');
    }

    if (attempt.completed_at) {
      throw new BattleRoyaleConflictError('El intento ya esta finalizado');
    }

    const question = await BattleRoyaleRepository.findAssignedQuestion(attempt.quiz_id, userId, questionId);

    if (!question) {
      throw new BattleRoyaleForbiddenError('La pregunta no esta asignada a este intento');
    }

    if (question.author_id === userId) {
      throw new BattleRoyaleForbiddenError('No podes responder una pregunta propia');
    }

    if (await BattleRoyaleRepository.hasAnswer(attemptId, questionId)) {
      throw new BattleRoyaleConflictError('La pregunta ya fue respondida');
    }

    if (question.type === 'multiple_choice') {
      const selectedOptionId = String(input.selected_option_id ?? '').trim();

      if (!selectedOptionId) {
        throw new BattleRoyaleValidationError('selected_option_id es requerido');
      }

      const option = await BattleRoyaleRepository.optionBelongsToQuestion(selectedOptionId, questionId);

      if (!option) {
        throw new BattleRoyaleValidationError('La opcion seleccionada no pertenece a la pregunta');
      }

      await BattleRoyaleRepository.saveMultipleChoiceAnswer({
        attemptId,
        questionId,
        responderUserId: userId,
        selectedOptionId,
        selectedOption: option.option_text,
        isCorrect: option.is_correct,
      });

      return { success: true };
    }

    const answerText = String(input.answer_text ?? '').trim();

    if (!answerText) {
      throw new BattleRoyaleValidationError('answer_text es requerido');
    }

    await BattleRoyaleRepository.saveOpenAnswer({
      attemptId,
      questionId,
      responderUserId: userId,
      answerText,
    });

    return { success: true };
  },

  async completeWeeklyQuiz(userId: string, attemptId: string) {
    const attempt = await getAttempt(attemptId);

    if (attempt.user_id !== userId) {
      throw new BattleRoyaleForbiddenError('No podes finalizar un intento de otro usuario');
    }

    const assignedCount = await BattleRoyaleRepository.countAssignedQuestions(attempt.quiz_id, userId);
    const answeredCount = await BattleRoyaleRepository.countAnsweredQuestions(attempt.quiz_id, userId, attemptId);

    if (assignedCount === 0) {
      throw new BattleRoyaleConflictError('No tenes preguntas asignadas para completar');
    }

    if (answeredCount < assignedCount) {
      throw new BattleRoyaleConflictError('Debes responder todas las preguntas antes de finalizar');
    }

    await BattleRoyaleRepository.completeAttempt(attemptId);

    return {
      success: true,
      must_validate: true,
      next_screen: 'weekly_quiz_validation',
    };
  },

  async listValidationItems(userId: string, roomId: string) {
    await assertBattleRoyaleAccess(userId, roomId);
    return {
      items: await BattleRoyaleRepository.listValidationItems(roomId, userId),
    };
  },

  async voteValidationItem(userId: string, input: VoteInput) {
    const type = input.type;
    const vote = input.vote;

    if (!['question', 'response'].includes(String(type))) {
      throw new BattleRoyaleValidationError('type debe ser question o response');
    }

    if (!['positive', 'negative'].includes(String(vote))) {
      throw new BattleRoyaleValidationError('vote debe ser positive o negative');
    }

    if (type === 'question') {
      const questionId = String(input.question_id ?? '').trim();

      if (!questionId) {
        throw new BattleRoyaleValidationError('question_id es requerido');
      }

      const question = await BattleRoyaleRepository.findQuestionForVote(questionId);

      if (!question) {
        throw new BattleRoyaleNotFoundError('Pregunta no encontrada');
      }

      await assertBattleRoyaleAccess(userId, question.room_id);

      if (question.author_id === userId) {
        throw new BattleRoyaleForbiddenError('No podes votar tu propia pregunta');
      }

      await BattleRoyaleRepository.saveQuestionVote(questionId, userId, vote as 'positive' | 'negative');
      return { success: true };
    }

    const responseId = String(input.response_id ?? '').trim();

    if (!responseId) {
      throw new BattleRoyaleValidationError('response_id es requerido');
    }

    const response = await BattleRoyaleRepository.findResponseForVote(responseId);

    if (!response) {
      throw new BattleRoyaleNotFoundError('Respuesta no encontrada');
    }

    await assertBattleRoyaleAccess(userId, response.room_id);

    if (response.responder_user_id === userId) {
      throw new BattleRoyaleForbiddenError('No podes votar tu propia respuesta');
    }

    await BattleRoyaleRepository.saveResponseVote(response.question_id, responseId, userId, vote as 'positive' | 'negative');
    return { success: true };
  },

  async resolveWeeklyQuiz(userId: string, roomId: string) {
    await assertBattleRoyaleAccess(userId, roomId, { ownerOnly: true });
    const quiz = await getCurrentQuiz(roomId);
    if (Date.now() < getResultAvailableAt(quiz).getTime()) {
      throw new BattleRoyaleConflictError('Los resultados se pueden generar 24 horas despues del cierre del quiz');
    }
    const result = await BattleRoyaleRepository.resolveQuestionVotes(roomId, quiz.id);
    await notifyWeeklyResultsReadyForRoom(roomId, quiz.id, quiz.title);
    return result;
  },

  async getWeeklyQuizResult(userId: string, roomId: string) {
    await assertBattleRoyaleAccess(userId, roomId);
    const quiz = await getCurrentQuiz(roomId);
    const result = await BattleRoyaleRepository.getWeeklyQuizResult(roomId, quiz.id, userId);

    if (!result) {
      throw new BattleRoyaleNotFoundError('No hay resultado para este usuario');
    }

    return result;
  },

  async resetWeeklyQuiz(userId: string, roomId: string) {
    await assertBattleRoyaleAccess(userId, roomId, { ownerOnly: true });
    const quiz = await getCurrentQuiz(roomId);
    return BattleRoyaleRepository.resetWeeklyQuiz(roomId, quiz.id, quiz.week_year);
  },

  async generatePracticeQuiz(userId: string, input: GeneratePracticeInput) {
    const roomId = String(input.room_id ?? '').trim();

    if (!roomId) {
      throw new BattleRoyaleValidationError('room_id es requerido');
    }

    await assertBattleRoyaleAccess(userId, roomId);

    const limit = normalizePracticeLimit(input.limit);
    const types = normalizePracticeTypes(input.types);

    return {
      questions: await BattleRoyaleRepository.listPracticeQuestions({
        roomId,
        limit,
        types,
      }),
    };
  },

  async checkPracticeAnswer(userId: string, input: CheckPracticeAnswerInput) {
    const questionId = String(input.question_id ?? '').trim();

    if (!questionId) {
      throw new BattleRoyaleValidationError('question_id es requerido');
    }

    const question = await BattleRoyaleRepository.findPracticeQuestion(questionId);

    if (!question) {
      throw new BattleRoyaleNotFoundError('Pregunta de practica no encontrada');
    }

    await assertBattleRoyaleAccess(userId, question.room_id);

    if (question.type === 'multiple_choice') {
      const selectedOptionId = String(input.selected_option_id ?? '').trim();

      if (!selectedOptionId) {
        throw new BattleRoyaleValidationError('selected_option_id es requerido');
      }

      const correctOption = await BattleRoyaleRepository.findCorrectOption(questionId);

      if (!correctOption) {
        throw new BattleRoyaleConflictError('La pregunta no tiene opcion correcta configurada');
      }

      return {
        is_correct: correctOption.id === selectedOptionId,
        correct_option_id: correctOption.id,
        correct_option_text: correctOption.option_text,
      };
    }

    return {
      expected_answer: question.expected_answer ?? '',
    };
  },
};

async function getCurrentQuizOrNull(roomId: string) {
  return BattleRoyaleRepository.findWeeklyQuiz(roomId, getCurrentWeekYear());
}

async function getCurrentQuiz(roomId: string) {
  const quiz = await getCurrentQuizOrNull(roomId);

  if (!quiz) {
    throw new BattleRoyaleNotFoundError('Cuestionario semanal no configurado');
  }

  return quiz;
}

async function getAttempt(attemptId: string) {
  const attempt = await BattleRoyaleRepository.findAttemptById(attemptId);

  if (!attempt) {
    throw new BattleRoyaleNotFoundError('Intento no encontrado');
  }

  return attempt;
}

async function notifyWeeklyQuizConfiguredForRoom(
  roomId: string,
  ownerId: string,
  quizId: string,
  quizTitle: string,
  isUpdate: boolean
) {
  try {
    const members = await RoomsRepository.getActiveMembers(roomId);

    await Promise.all(
      members
        .filter(member => member.id !== ownerId)
        .map(member =>
          notificationService.notifyWeeklyQuizConfigured({
            userId: member.id,
            quizId,
            quizTitle,
            isUpdate,
          })
        )
    );
  } catch (error) {
    console.error('Error notifying weekly quiz configuration', error);
  }
}

async function notifyWeeklyResultsReadyForRoom(roomId: string, quizId: string, quizTitle: string) {
  try {
    const members = await RoomsRepository.getActiveMembers(roomId);

    await Promise.all(
      members.map(member =>
        notificationService.notifyWeeklyResultsReady({
          userId: member.id,
          quizId,
          quizTitle,
        })
      )
    );
  } catch (error) {
    console.error('Error notifying weekly quiz results', error);
  }
}

async function assertBattleRoyaleAccess(userId: string, roomId: string, options: { ownerOnly?: boolean } = {}) {
  if (!roomId) {
    throw new BattleRoyaleValidationError('roomId es requerido');
  }

  const room = await BattleRoyaleRepository.findRoomById(roomId);

  if (!room) {
    throw new BattleRoyaleNotFoundError('Sala no encontrada');
  }

  if (!room.is_active) {
    throw new BattleRoyaleNotFoundError('La sala no esta activa');
  }

  if (room.mode !== 'battle_royale') {
    throw new BattleRoyaleValidationError('La sala no es Battle Royale');
  }

  const membership = await BattleRoyaleRepository.findMembership(roomId, userId);

  if (!membership?.is_active) {
    throw new BattleRoyaleForbiddenError('No perteneces activamente a esta sala');
  }

  if (options.ownerOnly && room.owner_id !== userId) {
    throw new BattleRoyaleForbiddenError('Solo el owner puede configurar el cuestionario');
  }
}

function normalizeWeeklyQuizInput(input: WeeklyQuizInput = {}, fallback?: Required<WeeklyQuizInput>) {
  const title = String(input.title ?? fallback?.title ?? 'Cuestionario semanal').trim();
  const weekday = String(input.weekday ?? fallback?.weekday ?? '').trim().toLowerCase();
  const startTime = String(input.start_time ?? fallback?.start_time ?? '').trim();
  const durationMinutes = Number(input.duration_minutes ?? fallback?.duration_minutes ?? DEFAULT_QUIZ_DURATION_MINUTES);

  if (!title) {
    throw new BattleRoyaleValidationError('El titulo del cuestionario es requerido');
  }

  if (!VALID_WEEKDAYS.includes(weekday)) {
    throw new BattleRoyaleValidationError('weekday debe ser un dia valido');
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
    throw new BattleRoyaleValidationError('start_time debe tener formato HH:mm');
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new BattleRoyaleValidationError('duration_minutes debe ser mayor a 0');
  }

  return {
    title,
    weekday,
    start_time: startTime,
    duration_minutes: durationMinutes,
  };
}

function normalizeQuestionInput(input: CreateQuestionInput = {}) {
  const type = String(input.type ?? '').trim() as BattleQuestionType;
  const questionText = String(input.question_text ?? '').trim();
  const topicIds = normalizeTopicIds(input.topic_ids);

  if (!['multiple_choice', 'open'].includes(type)) {
    throw new BattleRoyaleValidationError('type debe ser multiple_choice u open');
  }

  if (!questionText) {
    throw new BattleRoyaleValidationError('question_text es requerido');
  }

  if (type === 'open') {
    const expectedAnswer = String(input.expected_answer ?? '').trim();

    if (!expectedAnswer) {
      throw new BattleRoyaleValidationError('expected_answer es requerido para preguntas de desarrollo');
    }

    return {
      type,
      questionText,
      expectedAnswer,
      options: [],
      topicIds,
    };
  }

  const options = (input.options ?? [])
    .map(option => ({
      option_text: String(option.option_text ?? '').trim(),
      is_correct: Boolean(option.is_correct),
    }))
    .filter(option => option.option_text.length > 0);

  if (options.length < 2) {
    throw new BattleRoyaleValidationError('La pregunta multiple choice debe tener al menos 2 opciones');
  }

  const correctCount = options.filter(option => option.is_correct).length;

  if (correctCount !== 1) {
    throw new BattleRoyaleValidationError('La pregunta multiple choice debe tener exactamente una respuesta correcta');
  }

  return {
    type,
    questionText,
    expectedAnswer: null,
    options,
    topicIds,
  };
}

function normalizeTopicIds(topicIds?: string[]) {
  if (!Array.isArray(topicIds)) return [];

  const normalized = [...new Set(topicIds.map(topicId => String(topicId).trim()).filter(Boolean))];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (normalized.length > 5) {
    throw new BattleRoyaleValidationError('Una pregunta puede tener hasta 5 temas');
  }

  if (normalized.some(topicId => !uuidRegex.test(topicId))) {
    throw new BattleRoyaleValidationError('topic_ids contiene un valor invalido');
  }

  return normalized;
}

function normalizeTopicColor(color?: string | null) {
  if (color == null || String(color).trim() === '') return null;

  const normalized = String(color).trim();

  if (!/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
    throw new BattleRoyaleValidationError('color debe tener formato hexadecimal');
  }

  return normalized;
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function normalizePracticeLimit(limit?: number) {
  const parsedLimit = Number(limit ?? DEFAULT_PRACTICE_LIMIT);

  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
    throw new BattleRoyaleValidationError('limit debe ser un entero mayor a 0');
  }

  return Math.min(parsedLimit, MAX_PRACTICE_LIMIT);
}

function normalizePracticeTypes(types?: BattleQuestionType[]) {
  const selectedTypes = Array.isArray(types) && types.length > 0 ? types : ['multiple_choice', 'open'];
  const normalizedTypes = selectedTypes.map(type => String(type).trim());

  if (normalizedTypes.some(type => !['multiple_choice', 'open'].includes(type))) {
    throw new BattleRoyaleValidationError('types solo puede incluir multiple_choice u open');
  }

  return normalizedTypes;
}

function buildWeeklySchedule(weekday: string, startTime: string, durationMinutes: number) {
  const weekdayIndex = VALID_WEEKDAYS.indexOf(weekday);
  const now = new Date();
  const currentDay = (now.getDay() + 6) % 7;
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - currentDay);

  const [hours, minutes] = startTime.split(':').map(Number);
  const scheduledAt = new Date(startOfWeek);
  scheduledAt.setDate(startOfWeek.getDate() + weekdayIndex);
  scheduledAt.setHours(hours, minutes, 0, 0);

  const closesAt = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);

  return {
    scheduledAt,
    opensAt: scheduledAt,
    closesAt,
  };
}

function isQuizOpen(quiz: { opens_at: string; closes_at: string }) {
  const now = Date.now();
  return new Date(quiz.opens_at).getTime() <= now && now <= new Date(quiz.closes_at).getTime();
}

function isQuizClosed(quiz: { closes_at: string }) {
  return Date.now() > new Date(quiz.closes_at).getTime();
}

function getResultAvailableAt(quiz: { closes_at: string }) {
  return new Date(new Date(quiz.closes_at).getTime() + 24 * 60 * 60 * 1000);
}

function getWeeklyQuizUnavailableReason(input: {
  isOpen: boolean;
  hasCompletedAttempt: boolean;
  ownQuestionsCount: number;
  hasAssignedOrAssignableQuestions: boolean;
}) {
  if (!input.isOpen) {
    return 'El cuestionario esta fuera de la ventana activa';
  }

  if (input.hasCompletedAttempt) {
    return 'Ya completaste este cuestionario semanal';
  }

  if (input.ownQuestionsCount < MIN_OWN_QUESTIONS_TO_PARTICIPATE) {
    return `Debes cargar al menos ${MIN_OWN_QUESTIONS_TO_PARTICIPATE} preguntas propias para participar`;
  }

  if (!input.hasAssignedOrAssignableQuestions) {
    return 'Todavia no hay preguntas de otros integrantes para responder';
  }

  return undefined;
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
