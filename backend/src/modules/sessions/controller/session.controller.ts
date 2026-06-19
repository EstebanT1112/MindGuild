import type { Request, Response } from 'express';
import { AuthService } from '../../auth/service/auth.service.js';
import { AuthUnauthorizedError } from '../../auth/types/auth.types.js';
import { sessionsService } from '../service/session.service.js';
import {
  SessionConflictError,
  SessionForbiddenError,
  SessionNotFoundError,
  SessionValidationError,
} from '../types/session.types.js';

export const sessionsController = {
  async start(req: Request, res: Response) {
    try {
      const user = await getAuthenticatedProfile(req);
      const session = await sessionsService.startSession(user.id, req.body);
      return res.status(201).json(session);
    } catch (error: any) {
      return handleSessionError(error, res, 'Error interno al iniciar sesion');
    }
  },

  // ⚡ RF-10: Controlador de pausa
  async pause(req: Request, res: Response) {
    try {
      const user = await getAuthenticatedProfile(req);
      const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await sessionsService.pauseSession(user.id, sessionId);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleSessionError(error, res, 'Error interno al pausar sesion');
    }
  },

  // ⚡ RF-10: Controlador de reanudación
  async resume(req: Request, res: Response) {
    try {
      const user = await getAuthenticatedProfile(req);
      const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await sessionsService.resumeSession(user.id, sessionId);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleSessionError(error, res, 'Error interno al reanudar sesion');
    }
  },

  async end(req: Request, res: Response) {
    try {
      const user = await getAuthenticatedProfile(req);
      const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      // ⚡ MEJORADO: Validación adicional del body para debug
      const { duration_minutes, ended_at } = req.body;
      if (typeof duration_minutes !== 'number' || duration_minutes < 0) {
        console.warn('[sessionsController] Invalid duration_minutes received', {
          userId: user.id,
          sessionId,
          receivedValue: duration_minutes,
          type: typeof duration_minutes,
        });
      }
      const session = await sessionsService.endSession(user.id, sessionId, req.body);
      return res.status(200).json(session);
    } catch (error: any) {
      return handleSessionError(error, res, 'Error interno al finalizar sesion');
    }
  },

  async cancel(req: Request, res: Response) {
    try {
      const user = await getAuthenticatedProfile(req);
      const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const session = await sessionsService.cancelSession(user.id, sessionId);
      return res.status(200).json(session);
    } catch (error: any) {
      return handleSessionError(error, res, 'Error interno al cancelar sesion');
    }
  },
};

async function getAuthenticatedProfile(req: Request) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    throw new AuthUnauthorizedError('Authorization Bearer token requerido');
  }
  return AuthService.getProfileFromAccessToken(
    authorization.replace('Bearer ', '').trim()
  );
}

function handleSessionError(error: any, res: Response, fallbackMessage: string) {
  if (error instanceof AuthUnauthorizedError) return res.status(401).json({ error: error.message });
  if (error instanceof SessionValidationError) return res.status(400).json({ error: error.message });
  if (error instanceof SessionForbiddenError) return res.status(403).json({ error: error.message });
  if (error instanceof SessionNotFoundError) return res.status(404).json({ error: error.message });
  if (error instanceof SessionConflictError) return res.status(409).json({ error: error.message });

  console.error(fallbackMessage, {
    message: error?.message,
    code: error?.code,
    detail: error?.detail,
  });
  return res.status(500).json({ error: fallbackMessage });
}