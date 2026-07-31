import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../modules/auth/service/auth.service.js';
import { AuthUnauthorizedError } from '../../modules/auth/types/auth.types.js';

/**
 * Middleware para extraer el ID real del usuario resolviendo su AccessToken.
 */
export async function checkAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'No autorizado. Se requiere un token Bearer en las cabeceras.',
    });
    return;
  }

  const token = authHeader.split(' ')[1].trim();

  try {
    const profile = await AuthService.getProfileFromAccessToken(token);
    const extendedReq = req as any;
    extendedReq.user = { id: profile.id };

    next();
  } catch (error: any) {
    if (!(error instanceof AuthUnauthorizedError)) {
      console.error('Error resolviendo el token de usuario:', error.message);
    }

    res.status(401).json({
      success: false,
      message: 'Sesion invalida o expirada.',
      error: error.message,
    });
  }
}
