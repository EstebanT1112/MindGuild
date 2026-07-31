import { Router } from 'express';
import { sessionsController } from './controller/session.controller.js';
import { checkAuth } from '../../common/middleware/auth.middleware.js'; // ⚡ CORREGIDO: Usamos el nombre real de tu función

const router = Router();

// Endpoints heredados y protegidos del RF-10
router.post('/start', checkAuth, sessionsController.startSession);
router.post('/:id/pause', checkAuth, sessionsController.pauseSession);
router.post('/:id/resume', checkAuth, sessionsController.resumeSession);
router.post('/:id/end', checkAuth, sessionsController.endSession);
router.post('/:id/cancel', checkAuth, sessionsController.cancelSession);

// ⚡ Nuevas rutas transaccionales del RF-09
router.get('/me', checkAuth, sessionsController.getMySessions);
router.get('/rooms/:roomId/pending-reviews', checkAuth, sessionsController.getPendingReviewsByRoom);
router.post('/:id/review', checkAuth, sessionsController.reviewSession);
router.post('/cleanup-expired', checkAuth, sessionsController.cleanupExpiredSessions);

export default router;