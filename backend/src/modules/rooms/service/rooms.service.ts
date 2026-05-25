import { RoomsRepository } from '../repository/rooms.repository.js';
import {
  RoomConflictError,
  RoomNotFoundError,
  RoomValidationError,
  type CreateRoomDTO,
  type CreatedRoom,
  type JoinedRoom,
  type MembershipJoinStatus,
  type RoomDetails,
  type RoomMode,
  type UserRoom,
} from '../types/rooms.types.js';

const VALID_ROOM_MODES: RoomMode[] = ['survival', 'battle_royale'];

export const RoomsService = {
  async createRoom(ownerId: string, input: Partial<CreateRoomDTO>): Promise<CreatedRoom> {
    // RF-04: valida datos y delega la creacion transaccional de sala + owner.
    const data = normalizeCreateRoomInput(input);
    validateCreateRoomInput(data);

    const userExists = await RoomsRepository.userExists(ownerId);

    if (!userExists) {
      throw new RoomNotFoundError('Usuario owner no encontrado');
    }

    try {
      return await RoomsRepository.createRoomWithOwner(ownerId, data);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new RoomConflictError('No se pudo crear la sala por un conflicto de datos');
      }

      throw error;
    }
  },

  async leaveRoom(userId: string, roomId: string) {
    if (!roomId) {
      throw new RoomValidationError('room_id es requerido');
    }

    const membership = await RoomsRepository.findMembership(roomId, userId);

    if (!membership) {
      throw new RoomNotFoundError('El usuario no pertenece a la sala');
    }

    if (!membership.is_active) {
      throw new RoomConflictError('El usuario ya se encuentra inactivo en la sala');
    }

    const result = await RoomsRepository.deactivateMember(userId, roomId);

    if (!result) {
      throw new RoomConflictError('No se pudo procesar la salida de sala');
    }

    return { success: true, message: 'Salida de sala procesada con exito' };
  },

  async joinRoom(userId: string, inviteCode: string): Promise<JoinedRoom> {
    const normalizedCode = normalizeInviteCode(inviteCode);

    if (!normalizedCode) {
      throw new RoomValidationError('El codigo de invitacion es requerido');
    }

    const room = await RoomsRepository.findActiveRoomByInviteCode(normalizedCode);

    if (!room || !room.is_active) {
      throw new RoomNotFoundError('Codigo de invitacion invalido o sala inactiva');
    }

    const membershipStatus = await validateJoinConditions(userId, room.id, room.max_members);

    try {
      return await RoomsRepository.joinRoom(room, userId, membershipStatus);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new RoomConflictError('El usuario ya pertenece a la sala');
      }

      throw error;
    }
  },

  async getMyRooms(userId: string): Promise<UserRoom[]> {
    return RoomsRepository.findActiveRoomsByUserId(userId);
  },

  async getRoomDetails(userId: string, roomId: string): Promise<RoomDetails> {
    if (!roomId) {
      throw new RoomValidationError('roomId es requerido');
    }

    const membership = await RoomsRepository.findMembership(roomId, userId);

    if (!membership?.is_active) {
      throw new RoomConflictError('No tenes acceso a esta sala');
    }

    const room = await RoomsRepository.findActiveRoomById(roomId);

    if (!room || !room.is_active) {
      throw new RoomNotFoundError('Sala no encontrada o inactiva');
    }

    const members = await RoomsRepository.getActiveMembers(roomId);

    return {
      ...room,
      members,
    };
  },
};

function normalizeCreateRoomInput(input: Partial<CreateRoomDTO>): CreateRoomDTO {
  // Normaliza el contrato recibido desde frontend antes de validar.
  return {
    name: (input.name ?? '').trim(),
    mode: input.mode as RoomMode,
    teams_enabled: Boolean(input.teams_enabled),
  };
}

function validateCreateRoomInput(input: CreateRoomDTO) {
  // Aplica reglas de negocio previas al insert en rooms.
  if (!input.name) {
    throw new RoomValidationError('El nombre de la sala es requerido');
  }

  if (input.name.length > 60) {
    throw new RoomValidationError('El nombre de la sala no puede superar los 60 caracteres');
  }

  if (!VALID_ROOM_MODES.includes(input.mode)) {
    throw new RoomValidationError('El modo de sala no es valido');
  }
}

async function validateJoinConditions(
  userId: string,
  roomId: string,
  maxMembers: number
): Promise<MembershipJoinStatus> {
  const membership = await RoomsRepository.findMembership(roomId, userId);

  if (membership?.is_active) {
    throw new RoomConflictError('Ya perteneces a esta sala');
  }

  const activeMembersCount = await RoomsRepository.countActiveMembers(roomId);

  if (activeMembersCount >= maxMembers) {
    throw new RoomConflictError('La sala esta llena');
  }

  return membership ? 'reactivate' : 'new';
}

function normalizeInviteCode(inviteCode: string): string {
  return (inviteCode ?? '').trim().toUpperCase();
}
