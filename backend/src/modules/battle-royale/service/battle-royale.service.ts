import { BattleRoyaleRepository } from '../repository/battle-royale.repository.js';
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

      return BattleRoyaleRepository.updateWeeklyQuiz(existingQuiz.id, {
        title: data.title,
        weekday: data.weekday,
        startTime: data.start_time,
        durationMinutes: data.duration_minutes,
        ...schedule,
      });
    }

    return BattleRoyaleRepository.createWeeklyQuiz({
      roomId,
      createdBy: userId,
      title: data.title,
      weekYear,
      weekday: data.weekday,
      startTime: data.start_time,
      durationMinutes: data.duration_minutes,
      ...schedule,
    });
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

    return BattleRoyaleRepository.updateWeeklyQuiz(quizId, {
      title: data.title,
      weekday: data.weekday,
      startTime: data.start_time,
      durationMinutes: data.duration_minutes,
      ...schedule,
    });
  },

  async listQuestions(userId: string, roomId: string) {
    await assertBattleRoyaleAccess(userId, roomId);
    return BattleRoyaleRepository.listRoomQuestions(roomId, userId);
  },

  async createQuestion(userId: string, roomId: string, input: CreateQuestionInput) {
    await assertBattleRoyaleAccess(userId, roomId);
    const question = normalizeQuestionInput(input);

    return BattleRoyaleRepository.createQuestion({
      roomId,
      authorId: userId,
      weekYear: getCurrentWeekYear(),
      ...question,
    });
  },

  async getWeeklyQuizStatus(userId: string, roomId: string) {
    await assertBattleRoyaleAccess(userId, roomId);
    const quiz = await getCurrentQuizOrNull(roomId);

    if (!quiz) {
      return {
        quiz_id: null,
        status: 'not_configured',
        can_start: false,
        must_validate: false,
        assigned_questions_count: 0,
        answered_questions_count: 0,
        opens_at: null,
        closes_at: null,
        reason: 'El cuestionario semanal no esta configurado',
      };
    }

    const attempt = await BattleRoyaleRepository.findAttempt(quiz.id, userId);
    const assignedCount = await BattleRoyaleRepository.countAssignedQuestions(quiz.id, userId);
    const answeredCount = await BattleRoyaleRepository.countAnsweredQuestions(quiz.id, userId, attempt?.id);
    const isOpen = isQuizOpen(quiz);
    const validationItems = await BattleRoyaleRepository.listValidationItems(roomId, userId);
    const ownQuestionsCount = await BattleRoyaleRepository.countUserEligibleQuestions(roomId, userId, quiz.week_year);
    const assignableQuestionsCount = await BattleRoyaleRepository.countAssignableQuestions(roomId, userId, quiz.week_year);
    const hasCompletedAttempt = Boolean(attempt?.completed_at);
    const hasEnoughOwnQuestions = ownQuestionsCount >= MIN_OWN_QUESTIONS_TO_PARTICIPATE;
    const hasAssignedOrAssignableQuestions = assignedCount > 0 || assignableQuestionsCount > 0;
    const canStart = isOpen && !hasCompletedAttempt && hasEnoughOwnQuestions && hasAssignedOrAssignableQuestions;

    return {
      quiz_id: quiz.id,
      status: quiz.status,
      can_start: canStart,
      must_validate: Boolean(attempt?.completed_at && validationItems.length > 0),
      assigned_questions_count: assignedCount,
      answered_questions_count: answeredCount,
      opens_at: quiz.opens_at,
      closes_at: quiz.closes_at,
      reason: getWeeklyQuizUnavailableReason({
        isOpen,
        hasCompletedAttempt,
        ownQuestionsCount,
        hasAssignedOrAssignableQuestions,
      }),
    };
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
    return BattleRoyaleRepository.resolveQuestionVotes(roomId, quiz.id);
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
  };
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
