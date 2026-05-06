import type { Request, Response } from 'express';
import { AuthService } from '../../auth/service/auth.service.js';
import { AuthUnauthorizedError } from '../../auth/types/auth.types.js';
import { UsersService } from '../service/users.service.js';
import { UserConflictError, UserNotFoundError, UserValidationError } from '../types/users.types.js';

export const UsersController = {
  async getMe(req: Request, res: Response) {
    try {
      const userId = await getAuthenticatedProfileId(req);
      const profile = await UsersService.getFullProfile(userId);
      return res.status(200).json(profile);
    } catch (error: any) {
      return handleUserError(res, error);
    }
  },

  async updateMe(req: Request, res: Response) {
    try {
      const userId = await getAuthenticatedProfileId(req);
      const profile = await UsersService.updateProfile(userId, req.body);
      return res.status(200).json(profile);
    } catch (error: any) {
      return handleUserError(res, error);
    }
  },
};

async function getAuthenticatedProfileId(req: Request): Promise<string> {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    throw new AuthUnauthorizedError('Authorization Bearer token requerido');
  }

  const profile = await AuthService.getProfileFromAccessToken(
    authorization.replace('Bearer ', '').trim()
  );

  return profile.id;
}

function handleUserError(res: Response, error: any) {
  if (error instanceof AuthUnauthorizedError) {
    return res.status(401).json({ error: error.message });
  }

  if (error instanceof UserValidationError) {
    return res.status(400).json({ error: error.message });
  }

  if (error instanceof UserConflictError) {
    return res.status(409).json({ error: error.message });
  }

  if (error instanceof UserNotFoundError) {
    return res.status(404).json({ error: error.message });
  }

  console.error('Error interno en users:', {
    message: error?.message,
    code: error?.code,
    detail: error?.detail,
  });

  return res.status(500).json({ error: 'Error interno de perfil' });
}
