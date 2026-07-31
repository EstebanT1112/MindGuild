import { RoomsRepository } from '../repository/rooms.repository.js';
import { achievementService } from '../../achievements/service/achievement.service.js';
import { rankingsService } from '../../rankings/service/ranking.service.js';
import { sessionsRepository } from '../../sessions/repository/session.repository.js';
import {
  type AssignTemporaryRoleDTO,
  RoomConflictError,
  RoomNotFoundError,
  type RoomRolesResponse,
  RoomValidationError,
  type CreateRoomDTO,
  type CreatedRoom,
  type JoinedRoom,
  type MembershipJoinStatus,
  type RoomDetails,
  type RoomMode,
  type UpdateRoomDTO,
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

    const activeSession = await sessionsRepository.findActiveSessionByUserAndRoom(userId, roomId);

    if (activeSession) {
      throw new RoomConflictError('No podes abandonar la sala mientras tenes una sesion activa');
    }

    const result = await RoomsRepository.deactivateMember(userId, roomId);

    if (!result) {
      throw new RoomConflictError('No se pudo procesar la salida de sala');
    }

    await RoomsRepository.deactivateTeamMembershipsInRoom(userId, roomId);

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

    const [members, teams] = await Promise.all([
      RoomsRepository.getActiveMembersWithRoles(roomId, rankingsService.getCurrentWeekYear()),
      room.teams_enabled ? RoomsRepository.getRoomTeamSummaries(roomId) : Promise.resolve([]),
    ]);

    return {
      ...room,
      members,
      teams,
    };
  },

  async getRoomRoles(userId: string, roomId: string): Promise<RoomRolesResponse> {
    await validateActiveRoomAccess(userId, roomId);

    const weekYear = rankingsService.getCurrentWeekYear();
    const boss = await RoomsRepository.findCurrentBoss(roomId, weekYear);
    const members = await RoomsRepository.getActiveMembersWithRoles(roomId, weekYear);

    return {
      room_id: roomId,
      week_year: weekYear,
      boss_user_id: boss?.boss_user_id ?? null,
      members,
    };
  },

  async assignTemporaryRole(
    userId: string,
    roomId: string,
    input: Partial<AssignTemporaryRoleDTO>
  ): Promise<RoomRolesResponse> {
    await validateActiveRoomAccess(userId, roomId);

    const data = normalizeAssignTemporaryRoleInput(input);
    validateAssignTemporaryRoleInput(data);

    const weekYear = rankingsService.getCurrentWeekYear();
    const boss = await RoomsRepository.findCurrentBoss(roomId, weekYear);

    if (!boss) {
      throw new RoomConflictError('Todavia no hay jefe semanal definido para esta sala');
    }

    if (boss.boss_user_id !== userId) {
      throw new RoomConflictError('Solo el jefe semanal vigente puede asignar roles');
    }

    const targetMembership = await RoomsRepository.findMembership(roomId, data.target_user_id);

    if (!targetMembership?.is_active) {
      throw new RoomNotFoundError('El integrante no pertenece activamente a la sala');
    }

    const existingRole = await RoomsRepository.findTemporaryRole(roomId, data.target_user_id, weekYear);

    if (existingRole) {
      throw new RoomConflictError('Este integrante ya tiene un rol asignado esta semana');
    }

    try {
      await RoomsRepository.assignTemporaryRole(
        roomId,
        data.target_user_id,
        userId,
        weekYear,
        data.temporary_role
      );
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new RoomConflictError('Este integrante ya tiene un rol asignado esta semana');
      }

      if (error?.code === '23514') {
        throw new RoomValidationError('El rol debe tener entre 1 y 10 caracteres');
      }

      throw error;
    }

    return this.getRoomRoles(userId, roomId);
  },

  async getAdminRoomDetails(userId: string, roomId: string): Promise<RoomDetails> {
    await validateOwnerAccess(userId, roomId);
    return this.getRoomDetails(userId, roomId);
  },

  async updateRoom(userId: string, roomId: string, input: Partial<UpdateRoomDTO>): Promise<RoomDetails> {
    await validateOwnerAccess(userId, roomId);

    const data = normalizeUpdateRoomInput(input);
    validateUpdateRoomInput(data);

    const updatedRoom = await RoomsRepository.updateRoom(roomId, data);

    if (!updatedRoom) {
      throw new RoomNotFoundError('Sala no encontrada o inactiva');
    }

    const [members, teams] = await Promise.all([
      RoomsRepository.getActiveMembersWithRoles(roomId, rankingsService.getCurrentWeekYear()),
      updatedRoom.teams_enabled ? RoomsRepository.getRoomTeamSummaries(roomId) : Promise.resolve([]),
    ]);

    return {
      ...updatedRoom,
      members,
      teams,
    };
  },

  async removeMember(ownerId: string, roomId: string, targetUserId: string): Promise<{ success: boolean; message: string }> {
    await validateOwnerAccess(ownerId, roomId);

    if (!targetUserId) {
      throw new RoomValidationError('memberId es requerido');
    }

    if (targetUserId === ownerId) {
      throw new RoomConflictError('No podes expulsarte a vos mismo');
    }

    const targetMembership = await RoomsRepository.findMembership(roomId, targetUserId);

    if (!targetMembership?.is_active) {
      throw new RoomNotFoundError('El integrante no pertenece activamente a la sala');
    }

    if (targetMembership.role === 'owner') {
      throw new RoomConflictError('No se puede expulsar al owner de la sala');
    }

    const activeSession = await sessionsRepository.findActiveSessionByUserAndRoom(targetUserId, roomId);

    if (activeSession) {
      await sessionsRepository.cancelSession(activeSession.id);
    }

    const result = await RoomsRepository.removeMember(roomId, targetUserId, ownerId);

    if (!result) {
      throw new RoomConflictError('No se pudo expulsar al integrante');
    }

    await RoomsRepository.deactivateTeamMembershipsInRoom(targetUserId, roomId);

    return { success: true, message: 'Integrante expulsado con exito' };
  }, // ⚡ CORRECCIÓN: Se cerró correctamente el método anterior antes de declarar el siguiente

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

