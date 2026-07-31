import { Router } from 'express';
import { achievementController } from './controller/achievement.controller.js';

const router = Router();
//Estado del usuario GET/achievements/me
router.get('/me', achievementController.getUserAchievements);
router.post('/:achievementId/claim', achievementController.claimAchievementReward);
//Todos los achievements GET /achievements
router.get('/', achievementController.getAllAchievements);

export default router;
