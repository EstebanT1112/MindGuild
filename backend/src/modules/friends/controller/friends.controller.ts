import type { Request, Response } from 'express';
import { FriendsService } from '../service/friends.service.js';
import {
  FriendConflictError,
  FriendNotFoundError,
  FriendValidationError,
} from '../types/friends.types.js';

export const FriendsController = {
  async searchUsers(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autorizado.' });
      }
      const query = String(req.query.q || '').trim();
      if (query.length < 2) {
        return res.status(200).json({ success: true, data: [] });
      }
      const data = await FriendsService.searchUsers(userId, query);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('❌ Error en FriendsController.searchUsers:', error);
      return res.status(500).json({ error: 'Error interno al buscar usuarios' });
    }
  },

  /**
   * Obtiene la lista de amigos del usuario autenticado.
   * GET /api/friends
   */
  async getFriends(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado. No se encontró un usuario válido en el token.',
        });
      }

      const data = await FriendsService.getFriendsList(userId);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('❌ Error en FriendsController.getFriends:', error);
      if (error instanceof FriendValidationError) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Error interno al obtener amigos' });
    }
  },

  /**
   * Obtiene las solicitudes de amistad pendientes recibidas.
   * GET /api/friends/requests
   */
  async getRequests(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado. No se encontró un usuario válido en el token.',
        });
      }

      const data = await FriendsService.getIncomingRequests(userId);
      return res.status(200).json({ success: true, received: data });
    } catch (error: any) {
      console.error('❌ Error en FriendsController.getRequests:', error);
      return res.status(500).json({ error: 'Error interno al obtener solicitudes' });
    }
  },

  /**
   * Envía una solicitud de amistad a otro usuario ingresando su username exacto.
   * POST /api/friends/requests
   */
  async sendRequest(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = (req as any).user?.id;
      const { username } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado. No se encontró un usuario válido en el token.',
        });
      }

      if (!username) {
        return res.status(400).json({ error: 'El campo username es requerido.' });
      }

      const data = await FriendsService.sendRequest(userId, username);
      return res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error('❌ Error en FriendsController.sendRequest:', error);
      if (error instanceof FriendValidationError) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof FriendNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof FriendConflictError) {
        return res.status(409).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Error interno al enviar solicitud' });
    }
  },

  /**
   * Acepta una solicitud de amistad recibida.
   * POST /api/friends/requests/:requestId/accept
   */
  async acceptRequest(
    req: Request<{ requestId: string }>,
    res: Response
  ): Promise<Response | void> {
    try {
      const userId = (req as any).user?.id;
      const { requestId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado. No se encontró un usuario válido en el token.',
        });
      }

      const data = await FriendsService.acceptRequest(userId, requestId);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('❌ Error en FriendsController.acceptRequest:', error);
      if (error instanceof FriendValidationError) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof FriendNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof FriendConflictError) {
        return res.status(409).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Error interno al aceptar solicitud' });
    }
  },

  /**
   * Rechaza una solicitud de amistad recibida.
   * POST /api/friends/requests/:requestId/reject
   */
  async rejectRequest(
    req: Request<{ requestId: string }>,
    res: Response
  ): Promise<Response | void> {
    try {
      const userId = (req as any).user?.id;
      const { requestId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado. No se encontró un usuario válido en el token.',
        });
      }

      const data = await FriendsService.rejectRequest(userId, requestId);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('❌ Error en FriendsController.rejectRequest:', error);
      if (error instanceof FriendValidationError) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof FriendNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof FriendConflictError) {
        return res.status(409).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Error interno al rechazar solicitud' });
    }
  },

  /**
   * ✅ Elimina un amigo de la lista del usuario autenticado.
   * DELETE /api/friends/:friendId
   */
  async removeFriend(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado. No se encontró un usuario válido en el token.',
        });
      }

      // ✅ CORREGIDO: Asegurar que friendId sea string
      const friendId = Array.isArray(req.params.friendId) 
        ? req.params.friendId[0] 
        : req.params.friendId;

      if (!friendId) {
        return res.status(400).json({
          success: false,
          error: 'ID de amigo requerido',
        });
      }

      const result = await FriendsService.removeFriend(userId, friendId);

      if (result.success) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(404).json({
          success: false,
          error: result.error || 'No se pudo eliminar el amigo',
        });
      }
    } catch (error: any) {
      console.error('❌ Error en FriendsController.removeFriend:', error);
      if (error instanceof FriendValidationError) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof FriendNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof FriendConflictError) {
        return res.status(409).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Error interno al eliminar amigo' });
    }
  },
};