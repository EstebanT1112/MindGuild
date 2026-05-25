import type { Request, Response } from 'express';
import { AuthService } from '../../auth/service/auth.service.js';
import { AuthUnauthorizedError } from '../../auth/types/auth.types.js';
import { RoomsService } from '../service/rooms.service.js';
import { RoomConflictError, RoomNotFoundError, RoomValidationError } from '../types/rooms.types.js';

export const RoomsController = {
  async getMyRooms(req: Request, res: Response) {
    try {
      const user = await getAuthenticatedProfile(req);
      const rooms = await RoomsService.getMyRooms(user.id);
      return res.status(200).json(rooms);
    } catch (error: any) {
      if (error instanceof AuthUnauthorizedError) {
        return res.status(401).json({ error: error.message });
      }

      console.error('Error interno al listar salas:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
      });

      return res.status(500).json({ error: 'Error interno al listar salas' });
    }
  },

  async getRoomDetails(req: Request, res: Response) {
    // RF-06: devuelve datos de sala solo si el usuario tiene membresia activa.
    try {
      const user = await getAuthenticatedProfile(req);
      const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
      const room = await RoomsService.getRoomDetails(user.id, roomId);
      return res.status(200).json(room);
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
        return res.status(403).json({ error: error.message });
      }

      console.error('Error interno al obtener sala:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
      });

      return res.status(500).json({ error: 'Error interno al obtener sala' });
    }
  },

  async createRoom(req: Request, res: Response) {
    // RF-04: crea una sala privada para el usuario autenticado como owner.
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
      const user = await getAuthenticatedProfile(req);
      const { room_id } = req.body;

      const response = await RoomsService.leaveRoom(user.id, room_id);
      return res.status(200).json(response);
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

      console.error('Error interno al salir de sala:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
      });

      return res.status(500).json({ error: 'Error interno al salir de sala' });
    }
  },

  async joinRoom(req: Request, res: Response) {
    // RF-05: une al usuario autenticado a una sala usando un codigo de invitacion.
    try {
      const user = await getAuthenticatedProfile(req);
      const room = await RoomsService.joinRoom(user.id, req.body?.invite_code);
      return res.status(200).json(room);
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

      console.error('Error interno al unirse a sala:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
      });

      return res.status(500).json({ error: 'Error interno al unirse a sala' });
    }
  },
};

async function getAuthenticatedProfile(req: Request) {
  // Resuelve el perfil local a partir del Bearer token de Auth0.
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    throw new AuthUnauthorizedError('Authorization Bearer token requerido');
  }

  return AuthService.getProfileFromAccessToken(
    authorization.replace('Bearer ', '').trim()
  );
}
