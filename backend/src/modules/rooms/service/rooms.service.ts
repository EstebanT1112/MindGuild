import { RoomsRepository } from '../repository/rooms.repository.js';
import {
  RoomConflictError,
  RoomNotFoundError,
  RoomValidationError,
  type CreateRoomDTO,
  type CreatedRoom,
  type RoomMode,
} from '../types/rooms.types.js';

const VALID_ROOM_MODES: RoomMode[] = ['survival', 'battle_royale'];

export const RoomsService = {
  async createRoom(ownerId: string, input: Partial<CreateRoomDTO>): Promise<CreatedRoom> {
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
    const result = await RoomsRepository.deactivateMember(userId, roomId);

    if (!result) {
      throw new Error('El usuario no pertenece a la sala o ya se encuentra inactivo');
    }

    return { success: true, message: 'Salida de sala procesada con exito' };
  },
};

function normalizeCreateRoomInput(input: Partial<CreateRoomDTO>): CreateRoomDTO {
  return {
    name: (input.name ?? '').trim(),
    mode: input.mode as RoomMode,
    teams_enabled: Boolean(input.teams_enabled),
  };
}

function validateCreateRoomInput(input: CreateRoomDTO) {
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
