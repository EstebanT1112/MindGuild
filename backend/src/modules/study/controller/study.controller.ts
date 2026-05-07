import type { Request, Response } from 'express';
import { studyService } from '../service/study.service.js';

export const studyController = {
  async getHistory(req: Request, res: Response) {
    try {
      // SEGURIDAD: Sacamos el ID del token
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Llamamos al servicio que orquestamos recién
      const historyData = await studyService.getStudyHistory(userId);
      
      return res.status(200).json({
        success: true,
        data: historyData
      });

    } catch (error: any) {
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Error al obtener el historial' 
      });
    }
  },
  async registerTime(req: Request, res: Response) {
    try {
      const { sessionId } = req.body;

      // SEGURIDAD: Obtenemos el ID del usuario desde el token (req.user)
      // Este userId viene del middleware de autenticación que ya tenés configurado
      const userId = (req as any).user?.id;

      if (!sessionId) {
        return res.status(400).json({ error: 'El sessionId es requerido' });
      }

      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Ahora le pasamos el sessionId Y el userId al servicio
      const result = await studyService.registerStudyTime(sessionId, userId);
      
      return res.status(200).json(result);

    } catch (error: any) {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }

    
  }
}


;