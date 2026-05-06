import { RoomsRepository } from '../repository/rooms.repository.js';

export const RoomsService = {
  async leaveRoom(userId: string, roomId: string) {
    // 1. Intentamos desactivar la membresía
    const result = await RoomsRepository.deactivateMember(userId, roomId);

    // 2. Si no se encontró el registro activo, lanzamos error (RF-07 Prompt 1)
    if (!result) {
      throw new Error('El usuario no pertenece a la sala o ya se encuentra inactivo');
    }

    return { success: true, message: 'Salida de sala procesada con éxito' };
  }
};
