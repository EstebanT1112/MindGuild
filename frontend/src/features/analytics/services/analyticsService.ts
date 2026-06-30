import { API_BASE_URL } from '../../../services/apiConfig';
import { authenticatedFetch } from '../../../services/authenticatedFetch';

export type DifficultyPeriod = 'week' | 'all';
export type DifficultyLevel = 'low' | 'medium' | 'high';

export interface DifficultyHeatmapTopic {
  topic_id: string | null;
  topic_name: string;
  total_answers: number;
  wrong_answers: number;
  difficulty_score: number;
  level: DifficultyLevel;
}

export interface DifficultyHeatmapResult {
  scope: 'global' | 'room';
  room_id?: string;
  period: DifficultyPeriod;
  week_year?: string;
  topics: DifficultyHeatmapTopic[];
}

export async function fetchRoomDifficultyHeatmap(
  accessToken: string,
  roomId: string,
  period: DifficultyPeriod
): Promise<DifficultyHeatmapResult> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/rooms/${roomId}/analytics/difficulty-heatmap?period=${period}`,
    {},
    accessToken
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cargar el heatmap de dificultad');
  }

  return data;
}

export async function fetchMyDifficultyHeatmap(
  accessToken: string,
  period: DifficultyPeriod
): Promise<DifficultyHeatmapResult> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/analytics/me/difficulty-heatmap?period=${period}`,
    {},
    accessToken
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cargar tu heatmap de dificultad');
  }

  return data;
}
