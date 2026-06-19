import { API_BASE_URL } from '../../../services/apiConfig';

export type StudySessionMode = 'pomodoro' | 'free';

export interface StartedSession {
  session_id: string;
  status: 'active' | 'paused';
  started_at: string;
}

// ⚡ NUEVO: Sincronizado con el modelo de estados atómicos del backend
export interface EndedSession {
  session_id: string;
  status: 'invalid' | 'pending';
  valid: boolean;
  duration_minutes: number;
}

export interface PauseResumeResponse {
  session_id: string;
  status: string;
  paused_at?: string;
  paused_seconds?: number;
}

export interface PendingReviewSession {
  id: string;
  username: string;
  avatar_url: string | null;
  duration_minutes: number;
  evidence_photo_url: string;
  summary_text: string;
  created_at: string;
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
      errorMessage = errorData.message ?? errorMessage;
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
      errorMessage = errorData.message ?? errorMessage;
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
      errorMessage = errorData.message ?? errorMessage;
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
      errorMessage = errorData.message ?? errorMessage;
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
      errorMessage = errorData.message ?? errorMessage;
    } catch {
      console.log('Error crudo del servidor al cancelar:', text);
    }
    throw new Error(errorMessage);
  }
  return JSON.parse(text);
}

// ⚡ NUEVO: Obtener mis sesiones de estudio (Historial Propio)
export async function fetchMyStudySessions(accessToken: string, statusFilter?: string): Promise<any[]> {
  const url = statusFilter ? `${API_BASE_URL}/sessions/me?status=${statusFilter}` : `${API_BASE_URL}/sessions/me`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('No se pudo recuperar tu historial de estudio');
  return response.json();
}

// ⚡ NUEVO: Obtener sesiones pendientes de votar de los compañeros de sala
export async function fetchPendingSessionReviews(accessToken: string, roomId: string): Promise<PendingReviewSession[]> {
  const response = await fetch(`${API_BASE_URL}/sessions/rooms/${String(roomId)}/pending-reviews`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('No se pudieron listar las revisiones de la sala');
  return response.json();
}

// ⚡ NUEVO: Enviar voto cruzado (Aceptar / Rechazar)
export async function reviewStudySession(
  accessToken: string,
  sessionId: string,
  input: { vote: 'accept' | 'reject'; comment?: string }
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/sessions/${String(sessionId)}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'No se pudo procesar la votacion');
  }
  return response.json();
}