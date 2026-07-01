import { Router } from 'express';
import { VaultController } from './controller/vault.controller.js';

const router = Router();

router.get('/rooms/:roomId/materials', VaultController.listMaterials);
router.post('/rooms/:roomId/materials', VaultController.createMaterial);
router.get('/rooms/:roomId/materials/:materialId/download', VaultController.downloadMaterial);
router.delete('/rooms/:roomId/materials/:materialId', VaultController.deleteMaterial);

export default router;
