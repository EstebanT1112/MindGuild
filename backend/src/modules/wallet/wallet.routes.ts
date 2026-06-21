import { Router } from 'express';
import { walletController } from './controller/wallet.controller.js';

const router = Router();

router.get('/me', walletController.getMyWallet);

export default router;
