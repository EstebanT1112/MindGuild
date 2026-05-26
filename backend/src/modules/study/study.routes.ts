import { Router } from 'express';
import { studyController } from './controller/study.controller.js';

const router = Router();

// Ruta para obtener el historial y resumen del perfil
router.get('/history', studyController.getHistory);

export default router;
