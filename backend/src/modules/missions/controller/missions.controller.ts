import type { Request, Response } from 'express';
import { missionsService } from '../service/missions.service.js';

type MissionFrequencyQuery = 'daily' | 'weekly' | 'all';

export const missionsController = {
  async getUserMissions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'No autorizado. No se encontro un usuario valido en el token de sesion.',
        });
        return;
      }

      const frequency = normalizeFrequency(req.query.frequency);
      const missions = await missionsService.getAndAssignMissions(userId, frequency);

      res.status(200).json({
        success: true,
        data: missions,
      });
    } catch (error: any) {
      console.error('Error en missionsController.getUserMissions:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno al procesar las misiones.',
        error: error.message,
      });
    }
  },

  async getMissionDetail(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'No autorizado. No se pudo identificar al usuario.',
        });
        return;
      }

      const userMissionId = getParam(req.params.userMissionId);
      const mission = await missionsService.getMissionDetail(userId, userMissionId);

      res.status(200).json({
        success: true,
        data: mission,
      });
    } catch (error: any) {
      res.status(error.message === 'Mision no encontrada' ? 404 : 400).json({
        success: false,
        message: error.message ?? 'No se pudo obtener el detalle de la mision.',
      });
    }
  },

  async updateUserMissionProgress(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'No autorizado. No se pudo identificar al usuario para actualizar el progreso.',
        });
        return;
      }

      const { missionType, incrementValue } = req.body;

      if (!missionType) {
        res.status(400).json({ success: false, message: 'El campo missionType es requerido.' });
        return;
      }
      if (incrementValue === undefined || Number(incrementValue) <= 0) {
        res.status(400).json({ success: false, message: 'El campo incrementValue debe ser un numero mayor a cero.' });
        return;
      }

      const updatedMissions = await missionsService.updateProgress(userId, missionType, Number(incrementValue));

      res.status(200).json({
        success: true,
        message: 'Progreso de mision actualizado correctamente.',
        data: updatedMissions,
      });
    } catch (error: any) {
      console.error('Error en missionsController.updateUserMissionProgress:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno al actualizar el progreso de la mision.',
        error: error.message,
      });
    }
  },

  async claimMissionReward(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'No autorizado. No se pudo identificar al usuario.',
        });
        return;
      }

      const userMissionId = getParam(req.params.userMissionId);
      const result = await missionsService.claimMissionReward(userId, userMissionId);

      res.status(200).json({
        success: true,
        message: 'Recompensa de mision reclamada correctamente.',
        data: result,
      });
    } catch (error: any) {
      const message = error.message ?? 'No se pudo reclamar la recompensa de la mision.';
      const status = message.includes('ya fue reclamada') ? 409 : message.includes('no esta completada') ? 400 : 404;

      res.status(status).json({
        success: false,
        message,
      });
    }
  },
};

function normalizeFrequency(value: unknown): MissionFrequencyQuery {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw === 'daily' || raw === 'weekly') {
    return raw;
  }

  return 'all';
}

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : value ?? '';
}
