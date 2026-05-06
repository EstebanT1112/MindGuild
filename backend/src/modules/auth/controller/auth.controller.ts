import type { Request, Response } from 'express';
import { AuthService } from '../service/auth.service.js';
import { AuthConflictError, AuthValidationError } from '../types/auth.types.js';

export const AuthController = {
  async register(req: Request, res: Response) {
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
};
