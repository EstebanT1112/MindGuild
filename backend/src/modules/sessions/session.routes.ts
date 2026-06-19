import { Router } from 'express';
import { sessionsController } from './controller/session.controller.js';

const router = Router();

router.post('/start', sessionsController.start);
router.post('/:id/pause', sessionsController.pause);
router.post('/:id/resume', sessionsController.resume);
router.post('/:id/end', sessionsController.end);
router.post('/:id/cancel', sessionsController.cancel);

export default router;