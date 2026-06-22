import type { Request, Response } from 'express';
import { ChatService } from '../service/chat.service.js';

export class ChatController {
  static async getRoomMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const messages = await ChatService.listRoomMessages({
        roomId: String(req.params.roomId),
        userId,
        limit,
        before: typeof req.query.before === 'string' ? req.query.before : undefined,
        after: typeof req.query.after === 'string' ? req.query.after : undefined,
      });

      res.json({ success: true, messages });
    } catch (error: any) {
      handleChatError(res, error, 'Error interno al obtener mensajes de sala');
    }
  }

  static async sendRoomMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const message = await ChatService.sendRoomMessage({
        roomId: String(req.params.roomId),
        userId,
        content: String(req.body?.content ?? ''),
      });

      res.status(201).json({ success: true, message });
    } catch (error: any) {
      handleChatError(res, error, 'Error interno al enviar mensaje de sala');
    }
  }
}

function handleChatError(res: Response, error: any, fallbackMessage: string): void {
  const statusCode = error?.statusCode ?? 500;
  if (statusCode >= 500) {
    console.error(fallbackMessage, error);
  }

  res.status(statusCode).json({
    success: false,
    error: error?.message ?? fallbackMessage,
  });
}
