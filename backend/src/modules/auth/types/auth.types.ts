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
