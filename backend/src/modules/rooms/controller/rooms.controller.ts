import type { Request, Response } from 'express';
import { RoomsService } from '../service/rooms.service.js';


export const RoomsController = {
  async handleLeaveRoom(req: Request, res: Response) {
    try {
      const { user_id, room_id } = req.body; // El front manda estos IDs

      if (!user_id || !room_id) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }

      const response = await RoomsService.leaveRoom(user_id, room_id);
      return res.status(200).json(response);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
};
