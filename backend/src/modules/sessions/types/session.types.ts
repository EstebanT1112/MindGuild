export type StudySessionMode = 'pomodoro' | 'free';

export type StudySessionStatus = 
  | 'active' 
  | 'paused' 
  | 'pending' 
  | 'completed' 
  | 'cancelled'
  | 'invalid';

export interface StartSessionDTO {
  room_id: string | null;
  mode: StudySessionMode;
}

export interface EndSessionDTO {
  ended_at?: string;
  duration_minutes: number;
  paused_seconds?: number;
  evidence_photo_url?: string | null;
  summary_text?: string | null;
}

export interface StudySession {
  id: string;
  user_id: string;
  room_id: string | null;
  mode: StudySessionMode;
  status: StudySessionStatus;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  paused_seconds: number | null;
  valid: boolean;
}

export interface StudySessionPause {
  id: string;
  session_id: string;
  paused_at: string;
  resumed_at: string | null;
  created_at: string;
}

export class SessionValidationError extends Error {}
export class SessionForbiddenError extends Error {}
export class SessionNotFoundError extends Error {}
export class SessionConflictError extends Error {}