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
