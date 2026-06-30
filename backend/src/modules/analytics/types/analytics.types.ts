export type DifficultyScope = 'global' | 'room';
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
  scope: DifficultyScope;
  room_id?: string;
  period: DifficultyPeriod;
  week_year?: string;
  topics: DifficultyHeatmapTopic[];
}

export class AnalyticsValidationError extends Error {
  statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'AnalyticsValidationError';
  }
}

export class AnalyticsAccessError extends Error {
  statusCode = 403;

  constructor(message: string) {
    super(message);
    this.name = 'AnalyticsAccessError';
  }
}
