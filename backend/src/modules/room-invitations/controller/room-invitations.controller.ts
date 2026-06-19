import type { Request, Response } from 'express';
import { AuthService } from '../../auth/service/auth.service.js';
import { AuthUnauthorizedError } from '../../auth/types/auth.types.js';
import { RoomInvitationsService } from '../service/room-invitations.service.js';
import {
  RoomInvitationConflictError,
  RoomInvitationForbiddenError,
  RoomInvitationNotFoundError,
  RoomInvitationValidationError,
} from '../types/room-invitations.types.js';

export const RoomInvitationsController = {
  /**
   * ✉️ POST /api/room-invitations
   */
  async createInvitation(req: Request, res: Response): Promise<Response | void> {
    try {
      const user = await getAuthenticatedProfile(req);
      const { room_id, receiver_id } = req.body;

      const invitation = await RoomInvitationsService.sendInvitation(user.id, room_id, receiver_id);
      return res.status(201).json(invitation);
    } catch (error: any) {
      if (error instanceof AuthUnauthorizedError) return res.status(401).json({ error: error.message });
      if (error instanceof RoomInvitationValidationError) return res.status(400).json({ error: error.message });
      if (error instanceof RoomInvitationNotFoundError) return res.status(404).json({ error: error.message });
      if (error instanceof RoomInvitationForbiddenError) return res.status(403).json({ error: error.message });
      if (error instanceof RoomInvitationConflictError) return res.status(409).json({ error: error.message });

      console.error('❌ Error en RoomInvitationsController.createInvitation:', error);
      return res.status(500).json({ error: 'Error interno al enviar invitación de sala.' });
    }
  },

  /**
   * 📬 GET /api/room-invitations
   */
  async getReceivedInvitations(req: Request, res: Response): Promise<Response | void> {
    try {
      const user = await getAuthenticatedProfile(req);
      const invitations = await RoomInvitationsService.getPendingReceivedInvitations(user.id);
      return res.status(200).json(invitations);
    } catch (error: any) {
      if (error instanceof AuthUnauthorizedError) return res.status(401).json({ error: error.message });

      console.error('❌ Error en RoomInvitationsController.getReceivedInvitations:', error);
      return res.status(500).json({ error: 'Error interno al listar invitaciones.' });
    }
  },

  /**
   * ✅ POST /api/room-invitations/:invitationId/accept
   */
  async acceptInvitation(
    req: Request<{ invitationId: string }>,
    res: Response
  ): Promise<Response | void> {
    try {
      const user = await getAuthenticatedProfile(req);
      const { invitationId } = req.params;

      const result = await RoomInvitationsService.acceptInvitation(user.id, invitationId);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof AuthUnauthorizedError) return res.status(401).json({ error: error.message });
      if (error instanceof RoomInvitationValidationError) return res.status(400).json({ error: error.message });
      if (error instanceof RoomInvitationNotFoundError) return res.status(404).json({ error: error.message });
      if (error instanceof RoomInvitationForbiddenError) return res.status(403).json({ error: error.message });
      if (error instanceof RoomInvitationConflictError) return res.status(409).json({ error: error.message });

      console.error('❌ Error en RoomInvitationsController.acceptInvitation:', error);
      return res.status(500).json({ error: 'Error interno al aceptar la invitación.' });
    }
  },

  /**
   * 🛑 POST /api/room-invitations/:invitationId/reject
   */
  async rejectInvitation(
    req: Request<{ invitationId: string }>,
    res: Response
  ): Promise<Response | void> {
    try {
      const user = await getAuthenticatedProfile(req);
      const { invitationId } = req.params;

      const result = await RoomInvitationsService.rejectInvitation(user.id, invitationId);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof AuthUnauthorizedError) return res.status(401).json({ error: error.message });
      if (error instanceof RoomInvitationValidationError) return res.status(400).json({ error: error.message });
      if (error instanceof RoomInvitationNotFoundError) return res.status(404).json({ error: error.message });
      if (error instanceof RoomInvitationForbiddenError) return res.status(403).json({ error: error.message });
      if (error instanceof RoomInvitationConflictError) return res.status(409).json({ error: error.message });

      console.error('❌ Error en RoomInvitationsController.rejectInvitation:', error);
      return res.status(500).json({ error: 'Error interno al rechazar la invitación.' });
    }
  }
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

export default RoomInvitationsController;