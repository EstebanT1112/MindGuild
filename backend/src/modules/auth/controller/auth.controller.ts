import type { Request, Response } from 'express';
import { AuthService } from '../service/auth.service.js';
import {
  AuthConflictError,
  AuthNotFoundError,
  AuthUnauthorizedError,
  AuthValidationError,
} from '../types/auth.types.js';

export const AuthController = {
  async register(req: Request, res: Response) {
    // RF-01: recibe el perfil ya autenticado por Auth0 y lo crea en la base local.
    try {
      const profile = await AuthService.registerProfile(req.body);
      return res.status(201).json(profile);
    } catch (error: any) {
      if (error instanceof AuthValidationError) {
        return res.status(400).json({ error: error.message });
      }

      if (error instanceof AuthConflictError) {
        return res.status(409).json({ error: error.message });
      }

      console.error('Error interno al registrar usuario:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        constraint: error?.constraint,
        table: error?.table,
        column: error?.column,
      });

      return res.status(500).json({
        error: 'Error interno al registrar usuario',
        detail: process.env.NODE_ENV === 'production' ? undefined : error?.message,
        code: process.env.NODE_ENV === 'production' ? undefined : error?.code,
      });
    }
  },

  async me(req: Request, res: Response) {
    // RF-02: valida el Bearer token y devuelve el perfil asociado a la sesion.
    try {
      const accessToken = extractBearerToken(req);
      const profile = await AuthService.getProfileFromAccessToken(accessToken);
      return res.status(200).json(profile);
    } catch (error: any) {
      if (error instanceof AuthUnauthorizedError) {
        return res.status(401).json({ error: error.message });
      }

      if (error instanceof AuthNotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      console.error('Error interno al obtener perfil:', {
        message: error?.message,
        code: error?.code,
      });

      return res.status(500).json({ error: 'Error interno al obtener perfil' });
    }
  },

  async socialLogin(req: Request, res: Response) {
    // RF-01: resuelve login social y vincula Google al perfil local cuando corresponde.
    try {
      const result = await AuthService.socialLogin(req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof AuthValidationError) {
        return res.status(400).json({ error: error.message });
      }

      if (error instanceof AuthUnauthorizedError) {
        return res.status(401).json({ error: error.message });
      }

      if (error instanceof AuthConflictError) {
        return res.status(409).json({ error: error.message });
      }

      console.error('Error interno en social login:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        constraint: error?.constraint,
      });

      return res.status(500).json({
        error: 'Error interno al iniciar sesion con proveedor social',
        detail: process.env.NODE_ENV === 'production' ? undefined : error?.message,
        code: process.env.NODE_ENV === 'production' ? undefined : error?.code,
      });
    }
  },

  async linkGoogle(req: Request, res: Response) {
    // RF-01: vincula una identidad Google al perfil actualmente autenticado.
    try {
      const currentAccessToken = extractBearerToken(req);
      const googleAccessToken = String(req.body?.access_token ?? '').trim();
      const result = await AuthService.linkGoogleAccount(currentAccessToken, googleAccessToken);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof AuthValidationError) {
        return res.status(400).json({ error: error.message });
      }

      if (error instanceof AuthUnauthorizedError) {
        return res.status(401).json({ error: error.message });
      }

      if (error instanceof AuthConflictError) {
        return res.status(409).json({ error: error.message });
      }

      if (error instanceof AuthNotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      console.error('Error interno al vincular Google:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        constraint: error?.constraint,
      });

      return res.status(500).json({
        error: 'Error interno al vincular Google',
        detail: process.env.NODE_ENV === 'production' ? undefined : error?.message,
        code: process.env.NODE_ENV === 'production' ? undefined : error?.code,
      });
    }
  },
};

function extractBearerToken(req: Request): string {
  // Extrae el token Bearer para endpoints que necesitan identificar al usuario.
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    throw new AuthUnauthorizedError('Authorization Bearer token requerido');
  }

  return authorization.replace('Bearer ', '').trim();
}
