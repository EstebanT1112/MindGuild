import { missionsRepository, type Mission } from '../repository/missions.repository.js';

export const missionsService = {
  /**
   * Orquesta la asignación y obtención de misiones diarias para un usuario.
   * Cumple con el Prompt 1.
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
  },

  /**
   * PROMPT 2: Registra e incrementa el progreso de un tipo específico de misión para el usuario.
   * Valida la existencia del usuario, actualiza los valores y retorna la lista renovada.
   */
  async updateProgress(userId: string, missionType: string, incrementValue: number): Promise<any[]> {
    if (!userId) {
      throw new Error('El ID de usuario es requerido para actualizar el progreso.');
    }
    if (!missionType) {
      throw new Error('El tipo de misión es requerido para procesar el incremento.');
    }
    if (incrementValue <= 0) {
      throw new Error('El valor de incremento debe ser mayor a cero.');
    }

    // 1. Mandamos a actualizar de forma masiva el progreso en la BD para ese tipo de misión
    await missionsRepository.updateMissionProgress(userId, missionType, incrementValue);

    // 2. Retornamos el estado actualizado de todas sus misiones para refrescar la UI del celular
    return await missionsRepository.getUserMissionsWithDetails(userId);
  }
};