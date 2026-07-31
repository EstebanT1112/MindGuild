import { Router } from 'express';
import { walletController } from './controller/wallet.controller.js';

const router = Router();

router.get('/me', walletController.getMyWallet);
router.post('/items/:itemId/purchase', walletController.purchaseStoreItem);
router.post('/items/:itemId/equip', walletController.equipStoreItem);

export default router;
