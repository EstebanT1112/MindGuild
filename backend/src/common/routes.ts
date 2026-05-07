import { Router } from 'express';
import { AuthController } from '../modules/auth/controller/auth.controller.js';
import { RoomsController } from '../modules/rooms/controller/rooms.controller.js';
import * as RankingController from '../modules/rankings/controller/ranking.controller.js';
import studyRoutes from '../modules/study/study.routes.js';
import { UsersController } from '../modules/users/controller/users.controller.js';

const router = Router();

router.post('/auth/register', AuthController.register);
router.get('/auth/me', AuthController.me);
router.get('/users/me', UsersController.getMe);
router.patch('/users/me', UsersController.updateMe);
router.post('/rooms', RoomsController.createRoom);
router.post('/rooms/leave', RoomsController.handleLeaveRoom);
router.use('/study', studyRoutes);
router.get('/ranking', RankingController.getRanking);

export default router;
