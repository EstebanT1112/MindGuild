import { Router } from 'express';
import { AnalyticsController } from './controller/analytics.controller.js';

const router = Router();

router.get('/analytics/me/difficulty-heatmap', AnalyticsController.getMyDifficultyHeatmap);
router.get('/rooms/:roomId/analytics/difficulty-heatmap', AnalyticsController.getRoomDifficultyHeatmap);

export default router;
