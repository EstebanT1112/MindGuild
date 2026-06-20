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
