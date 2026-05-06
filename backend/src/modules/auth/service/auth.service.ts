import { AuthRepository } from '../repository/auth.repository.js';
import {
  AuthConflictError,
  AuthValidationError,
  type RegisterProfileDTO,
  type RegisteredProfile,
} from '../types/auth.types.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export const AuthService = {
  async registerProfile(input: Partial<RegisterProfileDTO> = {}): Promise<RegisteredProfile> {
    const data = normalizeRegisterInput(input);
    validateRegisterInput(data);

    const existingProfile = await AuthRepository.findExistingProfile(data);

    if (existingProfile) {
      if (existingProfile.auth0_user_id === data.auth_user_id) {
        throw new AuthConflictError('El usuario de autenticacion ya tiene perfil');
      }

      if (existingProfile.email === data.email) {
        throw new AuthConflictError('El email ya esta registrado');
      }

      if (existingProfile.username === data.username) {
        throw new AuthConflictError('El username ya esta registrado');
      }

      throw new AuthConflictError('El perfil ya existe');
    }

    try {
      return await AuthRepository.createProfile(data);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new AuthConflictError('El email, username o auth_user_id ya existe');
      }

      throw error;
    }
  },
};

function normalizeRegisterInput(input: Partial<RegisterProfileDTO>): RegisterProfileDTO {
  return {
    auth_user_id: (input.auth_user_id ?? '').trim(),
    email: (input.email ?? '').trim().toLowerCase(),
    username: (input.username ?? '').trim(),
  };
}

function validateRegisterInput(input: RegisterProfileDTO) {
  if (!input.auth_user_id || !input.email || !input.username) {
    throw new AuthValidationError('auth_user_id, email y username son requeridos');
  }

  if (!EMAIL_REGEX.test(input.email)) {
    throw new AuthValidationError('El email no tiene un formato valido');
  }

  if (!USERNAME_REGEX.test(input.username)) {
    throw new AuthValidationError(
      'El username debe tener 3 a 30 caracteres y solo puede usar letras, numeros o guion bajo'
    );
  }
}
