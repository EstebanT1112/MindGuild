import { notificationRepository }
  from '../repository/notification.repository.js';

import { UsersRepository }
  from '../../users/repository/users.repository.js';

import { sendExpoPushNotification }
  from './expo-push.service.js';

import type {
  Notification,
  CreateNotificationInput,
  NotificationListOptions
} from '../types/notification.types.js';

import type { Achievement }
  from '../../achievements/types/achievement.types.js';

export const notificationService = {
  async listUserNotifications(userId: string, options: NotificationListOptions = {}): Promise<Notification[]> {
    validateUserId(userId);
    return notificationRepository.listUserNotifications(userId, options);
  },

  async getUnreadCount(userId: string): Promise<number> {
    validateUserId(userId);
    return notificationRepository.countUnread(userId);
  },

  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    validateUserId(userId);

    if (!notificationId) {
      throw new Error('La notificacion no existe');
    }

    const notification = await notificationRepository.markAsRead(userId, notificationId);
    if (!notification) {
      throw new Error('La notificacion no existe');
    }

    return notification;
  },

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    validateUserId(userId);
    const updated = await notificationRepository.markAllAsRead(userId);
    return { updated };
  },

  async deleteAllForUser(userId: string): Promise<{ deleted: number }> {
    validateUserId(userId);
    const deleted = await notificationRepository.deleteAllForUser(userId);
    return { deleted };
  },

  /**
   * RF-15 Prompt 1
   * Persistencia simple de notificaciones
   */
  async createNotification(
    data: CreateNotificationInput
  ): Promise<Notification> {

    return await notificationRepository
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

  async notifyMissionCompleted(input: {
    userId: string;
    userMissionId: string;
    title: string;
    rewardCoins: number;
  }): Promise<Notification> {
    return notificationService.createNotification({
      user_id: input.userId,
      type: 'mission_completed',
      title: 'Mision completada',
      body: input.rewardCoins > 0
        ? `Completaste "${input.title}". Tenes ${input.rewardCoins} monedas para reclamar.`
        : `Completaste "${input.title}".`,
      reference_type: 'user_mission',
      reference_id: input.userMissionId,
    });
  },

  async notifyRewardAvailable(input: {
    userId: string;
    referenceType: string;
    referenceId: string;
    title: string;
    body: string;
  }): Promise<Notification> {
    return notificationService.createNotification({
      user_id: input.userId,
      type: 'reward_available',
      title: input.title,
      body: input.body,
      reference_type: input.referenceType,
      reference_id: input.referenceId,
    });
  },

  async notifyRoomInvitation(input: {
    userId: string;
    invitationId: string;
    roomName: string;
  }): Promise<Notification> {
    return notificationService.createNotification({
      user_id: input.userId,
      type: 'room_invitation',
      title: 'Invitacion a sala',
      body: `Te invitaron a unirte a "${input.roomName}".`,
      reference_type: 'room_invitation',
      reference_id: input.invitationId,
    });
  },

  async notifyWeeklyQuizOpened(input: {
    userId: string;
    quizId: string;
    quizTitle: string;
  }): Promise<Notification> {
    return notificationService.createNotification({
      user_id: input.userId,
      type: 'weekly_quiz_opened',
      title: 'Quiz semanal disponible',
      body: `Ya podes completar "${input.quizTitle}".`,
      reference_type: 'weekly_quiz',
      reference_id: input.quizId,
    });
  },

  async notifyWeeklyQuizConfigured(input: {
    userId: string;
    quizId: string;
    quizTitle: string;
    isUpdate?: boolean;
  }): Promise<Notification> {
    return notificationService.createNotification({
      user_id: input.userId,
      type: input.isUpdate ? 'weekly_quiz_updated' : 'weekly_quiz_configured',
      title: input.isUpdate ? 'Quiz semanal actualizado' : 'Quiz semanal configurado',
      body: input.isUpdate
        ? `Se actualizo la configuracion de "${input.quizTitle}".`
        : `El owner configuro "${input.quizTitle}".`,
      reference_type: 'weekly_quiz',
      reference_id: input.quizId,
    });
  },

  async notifyRankingChanged(input: {
    userId: string;
    roomId: string;
    position: number;
    leaderName: string;
  }): Promise<Notification> {
    return notificationService.createNotification({
      user_id: input.userId,
      type: 'ranking_changed',
      title: 'Movimiento en el ranking',
      body: `Estas en el puesto #${input.position}. ${input.leaderName} lidera la sala.`,
    });
  },

  async notifyWeekClosing(input: {
    userId: string;
    roomId: string;
  }): Promise<Notification> {
    return notificationService.createNotification({
      user_id: input.userId,
      type: 'week_closing',
      title: 'La semana esta por cerrar',
      body: 'Quedan menos de 24 horas para el cierre semanal de la sala.',
    });
  },

  async notifyWeeklyValidationOpened(input: {
    userId: string;
    quizId: string;
    quizTitle: string;
  }): Promise<Notification> {
    return notificationService.createNotification({
      user_id: input.userId,
      type: 'weekly_validation_opened',
      title: 'Validacion de quiz habilitada',
      body: `Ya podes validar preguntas y respuestas de "${input.quizTitle}".`,
      reference_type: 'weekly_quiz',
      reference_id: input.quizId,
    });
  },

  async notifyWeeklyResultsReady(input: {
    userId: string;
    quizId: string;
    quizTitle: string;
  }): Promise<Notification> {
    return notificationService.createNotification({
      user_id: input.userId,
      type: 'weekly_results_ready',
      title: 'Resultados del quiz listos',
      body: `Ya estan disponibles los resultados de "${input.quizTitle}".`,
      reference_type: 'weekly_quiz',
      reference_id: input.quizId,
    });
  },

  async notifyBossAssigned(input: {
    userId: string;
    bossWeekId: string;
    roomName: string;
  }): Promise<Notification> {
    return notificationService.createNotification({
      user_id: input.userId,
      type: 'boss_assigned',
      title: 'Sos jefe semanal',
      body: `Ganaste la semana en "${input.roomName}" y quedaste como jefe.`,
      reference_type: 'boss_week',
      reference_id: input.bossWeekId,
    });
  },

  async notifyTeamNeedsPoints(input: {
    userId: string;
    roomId: string;
    teamName: string;
    leaderName: string;
  }): Promise<Notification> {
    return notificationService.createNotification({
      user_id: input.userId,
      type: 'team_needs_points',
      title: 'Tu equipo necesita puntos',
      body: `"${input.teamName}" esta por debajo de "${input.leaderName}". Sumá actividad para acercarse.`,
    });
  },
};

function validateUserId(userId: string) {
  if (!userId) {
    throw new Error('Usuario no autorizado');
  }
}

