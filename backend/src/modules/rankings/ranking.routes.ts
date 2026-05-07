import { Router } from 'express';
import { rankingsController } from './controller/ranking.controller.js';

const router = Router();

// Definimos que el GET a la raíz de este módulo llama a getRanking
router.get('/', rankingsController.getRanking);

export default router;