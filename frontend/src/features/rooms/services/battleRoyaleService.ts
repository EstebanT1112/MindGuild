import { API_BASE_URL } from '../../../services/apiConfig';
import { authenticatedFetch } from '../../../services/authenticatedFetch';

export type BattleQuestionType = 'multiple_choice' | 'open';

export interface WeeklyQuiz {
  id: string;
  room_id: string;
  created_by: string;
  title: string;
  week_year: string;
  status: string;
  weekday: string;
  start_time: string;
  duration_minutes: number;
  scheduled_at: string;
  opens_at: string;
  closes_at: string;
}

export interface BattleRoyaleConfig {
  room_id: string;
  quiz: WeeklyQuiz | null;
}

export interface QuestionOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  sort_order: number;
}

export interface BattleQuestion {
  id: string;
  room_id: string;
  author_id: string;
  type: BattleQuestionType;
  question_text: string;
  expected_answer: string | null;
  status: string;
  week_year: string;
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  options: QuestionOption[];
}

export interface WeeklyQuizInput {
  title: string;
  weekday: string;
  start_time: string;
  duration_minutes?: number;
}

export interface CreateQuestionInput {
  type: BattleQuestionType;
  question_text: string;
  expected_answer?: string;
  options?: Array<{
    option_text: string;
    is_correct: boolean;
  }>;
}

export interface WeeklyQuizStatusResult {
  quiz_id: string | null;
  status: string;
  can_start: boolean;
  must_validate: boolean;
  assigned_questions_count: number;
  answered_questions_count: number;
  opens_at: string | null;
  closes_at: string | null;
  reason?: string;
}

export interface AssignedQuizQuestion {
  id: string;
  type: BattleQuestionType;
  question_text: string;
  options: Array<{
    id: string;
    option_text: string;
  }>;
}

export interface WeeklyQuizAttempt {
  attempt_id: string;
  quiz_id: string;
  questions: AssignedQuizQuestion[];
}

export interface ValidationItem {
  type: 'question' | 'response';
  question_id: string;
  response_id: string | null;
  question_type: BattleQuestionType;
  question_text: string;
  expected_answer?: string | null;
  answer_text?: string;
  options?: Array<{
    id: string;
    option_text: string;
    is_correct: boolean;
    sort_order: number;
  }>;
  author?: {
    id: string;
    username: string;
  };
  responder?: {
    id: string;
    username: string;
  };
}

export interface WeeklyQuizResult {
  status: 'pending_validation' | 'validated';
  quiz: {
    id: string;
    title: string;
  };
  room: {
    id: string;
    name: string;
  };
  summary: {
    score: number;
    total_questions: number;
    correct_count: number;
    incorrect_count: number;
    accuracy_percentage: number;
    duration_seconds: number | null;
  } | null;
  details: Array<{
    question_id: string;
    question_text: string;
    question_type: BattleQuestionType;
    answer_text: string | null;
    expected_answer: string | null;
    validation_status: string;
    is_correct: boolean;
  }>;
  proposed_questions: {
    validated_count: number;
    rejected_count: number | null;
    items: Array<{
      question_id: string;
      question_text: string;
      question_type: BattleQuestionType;
      status: 'validated' | 'rejected';
    }>;
  };
}

export interface PracticeQuestion {
  id: string;
  room_id: string;
  type: BattleQuestionType;
  question_text: string;
  expected_answer?: string | null;
  options: Array<{
    id: string;
    option_text: string;
  }>;
}

export async function fetchBattleRoyaleConfig(
  accessToken: string,
  roomId: string
): Promise<BattleRoyaleConfig> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/battle-royale/rooms/${roomId}/config`,
    {},
    accessToken
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cargar la configuracion Battle Royale');
  }

  return data;
}

export async function createWeeklyQuiz(
  accessToken: string,
  roomId: string,
  input: WeeklyQuizInput
): Promise<WeeklyQuiz> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/battle-royale/rooms/${roomId}/weekly-quiz`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    accessToken
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo configurar el cuestionario');
  }

  return data;
}

export async function updateWeeklyQuiz(
  accessToken: string,
  roomId: string,
  quizId: string,
  input: WeeklyQuizInput
): Promise<WeeklyQuiz> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/battle-royale/rooms/${roomId}/weekly-quiz/${quizId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    accessToken
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo actualizar el cuestionario');
  }

  return data;
}

