import { API_BASE_URL } from '../../../services/apiConfig';

export type StudySessionMode = 'pomodoro' | 'free';

export interface StartedSession {
  session_id: string;
  status: 'active';
  started_at: string;
}

export interface EndedSession {
  session_id: string;
  status: 'completed';
  valid: boolean;
  duration_minutes: number;
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo iniciar la sesion');
  }

  return data;
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
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/end`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo finalizar la sesion');
  }

  return data;
}

export async function cancelStudySession(accessToken: string, sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cancelar la sesion');
  }

  return data;
}
