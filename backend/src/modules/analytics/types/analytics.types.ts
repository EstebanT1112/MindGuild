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

export type DashboardScope = 'global' | 'room';
export type DashboardInsightType = 'positive' | 'warning' | 'neutral';

export interface DashboardSummary {
  total_minutes: number;
  sessions_count: number;
  days_active: number;
  avg_quiz_score: number;
  academic_score: number;
}

export interface DashboardDeltas {
  minutes_percent: number | null;
  quiz_percent: number | null;
  academic_percent: number | null;
  days_active_delta: number | null;
}

export interface DashboardInsight {
  type: DashboardInsightType;
  message: string;
}

export interface DashboardResult {
  week_year: string;
  scope: DashboardScope;
  room_id?: string;
  summary: DashboardSummary;
  previous_week: DashboardSummary | null;
  deltas: DashboardDeltas;
  insights: DashboardInsight[];
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
