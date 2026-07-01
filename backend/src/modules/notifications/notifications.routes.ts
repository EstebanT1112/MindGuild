import { Router } from 'express';
import { notificationsController } from './controller/notification.controller.js';

const router = Router();

router.get('/notifications/me', notificationsController.getMyNotifications);
router.get('/notifications/me/unread-count', notificationsController.getUnreadCount);
router.patch('/notifications/me/read-all', notificationsController.markAllAsRead);
router.delete('/notifications/me', notificationsController.deleteAll);
router.patch('/notifications/:notificationId/read', notificationsController.markAsRead);

export default router;
