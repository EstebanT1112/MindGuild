import { AuthRepository } from '../repository/auth.repository.js';
import {
  AuthConflictError,
  AuthNotFoundError,
  AuthUnauthorizedError,
  AuthValidationError,
  type AppSessionResult,
  type Auth0UserInfo,
  type LinkGoogleResult,
  type RegisterProfileDTO,
  type RegisteredProfile,
  type SocialLoginDTO,
  type SocialLoginResult,
} from '../types/auth.types.js';
import { createAppToken, isAppToken, verifyAppToken } from './app-token.service.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN ?? 'mindguildestebanapp.au.auth0.com';

export const AuthService = {
  async registerProfile(input: Partial<RegisterProfileDTO> = {}): Promise<RegisteredProfile> {
    // RF-01: normaliza, valida unicidad y delega la creacion transaccional del perfil.
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
    // RF-02/RF-01: resuelve la sesion desde app_token local o desde Auth0.
    if (!accessToken) {
      throw new AuthUnauthorizedError('Token requerido');
    }

    if (isAppToken(accessToken)) {
      const payload = verifyAppToken(accessToken);
      const profile = await AuthRepository.findProfileById(payload.sub);

      if (!profile) {
        throw new AuthNotFoundError('Perfil no encontrado');
      }

      return profile;
    }

    const userInfo = await validateTokenWithAuth0(accessToken);
    const profile = await resolveExistingProfileFromUserInfo(userInfo);

    if (!profile) {
      throw new AuthNotFoundError('Perfil no encontrado');
    }

    await AuthRepository.updateLastLoginAt(profile.id);

    return profile;
  },

  async createAppSessionFromAccessToken(accessToken: string): Promise<AppSessionResult> {
    if (!accessToken) {
      throw new AuthUnauthorizedError('Token requerido');
    }

    if (isAppToken(accessToken)) {
      const profile = await this.getProfileFromAccessToken(accessToken);
      return {
        auth_user_id: profile.id,
        email: profile.email,
        app_token: accessToken,
        profile,
      };
    }

    const userInfo = await validateTokenWithAuth0(accessToken);
    const profile = await resolveExistingProfileFromUserInfo(userInfo);

    if (!profile) {
      throw new AuthNotFoundError('Perfil no encontrado');
    }

    await AuthRepository.updateLastLoginAt(profile.id);

    return {
      auth_user_id: userInfo.sub,
      email: profile.email,
      app_token: createAppToken(profile),
      profile,
    };
  },

  async socialLogin(input: Partial<SocialLoginDTO> = {}): Promise<SocialLoginResult> {
    // RF-01: resuelve login social sin duplicar perfiles locales por email verificado.
    const accessToken = (input.access_token ?? '').trim();

    if (!accessToken) {
      throw new AuthValidationError('access_token es requerido');
    }

    const userInfo = await validateTokenWithAuth0(accessToken);
    const email = normalizeEmail(userInfo.email);

    if (!email) {
      throw new AuthValidationError('Auth0 no devolvio email para esta identidad');
    }

    const provider = extractProvider(userInfo.sub);
    let profile = await AuthRepository.findProfileByAuth0UserId(userInfo.sub);

    if (!profile) {
      profile = await AuthRepository.findProfileByIdentity(provider, userInfo.sub);
    }

    if (!profile) {
      profile = await AuthRepository.findProfileByEmail(email);

      if (profile && !userInfo.email_verified) {
        throw new AuthValidationError('El email de Google debe estar verificado para vincular cuentas');
      }
    }

    if (!profile) {
      const username = await generateAvailableUsername(email);
      profile = await AuthRepository.createProfile({
        auth_user_id: userInfo.sub,
        email,
        username,
      });
    }

    await AuthRepository.createAuthIdentity({
      profileId: profile.id,
      provider,
      providerUserId: userInfo.sub,
      email,
      emailVerified: Boolean(userInfo.email_verified),
    });

    await AuthRepository.updateLastLoginAt(profile.id);

    return {
      auth_user_id: userInfo.sub,
      email,
      app_token: createAppToken(profile),
      profile,
    };
  },

  async linkGoogleAccount(currentAccessToken: string, googleAccessToken: string): Promise<LinkGoogleResult> {
    // RF-01: vincula Google a la cuenta autenticada sin cambiar de perfil.
    if (!currentAccessToken) {
      throw new AuthUnauthorizedError('Token de sesion requerido');
    }

    if (!googleAccessToken) {
      throw new AuthValidationError('access_token de Google es requerido');
    }

    const currentProfile = await this.getProfileFromAccessToken(currentAccessToken);
    const profile = await AuthRepository.findProfileById(currentProfile.id);

    if (!profile) {
      throw new AuthNotFoundError('Perfil no encontrado');
    }

    const googleUserInfo = await validateTokenWithAuth0(googleAccessToken);
    const provider = extractProvider(googleUserInfo.sub);
    const googleEmail = normalizeEmail(googleUserInfo.email);

    if (provider !== 'google-oauth2') {
      throw new AuthValidationError('La identidad seleccionada no corresponde a Google');
    }

    if (!googleEmail) {
      throw new AuthValidationError('Google no devolvio email para esta identidad');
    }

    if (!googleUserInfo.email_verified) {
      throw new AuthValidationError('El email de Google debe estar verificado para vincular cuentas');
    }

    if (googleEmail !== normalizeEmail(profile.email)) {
      throw new AuthConflictError('La cuenta de Google debe usar el mismo email que tu perfil actual');
    }

    const existingIdentity = await AuthRepository.findIdentity(provider, googleUserInfo.sub);

    if (existingIdentity && existingIdentity.profile_id !== profile.id) {
      throw new AuthConflictError('Esta cuenta de Google ya esta vinculada a otro perfil');
    }

    await AuthRepository.createAuthIdentity({
      profileId: profile.id,
      provider,
      providerUserId: googleUserInfo.sub,
      email: googleEmail,
      emailVerified: true,
    });

    return {
      auth_providers: await AuthRepository.getAuthProviders(profile.id),
    };
  },
};

