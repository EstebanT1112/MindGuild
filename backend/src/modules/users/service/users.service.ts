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
    await UsersRepository.resetExpiredStreak(userId);

    const profile = await UsersRepository.findProfileById(userId);

    if (!profile) {
      throw new UserNotFoundError('Usuario no encontrado');
    }

    const [weeklyStats, village] = await Promise.all([
      UsersRepository.getWeeklyStats(userId, getWeekYear()),
      UsersRepository.getVillageState(userId),
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
    };
  },

  async updateProfile(userId: string, input: UpdateProfileDTO): Promise<FullProfile> {
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

  return data;
}

function validateUpdateInput(input: UpdateProfileDTO) {
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
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
  return `${weekNumber}-${now.getFullYear()}`;
}
