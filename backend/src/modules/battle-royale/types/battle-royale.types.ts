export type BattleQuestionType = 'multiple_choice' | 'open';
export type BattleQuestionStatus = 'draft' | 'pending' | 'validated' | 'rejected';
export type WeeklyQuizStatus =
  | 'draft'
  | 'scheduled'
  | 'open'
  | 'closed'
  | 'in_validation'
  | 'validated'
  | 'expired';

export interface BattleRoom {
  id: string;
  mode: 'survival' | 'battle_royale';
  owner_id: string;
  is_active: boolean;
}

export interface BattleMembership {
  id: string;
  role: string;
  is_active: boolean;
}

export interface WeeklyQuiz {
  id: string;
  room_id: string;
  created_by: string;
  title: string;
  week_year: string;
  status: WeeklyQuizStatus;
  weekday: string;
  start_time: string;
  duration_minutes: number;
  scheduled_at: string;
  opens_at: string;
  closes_at: string;
  validation_opens_at?: string | null;
  validation_closes_at?: string | null;
}

export interface WeeklyQuizInput {
  title?: string;
  weekday?: string;
  start_time?: string;
  duration_minutes?: number;
}

export interface QuestionOptionInput {
  option_text?: string;
  is_correct?: boolean;
}

export interface CreateQuestionInput {
  type?: BattleQuestionType;
  question_text?: string;
  expected_answer?: string;
  options?: QuestionOptionInput[];
}

export interface BattleQuestion {
  id: string;
  room_id: string;
  author_id: string;
  type: BattleQuestionType;
  question_text: string;
  expected_answer: string | null;
  status: BattleQuestionStatus;
  week_year: string;
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  options: Array<{
    id: string;
    option_text: string;
    is_correct: boolean;
    sort_order: number;
  }>;
}

export class BattleRoyaleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BattleRoyaleValidationError';
  }
}

export class BattleRoyaleForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BattleRoyaleForbiddenError';
  }
}

export class BattleRoyaleNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BattleRoyaleNotFoundError';
  }
}

export class BattleRoyaleConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BattleRoyaleConflictError';
  }
}
