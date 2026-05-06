import { AuthRepository } from '../repository/auth.repository.js';
import {
  AuthConflictError,
  AuthNotFoundError,
  AuthUnauthorizedError,
  AuthValidationError,
  type Auth0UserInfo,
  type RegisterProfileDTO,
  type RegisteredProfile,
} from '../types/auth.types.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN ?? 'mindguildestebanapp.au.auth0.com';

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

  async getProfileFromAccessToken(accessToken: string): Promise<RegisteredProfile> {
    if (!accessToken) {
      throw new AuthUnauthorizedError('Token requerido');
    }

    const userInfo = await validateTokenWithAuth0(accessToken);
    const profile = await AuthRepository.findProfileByAuth0UserId(userInfo.sub);

    if (!profile) {
      throw new AuthNotFoundError('Perfil no encontrado');
    }

    await AuthRepository.updateLastLoginAt(profile.id);

    return profile;
  },
};

async function validateTokenWithAuth0(accessToken: string): Promise<Auth0UserInfo> {
  const response = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new AuthUnauthorizedError('Token invalido');
  }

  const data = (await response.json()) as Partial<Auth0UserInfo>;

  if (!data.sub) {
    throw new AuthUnauthorizedError('Token invalido');
  }

  return {
    sub: data.sub,
    email: data.email,
  };
}

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
