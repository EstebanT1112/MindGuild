import { Router } from 'express';
import { AuthController } from '../modules/auth/controller/auth.controller.js';
import { RoomsController } from '../modules/rooms/controller/rooms.controller.js';
import * as RankingController from '../modules/rankings/controller/ranking.controller.js';
import studyRoutes from '../modules/study/study.routes.js';

const router = Router();

router.post('/auth/register', AuthController.register);
router.post('/rooms/leave', RoomsController.handleLeaveRoom);
router.use('/study', studyRoutes);
router.get('/ranking', RankingController.getRanking);

export default router;
