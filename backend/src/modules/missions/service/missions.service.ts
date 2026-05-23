import { missionsRepository, type Mission } from '../repository/missions.repository.js';

export const missionsService = {
  /**
   * Orquesta la asignación y obtención de misiones diarias para un usuario.
   * Cumple con el Prompt 1:
   * 1. Obtiene las misiones activas globales.
   * 2. Intenta asignarlas al usuario (evitando duplicados en la base de datos).
   * 3. Devuelve las misiones detalladas del usuario.
   */
  async getAndAssignDailyMissions(userId: string): Promise<any[]> {
    if (!userId) {
      throw new Error('El ID de usuario es requerido para procesar misiones.');
    }

    // 1. Consultar en la tabla base todas las misiones marcadas como active = true
    const activeMissions = await missionsRepository.getActiveMissions();

    // Si no hay misiones configuradas en el sistema, retornamos lista vacía de una
    if (activeMissions.length === 0) {
      return [];
    }

    // Mapeamos solo los IDs para la inserción masiva
    const activeMissionIds = activeMissions.map((mission: Mission) => mission.id);

    // 2. Intentar crear el registro en user_missions para las misiones que no existan aún
    await missionsRepository.assignMissionsToUser(userId, activeMissionIds);

    // 3. Retornar el estado actual de las misiones del usuario con todos sus detalles (título, recompensas, etc.)
    const userMissions = await missionsRepository.getUserMissionsWithDetails(userId);
    
    return userMissions;
  }
};