import { notificationRepository }
  from '../repository/notification.repository.js';

import { UsersRepository }
  from '../../users/repository/users.repository.js';

import { sendExpoPushNotification }
  from './expo-push.service.js';

import type {
  Notification,
  CreateNotificationInput
} from '../types/notification.types.js';

import type { Achievement }
  from '../../achievements/types/achievement.types.js';

export const notificationService = {

  /**
   * RF-15 Prompt 1
   * Persistencia simple de notificaciones
   */
  async createNotification(
    data: CreateNotificationInput
  ): Promise<Notification> {

    return await notificationService
      .createNotification(data);
  },

  /**
   * RF-15 Prompt 2
   * Envío de push notification desacoplado
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string
  ): Promise<void> {

    try {

      // Buscar token push del usuario
      const expoPushToken =
        await UsersRepository
          .getExpoPushToken(userId);

      // Usuario sin token registrado
      if (!expoPushToken) {
        return;
      }

      // Enviar push notification
      await sendExpoPushNotification(
        expoPushToken,
        title,
        body
      );

    } catch (error) {

      // No romper el flujo principal
      console.error(
        'Error sending push notification',
        error
      );
    }
  },

  /**
   * RF-15 Prompt 3
   * Integración automática con achievements
   */
  async notifyAchievementUnlocked(
    userId: string,
    achievement: Achievement
  ): Promise<Notification> {

    // 1. Persistir notificación
    const notification =
      await notificationService.createNotification({
        user_id: userId,

        type: 'achievement_unlocked',

        title: 'Logro desbloqueado',

        body: `Obtuviste: ${achievement.name}`,

        reference_type: 'achievement',

        reference_id: achievement.id,
      });

    // 2. Intentar enviar push
    await notificationService.sendPushNotification(
      userId,
      'Logro desbloqueado',
      `Obtuviste: ${achievement.name}`
    );

    return notification;
  },
};

