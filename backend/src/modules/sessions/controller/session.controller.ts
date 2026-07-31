import type { Request, Response } from 'express';
import { sessionsService } from '../service/session.service.js';

export const sessionsController = {
  async startSession(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const result = await sessionsService.startSession(userId, req.body);
      res.status(201).json(result);
    } catch (error: any) {
      handleControllerError(error, res);
    }
  },

  async pauseSession(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const result = await sessionsService.pauseSession(userId, String(id));
      res.status(200).json(result);
    } catch (error: any) {
      handleControllerError(error, res);
    }
  },

  async resumeSession(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const result = await sessionsService.resumeSession(userId, String(id));
      res.status(200).json(result);
    } catch (error: any) {
      handleControllerError(error, res);
    }
  },

  async endSession(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const result = await sessionsService.endSession(userId, String(id), req.body);
      res.status(200).json(result);
    } catch (error: any) {
      handleControllerError(error, res);
    }
  },

  async cancelSession(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const result = await sessionsService.cancelSession(userId, String(id));
      res.status(200).json(result);
    } catch (error: any) {
      handleControllerError(error, res);
    }
  },

  async getMySessions(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { status } = req.query;
      const result = await sessionsService.getMySessions(userId, status as string);
      res.status(200).json(result);
    } catch (error: any) {
      handleControllerError(error, res);
    }
  },

  async getPendingReviewsByRoom(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { roomId } = req.params;
      const result = await sessionsService.getPendingReviews(userId, String(roomId));
      res.status(200).json(result);
    } catch (error: any) {
      handleControllerError(error, res);
    }
  },

  async reviewSession(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { vote, comment } = req.body;
      const result = await sessionsService.reviewSession(userId, String(id), vote, comment);
      res.status(200).json(result);
    } catch (error: any) {
      handleControllerError(error, res);
    }
  },

  async cleanupExpiredSessions(req: Request, res: Response) {
    try {
      const result = await sessionsService.cleanupExpiredSessions();
      res.status(200).json(result);
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }
};

function handleControllerError(error: any, res: Response) {
  const name = error?.constructor?.name;
  console.error(`[sessionsController] Error capturado (${name}):`, error?.message);

  if (name === 'SessionValidationError') return res.status(400).json({ message: error.message });
  if (name === 'SessionForbiddenError') return res.status(403).json({ message: error.message });
  if (name === 'SessionNotFoundError') return res.status(404).json({ message: error.message });
  if (name === 'SessionConflictError') return res.status(409).json({ message: error.message });

  return res.status(500).json({ message: 'Internal Server Error', detail: error?.message });
}