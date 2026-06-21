import type { Request, Response } from 'express';
import { walletService } from '../service/wallet.service.js';
import {
  WalletConflictError,
  WalletNotFoundError,
  WalletValidationError,
} from '../types/wallet.types.js';

export const walletController = {
  async getMyWallet(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
      }

      const wallet = await walletService.getWallet(userId);

      return res.status(200).json({
        success: true,
        data: wallet,
      });
    } catch (error: any) {
      return handleWalletError(error, res, 'Error interno al obtener wallet');
    }
  },
};

export function handleWalletError(error: any, res: Response, fallbackMessage: string) {
  if (error instanceof WalletValidationError) {
    return res.status(400).json({ success: false, error: error.message });
  }

  if (error instanceof WalletNotFoundError) {
    return res.status(404).json({ success: false, error: error.message });
  }

  if (error instanceof WalletConflictError) {
    return res.status(409).json({ success: false, error: error.message });
  }

  console.error(fallbackMessage, {
    message: error?.message,
    code: error?.code,
    detail: error?.detail,
  });

  return res.status(500).json({ success: false, error: fallbackMessage });
}
