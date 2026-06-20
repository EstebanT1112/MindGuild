import { BattleRoyaleRepository } from '../repository/battle-royale.repository.js';
import {
  BattleRoyaleConflictError,
  BattleRoyaleForbiddenError,
  BattleRoyaleNotFoundError,
  BattleRoyaleValidationError,
  type BattleQuestionType,
  type CreateQuestionInput,
  type WeeklyQuizInput,
} from '../types/battle-royale.types.js';

const VALID_WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DEFAULT_QUIZ_DURATION_MINUTES = 1440;
const EDITABLE_QUIZ_STATUSES = ['draft', 'scheduled'];

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
};

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

function getCurrentWeekYear() {
  const date = new Date();
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}
