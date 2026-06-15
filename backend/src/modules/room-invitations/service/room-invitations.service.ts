import { RoomInvitationsRepository } from '../repository/room-invitations.repository.js';
import { RoomsRepository } from '../../rooms/repository/rooms.repository.js';
import {
  RoomInvitationConflictError,
  RoomInvitationForbiddenError,
  RoomInvitationNotFoundError,
  RoomInvitationValidationError,
} from '../types/room-invitations.types.js';

export const RoomInvitationsService = {
  /**
   * ✉️ Envía una invitación a un amigo para unirse a una sala
   */
  async sendInvitation(senderId: string, roomId: string, receiverId: string) {
    if (!roomId) throw new RoomInvitationValidationError('El room_id es requerido.');
    if (!receiverId) throw new RoomInvitationValidationError('El receiver_id es requerido.');

    // 1. Evitar auto-invitación
    if (senderId === receiverId) {
      throw new RoomInvitationValidationError('No podés invitarte a vos mismo a una sala.');
    }

    // 2. Validar que la sala exista y esté activa
    const room = await RoomInvitationsRepository.findActiveRoomById(roomId);
    if (!room) {
      throw new RoomInvitationNotFoundError('La sala no existe o no se encuentra activa.');
    }

    // 3. Validar que el emisor sea un miembro activo de esa sala
    const isSenderMember = await RoomsRepository.checkActiveMembership(senderId, roomId);
    if (!isSenderMember) {
      throw new RoomInvitationForbiddenError('No podés invitar amigos si no sos miembro activo de la sala.');
    }

    // 4. Validar que sean amigos en la plataforma
    const areFriends = await RoomInvitationsRepository.areFriends(senderId, receiverId);
    if (!areFriends) {
      throw new RoomInvitationForbiddenError('Solo podés enviar invitaciones a usuarios que tengas agregados como amigos.');
    }

    // 5. Validar que el receptor no sea ya un miembro activo de la sala
    const isReceiverMember = await RoomsRepository.checkActiveMembership(receiverId, roomId);
    if (isReceiverMember) {
      throw new RoomInvitationConflictError('El usuario ya es un miembro activo de esta sala.');
    }

    // 6. Validar si ya existe una invitación pendiente igual
    const existingInvitation = await RoomInvitationsRepository.findPendingInvitation(roomId, senderId, receiverId);
    if (existingInvitation) {
      throw new RoomInvitationConflictError('Ya existe una invitación pendiente de envío para este amigo en esta sala.');
    }

    // 7. Crear la invitación
    return RoomInvitationsRepository.createInvitation(roomId, senderId, receiverId);
  },

  /**
   * 📬 Lista todas las invitaciones pendientes recibidas por el usuario
   */
  async getPendingReceivedInvitations(userId: string) {
    return RoomInvitationsRepository.listPendingReceivedInvitations(userId);
  },

  /**
   * ✅ Acepta una invitación de sala (Transaccional)
   */
  async acceptInvitation(userId: string, invitationId: string) {
    if (!invitationId) throw new RoomInvitationValidationError('El invitationId es requerido.');

    // 1. Validar existencia de la invitación
    const invitation = await RoomInvitationsRepository.findInvitationById(invitationId);
    if (!invitation) {
      throw new RoomInvitationNotFoundError('La invitación de sala no existe.');
    }

    // 2. Validar que esté pendiente
    if (invitation.status !== 'pending') {
      throw new RoomInvitationConflictError('Esta invitación ya fue respondida.');
    }

    // 3. Validar que el usuario autenticado sea realmente el receptor
    if (invitation.receiver_id !== userId) {
      throw new RoomInvitationForbiddenError('No tenés permisos para responder a esta invitación.');
    }

    // 4. Validar que la sala siga existiendo y esté activa
    const room = await RoomInvitationsRepository.findActiveRoomById(invitation.room_id);
    if (!room) {
      throw new RoomInvitationNotFoundError('La sala asociada a la invitación ya no existe o está inactiva.');
    }

    // 5. Validar si ya se unió por código (limpieza automática de estado)
    const isAlreadyMember = await RoomsRepository.checkActiveMembership(userId, invitation.room_id);
    if (isAlreadyMember) {
      await RoomInvitationsRepository.autoAcceptInvitation(invitation.room_id, userId);
      throw new RoomInvitationConflictError('Ya formás parte de esta sala de estudio.');
    }

    // 6. Determinar si es una nueva membresía o reactivación usando el repo de tu equipo
    const previousMembership = await RoomsRepository.findMembership(invitation.room_id, userId);
    const isReactivation = previousMembership !== null;

    try {
      // 7. Ejecutar la transacción blindada (Verifica capacidad e inserta/reactiva en espejo)
      await RoomInvitationsRepository.acceptInvitationTransaction(
        invitationId,
        invitation.room_id,
        userId,
        isReactivation
      );

      // 8. Retornar los detalles para la redirección automática del frontend
      return {
        success: true,
        room: {
          id: room.id,
          name: room.name,
          membership_status: isReactivation ? 'reactivate' : 'new'
        }
      };
    } catch (error: any) {
      if (error.message === 'CAPACITY_EXCEEDED') {
        throw new RoomInvitationConflictError('La sala de estudio alcanzó su capacidad máxima de miembros.');
      }
      throw error;
    }
  },

  /**
   * 🛑 Rechaza una invitación de sala
   */
  async rejectInvitation(userId: string, invitationId: string) {
    if (!invitationId) throw new RoomInvitationValidationError('El invitationId es requerido.');

    const invitation = await RoomInvitationsRepository.findInvitationById(invitationId);
    if (!invitation) {
      throw new RoomInvitationNotFoundError('La invitación de sala no existe.');
    }

    if (invitation.status !== 'pending') {
      throw new RoomInvitationConflictError('Esta invitación ya fue respondida.');
    }

    if (invitation.receiver_id !== userId) {
      throw new RoomInvitationForbiddenError('No tenés permisos para rechazar esta invitación.');
    }

    await RoomInvitationsRepository.rejectInvitation(invitationId);
    return { success: true };
  }
};