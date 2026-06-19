import { API_BASE_URL } from '../../../services/apiConfig';

export type StudySessionMode = 'pomodoro' | 'free';

export interface StartedSession {
  session_id: string;
  status: 'active' | 'paused';
  started_at: string;
}

export interface EndedSession {
  session_id: string;
  status: 'completed';
  valid: boolean;
  duration_minutes: number;
}

export interface PauseResumeResponse {
  session_id: string;
  status: string;
  paused_at?: string;
  paused_seconds?: number;
}

export async function startStudySession(
  accessToken: string,
  input: { room_id: string | null; mode: StudySessionMode }
): Promise<StartedSession> {
  const response = await fetch(`${API_BASE_URL}/sessions/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });

  const text = await response.text();
  if (!response.ok) {
    let errorMessage = 'No se pudo iniciar la sesion';
    try {
      const errorData = JSON.parse(text);
      errorMessage = errorData.error ?? errorMessage;
    } catch {
      console.log('Error crudo del servidor al iniciar:', text);
    }
    throw new Error(errorMessage);
  }
  return JSON.parse(text);
}

export async function pauseStudySession(
  accessToken: string,
  sessionId: string
): Promise<PauseResumeResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions/${String(sessionId)}/pause`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const text = await response.text();
  if (!response.ok) {
    let errorMessage = 'No se pudo pausar la sesion';
    try {
      const errorData = JSON.parse(text);
      errorMessage = errorData.error ?? errorMessage;
    } catch {
      console.log('Error crudo del servidor al pausar:', text);
    }
    throw new Error(errorMessage);
  }
  return JSON.parse(text);
}

export async function resumeStudySession(
  accessToken: string,
  sessionId: string
): Promise<PauseResumeResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions/${String(sessionId)}/resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const text = await response.text();
  if (!response.ok) {
    let errorMessage = 'No se pudo reanudar la sesion';
    try {
      const errorData = JSON.parse(text);
      errorMessage = errorData.error ?? errorMessage;
    } catch {
      console.log('Error crudo del servidor al reanudar:', text);
    }
    throw new Error(errorMessage);
  }
  return JSON.parse(text);
}

export async function endStudySession(
  accessToken: string,
  sessionId: string,
  input: {
    ended_at: string;
    duration_minutes: number;
    paused_seconds: number;
    evidence_photo_url?: string | null;
    summary_text?: string | null;
  }
): Promise<EndedSession> {
  const response = await fetch(`${API_BASE_URL}/sessions/${String(sessionId)}/end`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });

  const text = await response.text();
  if (!response.ok) {
    let errorMessage = 'No se pudo finalizar la sesion';
    try {
      const errorData = JSON.parse(text);
      errorMessage = errorData.error ?? errorMessage;
    } catch {
      console.log('Error crudo del servidor al finalizar:', text);
    }
    throw new Error(errorMessage);
  }
  return JSON.parse(text);
}

export async function cancelStudySession(accessToken: string, sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/sessions/${String(sessionId)}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const text = await response.text();
  if (!response.ok) {
    let errorMessage = 'No se pudo cancelar la sesion';
    try {
      const errorData = JSON.parse(text);
      errorMessage = errorData.error ?? errorMessage;
    } catch {
      console.log('Error crudo del servidor al cancelar:', text);
    }
    throw new Error(errorMessage);
  }
  return JSON.parse(text);
}