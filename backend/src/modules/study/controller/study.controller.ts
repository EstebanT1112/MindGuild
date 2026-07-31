import type { Request, Response } from 'express';
import { studyService } from '../service/study.service.js';

export const studyController = {
  async getHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const historyData = await studyService.getStudyHistory(userId);

      return res.status(200).json({
        success: true,
        data: historyData,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener el historial',
      });
    }
  },
};