function normalizeUpdateRoomInput(input: Partial<UpdateRoomDTO>): UpdateRoomDTO {
  const data: UpdateRoomDTO = {};

  if (Object.prototype.hasOwnProperty.call(input, 'name')) {
    data.name = typeof input.name === 'string' ? input.name.trim() : undefined;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'description')) {
    data.description = typeof input.description === 'string' ? input.description.trim() : input.description ?? null;
  }

  return data;
}

function validateUpdateRoomInput(input: UpdateRoomDTO) {
  if (input.name !== undefined && !input.name) {
    throw new RoomValidationError('El nombre de la sala es requerido');
  }

  if (input.name && input.name.length > 60) {
    throw new RoomValidationError('El nombre de la sala no puede superar los 60 caracteres');
  }

  if (input.description && input.description.length > 240) {
    throw new RoomValidationError('La descripcion no puede superar los 240 caracteres');
  }
}

async function validateOwnerAccess(userId: string, roomId: string) {
  if (!roomId) {
    throw new RoomValidationError('roomId es requerido');
  }

  const membership = await RoomsRepository.findMembership(roomId, userId);

  if (!membership?.is_active) {
    throw new RoomConflictError('No tenes acceso activo a esta sala');
  }

  if (membership.role !== 'owner') {
    throw new RoomConflictError('Solo el owner puede administrar la sala');
  }

  const room = await RoomsRepository.findActiveRoomById(roomId);

  if (!room || !room.is_active) {
    throw new RoomNotFoundError('Sala no encontrada o inactiva');
  }
}

async function validateActiveRoomAccess(userId: string, roomId: string) {
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

function normalizeAssignTemporaryRoleInput(input: Partial<AssignTemporaryRoleDTO>): AssignTemporaryRoleDTO {
  return {
    target_user_id: (input.target_user_id ?? '').trim(),
    temporary_role: (input.temporary_role ?? '').trim(),
  };
}

function validateAssignTemporaryRoleInput(input: AssignTemporaryRoleDTO) {
  if (!input.target_user_id) {
    throw new RoomValidationError('target_user_id es requerido');
  }

  if (!input.temporary_role) {
    throw new RoomValidationError('temporary_role es requerido');
  }

  if (Array.from(input.temporary_role).length > 10) {
    throw new RoomValidationError('El rol no puede superar 10 caracteres');
  }
}

async function processRoomParticipationAchievements(userId: string) {
  try {
    await achievementService.handleAchievementEvent(userId, 'room_participation');
  } catch (error) {
    console.error('Error processing room participation achievements', error);
  }
}
