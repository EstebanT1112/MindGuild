import { Router } from 'express';
import { studyController } from './controller/study.controller.js';

const router = Router();

// Esta es la ruta que impacta el tiempo de estudio
router.post('/register-impact', studyController.registerTime);

export default router;