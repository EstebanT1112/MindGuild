import { Router } from 'express';
import { AuthController } from '../modules/auth/controller/auth.controller.js';
import { RoomsController } from '../modules/rooms/controller/rooms.controller.js';
import { UsersController } from '../modules/users/controller/users.controller.js';
import { rankingsController } from '../modules/rankings/controller/ranking.controller.js';
import { missionsController } from '../modules/missions/controller/missions.controller.js'; 
import { checkAuth } from './middleware/auth.middleware.js'; // ⚡ IMPORTAMOS EL MIDDLEWARE
import studyRoutes from '../modules/study/study.routes.js';

const router = Router();

// --- AUTH ---
router.post('/auth/register', AuthController.register);
router.get('/auth/me', AuthController.me);

// --- USERS ---
router.get('/users/me', UsersController.getMe);
router.patch('/users/me', UsersController.updateMe);

// --- ROOMS ---
router.get('/rooms/me', RoomsController.getMyRooms);
router.post('/rooms', RoomsController.createRoom);
router.post('/rooms/join', RoomsController.joinRoom);
router.post('/rooms/leave', RoomsController.handleLeaveRoom);
router.get('/rooms/:roomId/rankings/time', rankingsController.getRoomTimeRanking);
router.get('/rooms/:roomId', RoomsController.getRoomDetails);

// --- STUDY (Módulos externos) ---
router.use('/study', studyRoutes);

// --- RANKINGS ---
router.get('/ranking', rankingsController.getRanking);

// --- MISIONES (RF-12) PROTEGIDAS ---
// ⚡ Inyectamos 'checkAuth' antes de los controladores para que lean el ID dinámico
router.get('/missions', checkAuth, missionsController.getUserMissions);
router.post('/missions/progress', checkAuth, missionsController.updateUserMissionProgress);

export default router;