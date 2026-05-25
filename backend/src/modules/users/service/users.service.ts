import { UsersRepository } from '../repository/users.repository.js';
import {
  UserConflictError,
  UserNotFoundError,
  UserValidationError,
  type FullProfile,
  type UpdateProfileDTO,
} from '../types/users.types.js';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export const UsersService = {
  async getFullProfile(userId: string): Promise<FullProfile> {
    // RF-03: compone perfil basico, estadisticas semanales y estado de aldea.
    await UsersRepository.resetExpiredStreak(userId);

    const profile = await UsersRepository.findProfileById(userId);

    if (!profile) {
      throw new UserNotFoundError('Usuario no encontrado');
    }

    const [weeklyStats, village, streakCompletedToday] = await Promise.all([
      UsersRepository.getWeeklyStats(userId, getWeekYear()),
      UsersRepository.getVillageState(userId),
      UsersRepository.hasValidSessionToday(userId),
    ]);

    return {
      ...profile,
      weekly_stats: weeklyStats ?? {
        total_minutes: 0,
        consistency_score: 0,
        academic_score: 0,
        bosses_count: 0,
      },
      village: village ?? {
        village_level: 1,
      },
      streak_completed_today: streakCompletedToday,
    };
  },

  async updateProfile(userId: string, input: UpdateProfileDTO): Promise<FullProfile> {
    // RF-03: aplica patch parcial solo sobre campos editables del perfil.
    const data = normalizeUpdateInput(input);
    validateUpdateInput(data);

    const currentProfile = await UsersRepository.findProfileById(userId);

    if (!currentProfile) {
      throw new UserNotFoundError('Usuario no encontrado');
    }

    if (data.username && data.username !== currentProfile.username) {
      const existingProfile = await UsersRepository.findProfileByUsername(data.username);

      if (existingProfile && existingProfile.id !== userId) {
        throw new UserConflictError('El username ya esta registrado');
      }
    }

    try {
      const updatedProfile = await UsersRepository.updateProfile(userId, data);

      if (!updatedProfile) {
        throw new UserNotFoundError('Usuario no encontrado');
      }

      return this.getFullProfile(userId);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new UserConflictError('El username ya esta registrado');
      }

      throw error;
    }
  },
};

function normalizeUpdateInput(input: UpdateProfileDTO): UpdateProfileDTO {
  // Distingue campos no enviados de campos enviados vacios para soportar PATCH parcial.
  const data: UpdateProfileDTO = {};

  if (Object.prototype.hasOwnProperty.call(input, 'username')) {
    data.username = input.username?.trim();
  }

  if (Object.prototype.hasOwnProperty.call(input, 'avatar_url')) {
    const value = input.avatar_url?.trim();
    data.avatar_url = value || null;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'bio')) {
    const value = input.bio?.trim();
    data.bio = value || null;
  }
  
  //lO AGREGO PARA EL REQ 15
  if (Object.prototype.hasOwnProperty.call(input, 'expo_push_token')) {
    const value = input.expo_push_token?.trim();
    data.expo_push_token = value || null;
  }

  return data;
}

function validateUpdateInput(input: UpdateProfileDTO) {
  // Valida reglas de negocio antes de tocar la tabla profiles.
  if (input.username !== undefined && !USERNAME_REGEX.test(input.username)) {
    throw new UserValidationError(
      'El username debe tener 3 a 30 caracteres y solo puede usar letras, numeros o guion bajo'
    );
  }

  if (input.bio !== undefined && input.bio !== null && input.bio.length > 160) {
    throw new UserValidationError('La bio no puede superar los 160 caracteres');
  }

  if (input.avatar_url !== undefined && input.avatar_url !== null) {
    try {
      new URL(input.avatar_url);
    } catch {
      throw new UserValidationError('El avatar_url debe ser una URL valida');
    }
  }
}

function getWeekYear(): string {
  // Calcula la semana usada para leer user_weekly_stats.
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
  return `${weekNumber}-${now.getFullYear()}`;
}
