import type { Request, Response } from 'express';
import { notificationService } from '../service/notification.service.js';

export const notificationsController = {
  async getMyNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = getAuthenticatedUserId(req);
      const notifications = await notificationService.listUserNotifications(userId, {
        limit: Number(req.query.limit) || 30,
        offset: Number(req.query.offset) || 0,
        unreadOnly: req.query.unreadOnly === 'true',
      });

      res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (error: any) {
      handleNotificationError(res, error);
    }
  },

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = getAuthenticatedUserId(req);
      const count = await notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      handleNotificationError(res, error);
    }
  },

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = getAuthenticatedUserId(req);
      const notification = await notificationService.markAsRead(userId, String(req.params.notificationId ?? ''));

      res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error: any) {
      handleNotificationError(res, error);
    }
  },

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = getAuthenticatedUserId(req);
      const result = await notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      handleNotificationError(res, error);
    }
  },

  async deleteAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = getAuthenticatedUserId(req);
      const result = await notificationService.deleteAllForUser(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      handleNotificationError(res, error);
    }
  },
};

function getAuthenticatedUserId(req: Request): string {
  const userId = (req as any).user?.id;
  if (!userId) {
    throw new Error('Usuario no autorizado');
  }
  return userId;
}

function handleNotificationError(res: Response, error: any) {
  const message = error?.message ?? 'Error interno de notificaciones';
  const status = message.includes('no autorizado')
    ? 401
    : message.includes('no existe')
      ? 404
      : 500;

  if (status === 500) {
    console.error('Error interno de notificaciones', error);
  }

  res.status(status).json({
    success: false,
    message,
  });
}
