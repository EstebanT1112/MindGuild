import type { Request, Response } from 'express';
import { achievementService } 
from '../service/achievement.service.js';
import {
  AuthNotFoundError,
  AuthUnauthorizedError
} from '../../auth/types/auth.types.js';

export const achievementController = {
  //REQ 14 - GET/achievements
  async getAllAchievements(req: Request, res: Response) {
    try {

      const achievements =
        await achievementService
          .getAllAchievements();

      return res.status(200).json({
        success: true,
        data: achievements
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          'Error retrieving achievements'
      });
    }
  },
  //REQ 14 - GET/achievements/me
  async getUserAchievements(req: Request, res: Response) {
    try {
      const userId =
        await getAuthenticatedProfileId(req);
      const achievements =
        await achievementService.getUserAchievements(userId);

      return res.status(200).json({
        success: true,
        data: achievements,
      });
    } catch (error: any) {
      if (
        error instanceof AuthUnauthorizedError ||
        error instanceof AuthNotFoundError
      ) {
        return res.status(401).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener logros',
      });
    }
  },

  async claimAchievementReward(req: Request, res: Response) {
    try {
      const userId = await getAuthenticatedProfileId(req);
      const achievementId = Array.isArray(req.params.achievementId)
        ? req.params.achievementId[0]
        : req.params.achievementId;

      const result = await achievementService.claimAchievementReward(userId, achievementId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (
        error instanceof AuthUnauthorizedError ||
        error instanceof AuthNotFoundError
      ) {
        return res.status(401).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(400).json({
        success: false,
        error: error.message || 'No se pudo reclamar la recompensa',
      });
    }
  },
};



async function getAuthenticatedProfileId(
    req: Request
): Promise<string> {

  const userId = (req as any).user?.id;

  if (!userId) {
    throw new AuthUnauthorizedError(
      'Usuario no autenticado'
    );
  }

  return userId;
}; 
