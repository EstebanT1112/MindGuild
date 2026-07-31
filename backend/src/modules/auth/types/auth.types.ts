export interface RegisterProfileDTO {
  auth_user_id: string;
  email: string;
  username: string;
}

export interface RegisteredProfile {
  id: string;
  email: string;
  username: string;
}

export interface Auth0UserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  nickname?: string;
  picture?: string;
}

export interface SocialLoginDTO {
  access_token: string;
}

export interface AuthIdentity {
  id: string;
  profile_id: string;
  provider: string;
  provider_user_id: string;
  email: string | null;
  email_verified: boolean;
}

export interface SocialLoginResult {
  auth_user_id: string;
  email: string;
  app_token: string;
  profile: RegisteredProfile;
}

export interface AppSessionResult {
  auth_user_id: string;
  email: string;
  app_token: string;
  profile: RegisteredProfile;
}

export interface LinkGoogleResult {
  auth_providers: string[];
}

export class AuthConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthConflictError';
  }
}

export class AuthValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthValidationError';
  }
}

export class AuthUnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthUnauthorizedError';
  }
}

export class AuthNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthNotFoundError';
  }
}
