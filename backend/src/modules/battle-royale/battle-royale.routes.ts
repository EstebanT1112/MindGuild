import { Router } from 'express';
import { BattleRoyaleController } from './controller/battle-royale.controller.js';

const router = Router();

router.get('/rooms/:roomId/config', BattleRoyaleController.getConfig);
router.post('/rooms/:roomId/weekly-quiz', BattleRoyaleController.createWeeklyQuiz);
router.patch('/rooms/:roomId/weekly-quiz/:quizId', BattleRoyaleController.updateWeeklyQuiz);
router.get('/rooms/:roomId/questions', BattleRoyaleController.getQuestions);
router.post('/rooms/:roomId/questions', BattleRoyaleController.createQuestion);

export default router;
