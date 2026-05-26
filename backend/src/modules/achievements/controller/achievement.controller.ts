import type { Request, Response } from 'express';
import { achievementService } 
from '../service/achievement.service.js';
import { AuthService }
  from '../../auth/service/auth.service.js';
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
};



async function getAuthenticatedProfileId(
    req: Request
): Promise<string> {

  const authorization =
    req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    throw new AuthUnauthorizedError(
      'Authorization Bearer token requerido'
    );
  }

  const profile =
    await AuthService.getProfileFromAccessToken(
      authorization
        .replace('Bearer ', '')
        .trim()
    );

  return profile.id;
}; 
