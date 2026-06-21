import type { Request, Response } from 'express';
import { missionsService } from '../service/missions.service.js';

export const missionsController = {
  /**
   * Endpoint para obtener y asignar las misiones diarias del usuario.
   * GET /api/missions
   */
  async getUserMissions(req: Request, res: Response): Promise<void> {
    try {
      const extendedReq = req as any;
      // ⚡ SACAMOS EL ID REAL. Quitamos el fallback hardcodeado para que no se crucen las misiones
      const userId = extendedReq.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'No autorizado. No se encontró un usuario válido en el token de sesión.'
        });
        return;
      }

      // Llamamos al servicio para orquestar la lógica del Prompt 1 con el usuario real
      const misiones = await missionsService.getAndAssignDailyMissions(userId);

      res.status(200).json({
        success: true,
        data: misiones
      });
    } catch (error: any) {
      console.error('❌ Error en missionsController.getUserMissions:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno al procesar las misiones diarias.',
        error: error.message
      });
    }
  },

  /**
   * PROMPT 2: Endpoint para incrementar el progreso de una misión específica.
   * POST /api/missions/progress
   */
  async updateUserMissionProgress(req: Request, res: Response): Promise<void> {
    try {
      const extendedReq = req as any;
      // ⚡ SACAMOS EL ID REAL DINÁMICO DEL TOKEN
      const userId = extendedReq.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'No autorizado. No se pudo identificar al usuario para actualizar el progreso.'
        });
        return;
      }

      const { missionType, incrementValue } = req.body;

      if (!missionType) {
        res.status(400).json({ success: false, message: 'El campo missionType es requerido.' });
        return;
      }
      if (incrementValue === undefined || incrementValue <= 0) {
        res.status(400).json({ success: false, message: 'El campo incrementValue debe ser un número mayor a cero.' });
        return;
      }

      // Actualizamos el progreso usando el ID del usuario logueado actualmente
      const updatedMissions = await missionsService.updateProgress(userId, missionType, Number(incrementValue));

      res.status(200).json({
        success: true,
        message: 'Progreso de misión actualizado correctamente.',
        data: updatedMissions
      });
    } catch (error: any) {
      console.error('❌ Error en missionsController.updateUserMissionProgress:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno al actualizar el progreso de la misión.',
        error: error.message
      });
    }
  },

  async claimMissionReward(req: Request, res: Response): Promise<void> {
    try {
      const extendedReq = req as any;
      const userId = extendedReq.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'No autorizado. No se pudo identificar al usuario.',
        });
        return;
      }

      const userMissionId = Array.isArray(req.params.userMissionId)
        ? req.params.userMissionId[0]
        : req.params.userMissionId;

      const result = await missionsService.claimMissionReward(userId, userMissionId);

      res.status(200).json({
        success: true,
        message: 'Recompensa de mision reclamada correctamente.',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message ?? 'No se pudo reclamar la recompensa de la mision.',
      });
    }
  }
};
