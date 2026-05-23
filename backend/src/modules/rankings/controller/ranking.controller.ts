import type { Request, Response } from 'express';
import { rankingsService } from '../service/ranking.service.js';
import type { RankingType } from '../types/ranking.types.js';

export const rankingsController = {
  async getRanking(req: Request, res: Response) {
    try {
      const type = (req.query.type as RankingType) || 'semanal';
      const roomId = req.query.roomId as string | undefined;
      
      // 1. Prioridad absoluta al usuario real de Auth0 que viaja en el token
      // 2. Si no hay token (desarrollo local/postman rápido), cae al mock con email de Supabase
      const userId = (req as any).user?.id || '00000000-0000-0000-0000-000000000000';

      // REACTIVAMOS LA PROTECCIÓN: 
      // Si por alguna razón extraña no hay user real Y borraste el mock de Supabase, frena acá
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Usuario no autenticado o sesión inválida' 
        });
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