export async function fetchRoomQuestions(
  accessToken: string,
  roomId: string
): Promise<BattleQuestion[]> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/battle-royale/rooms/${roomId}/questions`,
    {},
    accessToken
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar las preguntas');
  }

  return data;
}

export async function createRoomQuestion(
  accessToken: string,
  roomId: string,
  input: CreateQuestionInput
): Promise<{ id: string; status: string }> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/battle-royale/rooms/${roomId}/questions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    accessToken
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo crear la pregunta');
  }

  return data;
}

export async function fetchWeeklyQuizStatus(
  accessToken: string,
  roomId: string
): Promise<WeeklyQuizStatusResult> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/battle-royale/rooms/${roomId}/weekly-quiz/status`,
    {},
    accessToken
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cargar el estado del quiz');
  }

  return data;
}

export async function startWeeklyQuiz(
  accessToken: string,
  roomId: string
): Promise<WeeklyQuizAttempt> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/battle-royale/rooms/${roomId}/weekly-quiz/start`,
    { method: 'POST' },
    accessToken
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo iniciar el quiz semanal');
  }

  return data;
}

export async function submitWeeklyQuizAnswer(
  accessToken: string,
  attemptId: string,
  input: { question_id: string; selected_option_id?: string; answer_text?: string }
): Promise<{ success: boolean }> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/battle-royale/weekly-quiz/${attemptId}/answers`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    accessToken
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo guardar la respuesta');
  }

  return data;
}

export async function completeWeeklyQuiz(
  accessToken: string,
  attemptId: string
): Promise<{ success: boolean; must_validate: boolean; next_screen: string }> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/battle-royale/weekly-quiz/${attemptId}/complete`,
    { method: 'POST' },
    accessToken
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo finalizar el quiz');
  }

  return data;
}

export async function fetchWeeklyQuizValidationItems(
  accessToken: string,
  roomId: string
): Promise<{ items: ValidationItem[] }> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/battle-royale/rooms/${roomId}/weekly-quiz/validation`,
    {},
    accessToken
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar las validaciones');
  }

  return data;
}

export async function voteWeeklyQuizItem(
  accessToken: string,
  input: {
    type: 'question' | 'response';
    question_id: string;
    response_id?: string | null;
    vote: 'positive' | 'negative';
  }
): Promise<{ success: boolean }> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/battle-royale/weekly-quiz/validation/vote`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    accessToken
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo registrar el voto');
  }

  return data;
}

export async function resolveWeeklyQuiz(
  accessToken: string,
  roomId: string
): Promise<{ validated_questions: number; rejected_questions: number; validated_answers: number; rejected_answers: number }> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/battle-royale/rooms/${roomId}/weekly-quiz/resolve`,
    { method: 'POST' },
    accessToken
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo resolver la validacion');
  }

  return data;
}

export async function fetchWeeklyQuizResult(
  accessToken: string,
  roomId: string
): Promise<WeeklyQuizResult | null> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/battle-royale/rooms/${roomId}/weekly-quiz/result`,
    {},
    accessToken
  );

  const data = await response.json();

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cargar el resultado del quiz');
  }

  return data;
}

export async function resetWeeklyQuiz(
  accessToken: string,
  roomId: string
): Promise<{ success: boolean; deleted_questions: number }> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/battle-royale/rooms/${roomId}/weekly-quiz/reset`,
    { method: 'POST' },
    accessToken
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo reiniciar el cuestionario');
  }

  return data;
}

export async function generatePracticeQuiz(
  accessToken: string,
  input: { room_id: string; limit?: number; types?: BattleQuestionType[] }
): Promise<{ questions: PracticeQuestion[] }> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/battle-royale/practice/generate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    accessToken
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo generar la practica');
  }

  return data;
}

export async function checkPracticeAnswer(
  accessToken: string,
  input: { question_id: string; selected_option_id?: string; answer_text?: string }
): Promise<{
  is_correct?: boolean;
  correct_option_id?: string;
  correct_option_text?: string;
  expected_answer?: string;
}> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/battle-royale/practice/check-answer`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    accessToken
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo corregir la respuesta');
  }

  return data;
}
