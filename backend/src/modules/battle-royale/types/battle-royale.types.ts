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

export interface WeeklyQuizResultDetail {
  question_id: string;
  question_text: string;
  question_type: BattleQuestionType;
  answer_text: string | null;
  expected_answer: string | null;
  validation_status: string;
  is_correct: boolean;
}

export interface WeeklyQuizProposedQuestionResult {
  question_id: string;
  question_text: string;
  question_type: BattleQuestionType;
  status: 'validated' | 'rejected';
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
  details: WeeklyQuizResultDetail[];
  proposed_questions: {
    validated_count: number;
    rejected_count: number | null;
    items: WeeklyQuizProposedQuestionResult[];
  };
}

export interface SaveAnswerInput {
  question_id?: string;
  selected_option_id?: string;
  answer_text?: string;
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

export interface VoteInput {
  type?: 'question' | 'response';
  question_id?: string;
  response_id?: string | null;
  vote?: 'positive' | 'negative';
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

export interface GeneratePracticeInput {
  room_id?: string;
  limit?: number;
  types?: BattleQuestionType[];
}

export interface CheckPracticeAnswerInput {
  question_id?: string;
  selected_option_id?: string;
  answer_text?: string;
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
