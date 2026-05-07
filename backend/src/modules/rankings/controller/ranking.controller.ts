import type { Request, Response } from 'express';
import { rankingsService } from '../service/ranking.service.js';
import type { RankingType } from '../types/ranking.types.js';

export const rankingsController = {
  async getRanking(req: Request, res: Response) {
    try {
      const type = (req.query.type as RankingType) || 'semanal';
      const roomId = req.query.roomId as string | undefined;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const result = await rankingsService.getRanking(type, userId, roomId);

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
  }
};