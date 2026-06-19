import { RoomsRepository } from '../repository/rooms.repository.js';
import { achievementService } from '../../achievements/service/achievement.service.js';
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
const MAX_ACTIVE_ROOMS_PER_USER = 15;
const MAX_ROOMS_CREATED_PER_DAY = 3;
const MAX_FAVORITE_ROOMS = 3;

export const RoomsService = {
  async createRoom(ownerId: string, input: Partial<CreateRoomDTO>): Promise<CreatedRoom> {
    // RF-04: valida datos y delega la creacion transaccional de sala + owner.
    const data = normalizeCreateRoomInput(input);
    validateCreateRoomInput(data);

    const userExists = await RoomsRepository.userExists(ownerId);

    if (!userExists) {
      throw new RoomNotFoundError('Usuario owner no encontrado');
    }

    await validateActiveRoomsLimit(ownerId);
    await validateDailyRoomCreationLimit(ownerId);

    try {
      const room = await RoomsRepository.createRoomWithOwner(ownerId, data);
      await processRoomParticipationAchievements(ownerId);
      return room;
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new RoomConflictError('No se pudo crear la sala por un conflicto de datos');
      }

      throw error;
    }
  },

  async leaveRoom(userId: string, roomId: string) {
    // RF-07: valida membresia activa antes de marcar al usuario como inactivo.
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

    if (result.role === 'owner') {
      await RoomsRepository.transferOwnershipToOldestActiveMember(roomId);
    }

    await RoomsRepository.deactivateRoomIfEmpty(roomId);

    return { success: true, message: 'Salida de sala procesada con exito' };
  },

  async joinRoom(userId: string, inviteCode: string): Promise<JoinedRoom> {
    // RF-05: valida codigo, capacidad y membresia antes de insertar o reactivar.
    const normalizedCode = normalizeInviteCode(inviteCode);

    if (!normalizedCode) {
      throw new RoomValidationError('El codigo de invitacion es requerido');
    }

    const room = await RoomsRepository.findActiveRoomByInviteCode(normalizedCode);

    if (!room || !room.is_active) {
      throw new RoomNotFoundError('Codigo de invitacion invalido o sala inactiva');
    }

    const membershipStatus = await validateJoinConditions(userId, room.id, room.max_members);
    await validateActiveRoomsLimit(userId);

    try {
      const joinedRoom = await RoomsRepository.joinRoom(room, userId, membershipStatus);
      await processRoomParticipationAchievements(userId);
      return joinedRoom;
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
    // RF-06: valida acceso, obtiene datos base y agrega integrantes activos.
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

  async markFavorite(userId: string, roomId: string): Promise<UserRoom> {
    if (!roomId) {
      throw new RoomValidationError('roomId es requerido');
    }

    const membership = await RoomsRepository.findMembership(roomId, userId);

    if (!membership?.is_active) {
      throw new RoomConflictError('No tenes acceso activo a esta sala');
    }

    const room = await RoomsRepository.findActiveRoomById(roomId);

    if (!room || !room.is_active) {
      throw new RoomNotFoundError('Sala no encontrada o inactiva');
    }

    const currentRoom = await RoomsRepository.findActiveUserRoom(userId, roomId);

    if (!currentRoom?.is_favorite) {
      const favoritesCount = await RoomsRepository.countFavoriteRoomsByUserId(userId);

      if (favoritesCount >= MAX_FAVORITE_ROOMS) {
        throw new RoomConflictError('Solo podes marcar hasta 3 salas favoritas');
      }
    }

    const updatedRoom = await RoomsRepository.setFavorite(userId, roomId, true);

    if (!updatedRoom) {
      throw new RoomConflictError('No se pudo marcar la sala como favorita');
    }

    return updatedRoom;
  },

  async unmarkFavorite(userId: string, roomId: string): Promise<UserRoom> {
    if (!roomId) {
      throw new RoomValidationError('roomId es requerido');
    }

    const membership = await RoomsRepository.findMembership(roomId, userId);

    if (!membership) {
      throw new RoomNotFoundError('El usuario no pertenece a la sala');
    }

    const updatedRoom = await RoomsRepository.setFavorite(userId, roomId, false);

    if (!updatedRoom) {
      throw new RoomConflictError('No se pudo quitar la sala de favoritas');
    }

    return updatedRoom;
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
  // Determina si la union es nueva o una reactivacion, y bloquea salas llenas.
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

async function validateActiveRoomsLimit(userId: string) {
  const activeRoomsCount = await RoomsRepository.countActiveRoomsByUserId(userId);

  if (activeRoomsCount >= MAX_ACTIVE_ROOMS_PER_USER) {
    throw new RoomConflictError('No podes superar 15 salas activas');
  }
}

async function validateDailyRoomCreationLimit(ownerId: string) {
  const roomsCreatedToday = await RoomsRepository.countRoomsCreatedToday(ownerId);

  if (roomsCreatedToday >= MAX_ROOMS_CREATED_PER_DAY) {
    throw new RoomConflictError('No podes crear mas de 3 salas en el mismo dia');
  }
}

function normalizeInviteCode(inviteCode: string): string {
  // Permite que el usuario ingrese el codigo con espacios o minusculas.
  return (inviteCode ?? '').trim().toUpperCase();
}

async function processRoomParticipationAchievements(userId: string) {
  try {
    await achievementService.handleAchievementEvent(userId, 'room_participation');
  } catch (error) {
    console.error('Error processing room participation achievements', error);
  }
}
