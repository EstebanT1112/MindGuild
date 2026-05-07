import type { Request, Response } from 'express';
import { AuthService } from '../../auth/service/auth.service.js';
import { AuthUnauthorizedError } from '../../auth/types/auth.types.js';
import { RoomsService } from '../service/rooms.service.js';
import { RoomConflictError, RoomNotFoundError, RoomValidationError } from '../types/rooms.types.js';

export const RoomsController = {
  async createRoom(req: Request, res: Response) {
    try {
      const owner = await getAuthenticatedProfile(req);
      const room = await RoomsService.createRoom(owner.id, req.body);
      return res.status(201).json(room);
    } catch (error: any) {
      if (error instanceof AuthUnauthorizedError) {
        return res.status(401).json({ error: error.message });
      }

      if (error instanceof RoomValidationError) {
        return res.status(400).json({ error: error.message });
      }

      if (error instanceof RoomNotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      if (error instanceof RoomConflictError) {
        return res.status(409).json({ error: error.message });
      }

      console.error('Error interno al crear sala:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
      });

      return res.status(500).json({ error: 'Error interno al crear sala' });
    }
  },

  async handleLeaveRoom(req: Request, res: Response) {
    try {
      const { user_id, room_id } = req.body;

      if (!user_id || !room_id) {
        return res.status(400).json({ error: 'Faltan parametros requeridos' });
      }

      const response = await RoomsService.leaveRoom(user_id, room_id);
      return res.status(200).json(response);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
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
