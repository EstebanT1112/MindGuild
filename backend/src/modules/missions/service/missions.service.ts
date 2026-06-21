import { missionsRepository, type Mission } from '../repository/missions.repository.js';
import { pool } from '../../../common/config/db.js';
import { walletRepository } from '../../wallet/repository/wallet.repository.js';

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
  },

  async claimMissionReward(userId: string, userMissionId: string) {
    if (!userId) {
      throw new Error('El ID de usuario es requerido para reclamar la mision.');
    }

    if (!userMissionId) {
      throw new Error('El ID de mision de usuario es requerido.');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `
          SELECT
            um.id AS user_mission_id,
            um.completed,
            um.claimed,
            m.id AS mission_id,
            m.title,
            m.reward_coins
          FROM user_missions um
          INNER JOIN missions m ON m.id = um.mission_id
          WHERE um.id = $1
            AND um.user_id = $2
          FOR UPDATE OF um;
        `,
        [userMissionId, userId]
      );

      const mission = rows[0];

      if (!mission) {
        throw new Error('Mision no encontrada');
      }

      if (!mission.completed) {
        throw new Error('La mision todavia no esta completada');
      }

      if (mission.claimed) {
        throw new Error('La recompensa de esta mision ya fue reclamada');
      }

      const rewardCoins = Number(mission.reward_coins) || 0;

      let coinsBalance = null;
      if (rewardCoins > 0) {
        coinsBalance = await walletRepository.creditCoins(client, {
          userId,
          amount: rewardCoins,
          type: 'mission_reward',
          referenceType: 'user_mission',
          referenceId: userMissionId,
          description: `Recompensa de mision: ${mission.title}`,
        });
      }

      await client.query(
        `
          UPDATE user_missions
          SET claimed = true,
              claimed_at = NOW()
          WHERE id = $1
            AND user_id = $2;
        `,
        [userMissionId, userId]
      );

      await client.query('COMMIT');

      return {
        user_mission_id: userMissionId,
        reward_coins: rewardCoins,
        coins_balance: coinsBalance,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * PROMPT 3: Ejecuta la limpieza masiva diaria de misiones en todo el sistema.
   * Diseñado para ser invocado por procesos automáticos o crons.
   */
  async resetAllUserMissions(): Promise<void> {
    try {
      console.log('⏳ Iniciando reseteo masivo diario de misiones...');
      await missionsRepository.resetDailyMissions();
      console.log('✅ Reseteo masivo diario de misiones completado con éxito.');
    } catch (error: any) {
      console.error('❌ Error en el proceso masivo missionsService.resetAllUserMissions:', error);
      throw new Error(`Falló la actualización masiva diaria: ${error.message}`);
    }
  }
};
