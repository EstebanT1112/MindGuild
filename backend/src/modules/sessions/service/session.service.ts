import { sessionsRepository } from '../repository/session.repository.js';
import { achievementService } from '../../achievements/service/achievement.service.js';
import {
  SessionConflictError,
  SessionForbiddenError,
  SessionNotFoundError,
  SessionValidationError,
  type EndSessionDTO,
  type StartSessionDTO,
  type StudySessionMode,
} from '../types/session.types.js';

const VALID_MODES: StudySessionMode[] = ['pomodoro', 'free'];

export const sessionsService = {
  async startSession(userId: string, input: Partial<StartSessionDTO>) {
    const data = normalizeStartInput(input);
    if (!VALID_MODES.includes(data.mode)) {
      throw new SessionValidationError('Modo de sesion invalido');
    }

    const userExists = await sessionsRepository.userExists(userId);
    if (!userExists) {
      throw new SessionNotFoundError('Usuario no encontrado o inactivo');
    }

    if (data.room_id) {
      const isMember = await sessionsRepository.hasActiveRoomMembership(userId, data.room_id);
      if (!isMember) {
        throw new SessionForbiddenError('No tenes acceso activo a esta sala');
      }
    }

    const activeSession = await sessionsRepository.findActiveSessionByUser(userId);
    if (activeSession) {
      throw new SessionConflictError('Ya tenes una sesion activa');
    }

    return sessionsRepository.createSession(userId, data);
  },

  async pauseSession(userId: string, sessionId: string) {
    if (!sessionId) throw new SessionValidationError('sessionId es requerido');

    const session = await sessionsRepository.findSessionById(sessionId);
    if (!session) throw new SessionNotFoundError('Sesion no encontrada');

    if (session.user_id !== userId) {
      throw new SessionForbiddenError('No tenes permiso para modificar esta sesion');
    }
    if (session.status !== 'active') {
      throw new SessionConflictError('Solo se pueden pausar sesiones activas');
    }

    return sessionsRepository.pauseSession(sessionId);
  },

  async resumeSession(userId: string, sessionId: string) {
    if (!sessionId) throw new SessionValidationError('sessionId es requerido');

    const session = await sessionsRepository.findSessionById(sessionId);
    if (!session) throw new SessionNotFoundError('Sesion no encontrada');

    if (session.user_id !== userId) {
      throw new SessionForbiddenError('No tenes permiso para modificar esta sesion');
    }
    if (session.status !== 'paused') {
      throw new SessionConflictError('La sesion no esta pausada');
    }

    return sessionsRepository.resumeSession(sessionId);
  },

  async endSession(userId: string, sessionId: string, input: Partial<EndSessionDTO>) {
    if (!sessionId) throw new SessionValidationError('sessionId es requerido');

    const data = normalizeEndInput(input);
    if (data.duration_minutes < 0) {
      throw new SessionValidationError('duration_minutes no puede ser negativo');
    }

    const session = await sessionsRepository.findSessionById(sessionId);
    if (!session) throw new SessionNotFoundError('Sesion no encontrada');

    if (session.user_id !== userId) {
      throw new SessionForbiddenError('No tenes permiso para modificar esta sesion');
    }
    if (session.status !== 'active' && session.status !== 'paused') {
      throw new SessionConflictError('La sesion no se encuentra en un estado modificable');
    }

    const finalEndedAt = data.ended_at ?? new Date().toISOString();
    data.ended_at = finalEndedAt;

    const startMs = new Date(session.started_at).getTime();
    const endMs = new Date(finalEndedAt).getTime();
    if (Number.isNaN(endMs)) {
      throw new SessionValidationError('ended_at invalido');
    }

    const dbPausedSeconds = session.paused_seconds ?? 0;
    const maxRealMinutes = Math.max(0, Math.floor(((endMs - startMs) / 1000 - dbPausedSeconds) / 60));

    if (data.duration_minutes > maxRealMinutes + 1) { 
      data.duration_minutes = Math.max(0, maxRealMinutes);
    }

    // Guardamos la sesión de estudio de forma segura
    const completedSession = await sessionsRepository.completeSession(session, data);

    // ⚡ CORREGIDO: Si la sesión es válida, procesamos los logros de forma SECUENCIAL
    // Evitamos Promise.all para que el pooler de Supabase no colapse por concurrencia de queries pesadas
    if (completedSession && completedSession.valid && completedSession.duration_minutes > 0) {
      try {
        // Evaluamos primero un evento liberando su conexión y luego el otro
        const sessionAchievements = await achievementService.handleAchievementEvent(userId, 'session_completed');
        const streakAchievements = await achievementService.handleAchievementEvent(userId, 'streak_updated');

        return {
          ...completedSession,
          unlocked_achievements: [...(sessionAchievements ?? []), ...(streakAchievements ?? [])],
        };
      } catch (achievementError) {
        // Logueamos el error de logros pero NO rompemos la respuesta principal del usuario
        console.error('[sessionsService] Non-critical achievements processing error:', achievementError);
      }
    }

    return completedSession;
  },

  async cancelSession(userId: string, sessionId: string) {
    if (!sessionId) throw new SessionValidationError('sessionId es requerido');

    const session = await sessionsRepository.findSessionById(sessionId);
    if (!session) throw new SessionNotFoundError('Sesion no encontrada');

    if (session.user_id !== userId) {
      throw new SessionForbiddenError('No tenes permiso para modificar esta sesion');
    }
    if (session.status !== 'active' && session.status !== 'paused') {
      throw new SessionConflictError('La sesion no se encuentra en un estado modificable');
    }

    return sessionsRepository.cancelSession(sessionId);
  },
};

function normalizeStartInput(input: Partial<StartSessionDTO>): StartSessionDTO {
  return {
    room_id: input.room_id ? String(input.room_id) : null,
    mode: input.mode as StudySessionMode,
  };
}

function normalizeEndInput(input: Partial<EndSessionDTO>): EndSessionDTO {
  return {
    ended_at: input.ended_at,
    duration_minutes: Number(input.duration_minutes ?? 0),
    paused_seconds: Number(input.paused_seconds ?? 0),
    evidence_photo_url: input.evidence_photo_url ?? null,
    summary_text: input.summary_text ?? null,
  };
}