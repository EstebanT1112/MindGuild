import { achievementRepository 
} from '../repository/achievement.repository.js';

import type { Achievement, UserAchievement, AchievementStatus, AchievementEventType
} from '../types/achievement.types.js';
//REQ 15
import { notificationService }
  from '../../notifications/service/notification.service.js';


export const achievementService = {
  //Evalua achievements segun el evento recibido, defino el return type como Achievement
  async evaluateAchievements(userId: string, eventType: AchievementEventType): Promise<Achievement[]> {
    //Busco logros activos
    const achievements =
      await achievementRepository.getActiveAchievementsByType(eventType);
    //Si no hay logros, corto
    if (!achievements.length) {
      return [];
    }
    //Busco logros ya desbloqueados
    const unlocked =
      await achievementRepository.getUnlockedAchievements(userId);
    //Coleccion de ids ya desbloqueados 
    const unlockedIds = new Set(
      unlocked.map(a => a.achievement_id)
    );
    //Filtro los logros ya desbloqueados
    const pendingAchievements =
      achievements.filter(
        achievement =>
          !unlockedIds.has(achievement.id)
      );
    //Obtengo progreso real segun evento
    let progress = 0;
    switch (eventType) {

      case 'session_completed':
        progress =
          await achievementRepository
            .countCompletedSessions(userId);
        break;

      case 'streak_updated':
        progress =
          await achievementRepository
            .getCurrentStreak(userId);
        break;

      case 'room_participation':
        progress =
          await achievementRepository
            .countActiveRoomMemberships(userId);
        break;

      case 'study_minutes':
        progress =
          await achievementRepository
            .getTotalStudyMinutes(userId);
        break;
    }
    const achievementsToUnlock: Achievement[] = [];
    //Evaluo el cumplimiento de que
    // progress>achievement.target_value
    for (const achievement of pendingAchievements) {

      const completed =
        progress >= achievement.target_value;

      if (completed) {
        achievementsToUnlock.push(achievement);
      }
    }
    //retorno solo los logros  cumplidos
    return achievementsToUnlock;
  },

  async unlockAchievements(
    userId: string,
    achievements: Achievement[]
  ): Promise<UserAchievement[]> {
    
    if (achievements.length === 0) {
      return [];
    }

    const achievementIds = achievements.map(a => a.id);

    // Persistir achievements desbloqueados
    const unlockedAchievements =
      await achievementRepository
        .saveUnlockedAchievements(
          userId,
          achievementIds
        );

    // RF-15 → generar notifications
    const unlockedIds = new Set(
      unlockedAchievements.map(a => a.achievement_id)
    );

    for (const achievement of achievements) {
      if (!unlockedIds.has(achievement.id)) {
        continue;
      }

      try {

        await notificationService
          .notifyAchievementUnlocked(
            userId,
            achievement
          );

        const rewardCoins = Number(achievement.reward_coins) || 0;
        if (rewardCoins > 0) {
          await notificationService.notifyRewardAvailable({
            userId,
            referenceType: 'achievement',
            referenceId: achievement.id,
            title: 'Recompensa disponible',
            body: `Tenes ${rewardCoins} monedas para reclamar por "${achievement.name}".`,
          });
        }

      } catch (error) {

        // No romper flujo principal
        console.error(
          'Error notifying achievement unlock',
          error
        );
      }
    }

    return unlockedAchievements;
  },
  //REQ 13 - Prompt 3
  //Funcion que coordina el flujo
  async handleAchievementEvent(
    userId: string,
    eventType: AchievementEventType
  ): Promise<UserAchievement[]> {

    // Evalo que logros cumplen condiciones
    const achievements =
      await this.evaluateAchievements(
        userId,
        eventType
      );

    // Si no hay logros nuevos, corta el flujo
    if (!achievements.length) {
      return [];
    }

    // Persiste logros desbloqueados
    return await this.unlockAchievements(
      userId,
      achievements
    );
  },
  //REQ 14- Obtiene todos los achievements activos (Prompt 1)
  async getAllAchievements(): Promise<Achievement[]> {

    return await achievementRepository
      .getAllActiveAchievements();
  },
  //REQ 14 - Retorna los logros desbloqueados del usuario
  async getUserUnlockedAchievements(
    userId: string
  ): Promise<UserAchievement[]> {

    return await achievementRepository
      .getUserUnlockedAchievements(userId);
  },

  //REQ 14 - Construye el estado completo de achievements del usuario
  async getUserAchievements(
    userId: string
  ): Promise<AchievementStatus[]> {
    return achievementRepository.getUserAchievements(userId);
  },

  async claimAchievementReward(userId: string, achievementId: string) {
    if (!userId) {
      throw new Error('Usuario requerido');
    }

    if (!achievementId) {
      throw new Error('achievementId es requerido');
    }

    return achievementRepository.claimAchievementReward(userId, achievementId);
  },
};
