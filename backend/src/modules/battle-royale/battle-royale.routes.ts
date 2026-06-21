import { Router } from 'express';
import { BattleRoyaleController } from './controller/battle-royale.controller.js';

const router = Router();

router.get('/rooms/:roomId/config', BattleRoyaleController.getConfig);
router.post('/rooms/:roomId/weekly-quiz', BattleRoyaleController.createWeeklyQuiz);
router.patch('/rooms/:roomId/weekly-quiz/:quizId', BattleRoyaleController.updateWeeklyQuiz);
router.get('/rooms/:roomId/questions', BattleRoyaleController.getQuestions);
router.post('/rooms/:roomId/questions', BattleRoyaleController.createQuestion);
router.get('/rooms/:roomId/weekly-quiz/status', BattleRoyaleController.getWeeklyQuizStatus);
router.post('/rooms/:roomId/weekly-quiz/start', BattleRoyaleController.startWeeklyQuiz);
router.post('/weekly-quiz/:attemptId/answers', BattleRoyaleController.saveWeeklyQuizAnswer);
router.post('/weekly-quiz/:attemptId/complete', BattleRoyaleController.completeWeeklyQuiz);
router.get('/rooms/:roomId/weekly-quiz/validation', BattleRoyaleController.getValidationItems);
router.post('/weekly-quiz/validation/vote', BattleRoyaleController.voteValidationItem);
router.post('/rooms/:roomId/weekly-quiz/resolve', BattleRoyaleController.resolveWeeklyQuiz);
router.get('/rooms/:roomId/weekly-quiz/result', BattleRoyaleController.getWeeklyQuizResult);
router.post('/rooms/:roomId/weekly-quiz/reset', BattleRoyaleController.resetWeeklyQuiz);

export default router;
