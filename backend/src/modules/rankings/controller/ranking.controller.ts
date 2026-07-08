import type { Request, Response } from 'express';
import { AuthService } from '../../auth/service/auth.service.js';
import { AuthUnauthorizedError } from '../../auth/types/auth.types.js';
import { rankingsService } from '../service/ranking.service.js';
import {
  RankingForbiddenError,
  RankingNotFoundError,
  RankingValidationError,
  type RankingType,
  type RankingScope, // ✅ Importamos el tipo
} from '../types/ranking.types.js';

export const rankingsController = {
  async getRanking(req: Request, res: Response) {
    try {
      const type = (req.query.type as RankingType) || 'semanal';
      const roomId = (req.query.roomId || req.query.room_id) as string | undefined;
      const scope = (req.query.scope as RankingScope) || 'global'; // ✅ Extraemos el scope
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Usuario no autenticado o sesion invalida' });
      }

      // ✅ Pasamos el scope al servicio
      const result = await rankingsService.getRanking(type, userId, roomId, scope);

      return res.status(200).json({
        success: true,
        data: result
      });

    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  async recalculateWeek(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });

      const result = await rankingsService.recalculateWeek(userId, req.body ?? {});
      return res.status(200).json(result);
    } catch (error: any) {
      return handleRankingError(error, res, 'Error interno al recalcular ranking semanal');
    }
  },

  async closeWeek(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });

      const result = await rankingsService.closeWeek(userId, req.body ?? {});
      return res.status(200).json(result);
    } catch (error: any) {
      return handleRankingError(error, res, 'Error interno al cerrar semana');
    }
  },

  async getRoomTimeRanking(req: Request, res: Response) {
    try {
      const user = await getAuthenticatedProfile(req);
      const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
      const ranking = await rankingsService.getRoomTimeRanking(user.id, roomId);

      return res.status(200).json(ranking);
    } catch (error: any) {
      if (error instanceof AuthUnauthorizedError) {
        return res.status(401).json({ error: error.message });
      }

      if (error instanceof RankingValidationError) {
        return res.status(400).json({ error: error.message });
      }

      if (error instanceof RankingNotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      if (error instanceof RankingForbiddenError) {
        return res.status(403).json({ error: error.message });
      }

      console.error('Error interno al obtener ranking de tiempo:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
      });

      return res.status(500).json({ error: 'Error interno al obtener ranking de tiempo' });
    }
  },
};

function handleRankingError(error: any, res: Response, fallbackMessage: string) {
  if (error instanceof RankingValidationError) {
    return res.status(400).json({ error: error.message });
  }

  if (error instanceof RankingNotFoundError) {
    return res.status(404).json({ error: error.message });
  }

  if (error instanceof RankingForbiddenError) {
    return res.status(403).json({ error: error.message });
  }

  console.error(fallbackMessage, {
    message: error?.message,
    code: error?.code,
    detail: error?.detail,
  });

  return res.status(500).json({ error: fallbackMessage });
}

async function getAuthenticatedProfile(req: Request) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    throw new AuthUnauthorizedError('Authorization Bearer token requerido');
  }

  return AuthService.getProfileFromAccessToken(
    authorization.replace('Bearer ', '').trim()
  );
}