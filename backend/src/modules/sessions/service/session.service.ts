import { sessionsRepository } from '../repository/session.repository.js';
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

  async endSession(userId: string, sessionId: string, input: Partial<EndSessionDTO>) {
    if (!sessionId) {
      throw new SessionValidationError('sessionId es requerido');
    }

    const data = normalizeEndInput(input);

    if (data.duration_minutes < 0) {
      throw new SessionValidationError('duration_minutes no puede ser negativo');
    }

    const session = await sessionsRepository.findSessionById(sessionId);

    if (!session) {
      throw new SessionNotFoundError('Sesion no encontrada');
    }

    validateSessionOwnershipAndStatus(session.user_id, userId, session.status);

    return sessionsRepository.completeSession(session, data);
  },

  async cancelSession(userId: string, sessionId: string) {
    if (!sessionId) {
      throw new SessionValidationError('sessionId es requerido');
    }

    const session = await sessionsRepository.findSessionById(sessionId);

    if (!session) {
      throw new SessionNotFoundError('Sesion no encontrada');
    }

    validateSessionOwnershipAndStatus(session.user_id, userId, session.status);

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

function validateSessionOwnershipAndStatus(ownerId: string, currentUserId: string, status: string) {
  if (ownerId !== currentUserId) {
    throw new SessionForbiddenError('No tenes permiso para modificar esta sesion');
  }

  if (status !== 'active') {
    throw new SessionConflictError('La sesion no esta activa');
  }
}
