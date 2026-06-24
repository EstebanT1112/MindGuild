import { sessionsRepository } from '../repository/session.repository.js';
import { achievementService } from '../../achievements/service/achievement.service.js';
import { pool } from '../../../common/config/db.js';
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
    const dbPausedSeconds = session.paused_seconds ?? 0;
    const maxRealMinutes = Math.max(0, Math.floor(((endMs - startMs) / 1000 - dbPausedSeconds) / 60));

    if (data.duration_minutes > maxRealMinutes + 1) { 
      data.duration_minutes = Math.max(0, maxRealMinutes);
    }

    if (data.duration_minutes >= 1 && (!data.evidence_photo_url || !data.summary_text?.trim())) {
      throw new SessionValidationError('La evidencia fotografica y el resumen son requeridos para sesiones validas');
    }

    const completedSession = await sessionsRepository.completeSession(session, data);

    if (completedSession && data.duration_minutes >= 30) {
      try {
        const streakAchievements = await achievementService.handleAchievementEvent(userId, 'streak_updated');
        return { ...completedSession, unlocked_achievements: streakAchievements ?? [] };
      } catch (err) {
        console.error('[sessionsService] Logros de racha diferidos:', err);
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

  async getMySessions(userId: string, statusFilter?: string) {
    return sessionsRepository.listUserSessions(userId, statusFilter);
  },

  async getPendingReviews(userId: string, roomId: string) {
    if (!roomId) throw new SessionValidationError('roomId es requerido');
    const isMember = await sessionsRepository.hasActiveRoomMembership(userId, roomId);
    if (!isMember) throw new SessionForbiddenError('No sos miembro activo de esta sala');

    return sessionsRepository.listPendingSessionsForRoom(roomId, userId);
  },

  async reviewSession(userId: string, sessionId: string, vote: 'accept' | 'reject', comment: string) {
    if (!sessionId) throw new SessionValidationError('sessionId es requerido');
    if (vote !== 'accept' && vote !== 'reject') throw new SessionValidationError('Voto invalido');

    const session = await sessionsRepository.findSessionById(sessionId);
    if (!session) throw new SessionNotFoundError('Sesion no encontrada');
    if (session.status !== 'pending') throw new SessionConflictError('La sesion no esta pendiente de validacion');
    if (session.user_id === userId) throw new SessionForbiddenError('No podes votar tu propia sesion de estudio');

    if (session.room_id) {
      const isMember = await sessionsRepository.hasActiveRoomMembership(userId, session.room_id);
      if (!isMember) throw new SessionForbiddenError('No perteneces a la sala de esta sesion');
    }

    const client = await pool.connect();
    try {
      await sessionsRepository.createSessionReview(client, sessionId, userId, vote, comment ?? '');
    } catch (err: any) {
      if (err.code === '23505') throw new SessionConflictError('Ya votaste esta sesion de estudio');
      throw err;
    } finally {
      client.release();
    }

    if (vote === 'accept') {
      const validated = await sessionsRepository.validateAndImpactSession(sessionId);
      try {
        await achievementService.handleAchievementEvent(session.user_id, 'session_completed');
        await achievementService.handleAchievementEvent(session.user_id, 'study_minutes');
      } catch (achErr) {
        console.error('[sessionsService] Error al disparar logros de sesion validada:', achErr);
      }
      return { session_id: sessionId, status: 'validated', valid: true, is_impacted: true };
    } else {
      await sessionsRepository.deleteRejectedSession(sessionId);
      return { session_id: sessionId, deleted: true };
    }
  },

  async cleanupExpiredSessions() {
    return sessionsRepository.cleanupExpiredSessionsManual();
  }
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
    duration_minutes: Math.max(0, Number(input.duration_minutes ?? 0)),
    paused_seconds: Math.max(0, Number(input.paused_seconds ?? 0)),
    evidence_photo_url: input.evidence_photo_url ?? null,
    summary_text: input.summary_text ?? null,
  };
}
