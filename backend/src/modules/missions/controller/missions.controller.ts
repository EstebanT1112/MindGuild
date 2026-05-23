import type { Request, Response } from 'express';
import { missionsService } from '../service/missions.service.js';

export const missionsController = {
  /**
   * Endpoint para obtener y asignar las misiones diarias del usuario.
   * GET /api/missions
   */
  async getUserMissions(req: Request, res: Response): Promise<void> {
    try {
      // 1. Forzamos el tipado dinámico para leer la propiedad 'user' inyectada por Auth0 sin romper TS
      const extendedReq = req as any;
      const userId = extendedReq.user?.id || 'eb391378-4f8b-4431-83fe-b18069a8a8ea';

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'No se pudo identificar al usuario en la sesión.'
        });
        return;
      }

      // 2. Llamamos al servicio para orquestar la lógica del Prompt 1
      const misiones = await missionsService.getAndAssignDailyMissions(userId);

      // 3. Respuesta exitosa con la estructura limpia para el celular
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
      const userId = extendedReq.user?.id || 'eb391378-4f8b-4431-83fe-b18069a8a8ea';
      
      const { missionType, incrementValue } = req.body;

      // Validaciones rápidas de entrada para evitar que rompa la BD
      if (!missionType) {
        res.status(400).json({ success: false, message: 'El campo missionType es requerido.' });
        return;
      }
      if (incrementValue === undefined || incrementValue <= 0) {
        res.status(400).json({ success: false, message: 'El campo incrementValue debe ser un número mayor a cero.' });
        return;
      }

      // Llamamos al servicio para actualizar el progreso e impactar si se completó
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
  }
};