async function validateTokenWithAuth0(accessToken: string): Promise<Auth0UserInfo> {
  // Valida el token contra Auth0 y recupera la identidad externa del usuario.
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
    email_verified: Boolean(data.email_verified),
    name: data.name,
    nickname: data.nickname,
    picture: data.picture,
  };
}

async function resolveExistingProfileFromUserInfo(userInfo: Auth0UserInfo): Promise<RegisteredProfile | null> {
  const provider = extractProvider(userInfo.sub);
  const byAuth0Id = await AuthRepository.findProfileByAuth0UserId(userInfo.sub);

  if (byAuth0Id) {
    return byAuth0Id;
  }

  return AuthRepository.findProfileByIdentity(provider, userInfo.sub);
}

async function generateAvailableUsername(email: string): Promise<string> {
  const [localPart] = email.split('@');
  const base = sanitizeUsername(localPart || 'usuario');

  if (!(await AuthRepository.usernameExists(base))) {
    return base;
  }

  for (let suffix = 2; suffix <= 9999; suffix += 1) {
    const candidate = `${base}_${suffix}`;

    if (!(await AuthRepository.usernameExists(candidate))) {
      return candidate;
    }
  }

  throw new AuthConflictError('No se pudo generar un username disponible');
}

function sanitizeUsername(value: string): string {
  const clean = value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);

  if (clean.length >= 3) {
    return clean;
  }

  return `user_${clean || 'mg'}`;
}

function normalizeEmail(email?: string): string {
  return (email ?? '').trim().toLowerCase();
}

function extractProvider(authUserId: string): string {
  return authUserId.includes('|') ? authUserId.split('|')[0] : 'auth0';
}

function normalizeRegisterInput(input: Partial<RegisterProfileDTO>): RegisterProfileDTO {
  // Limpia datos de entrada y normaliza email antes de validar o persistir.
  return {
    auth_user_id: (input.auth_user_id ?? '').trim(),
    email: (input.email ?? '').trim().toLowerCase(),
    username: (input.username ?? '').trim(),
  };
}

function validateRegisterInput(input: RegisterProfileDTO) {
  // Aplica las reglas minimas del contrato POST /auth/register.
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
