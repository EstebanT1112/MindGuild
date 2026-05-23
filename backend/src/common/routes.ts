import { Router } from 'express';
import { AuthController } from '../modules/auth/controller/auth.controller.js';
import { RoomsController } from '../modules/rooms/controller/rooms.controller.js';
import { UsersController } from '../modules/users/controller/users.controller.js';
import { rankingsController } from '../modules/rankings/controller/ranking.controller.js';
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
router.get('/rooms/:roomId', RoomsController.getRoomDetails);

// --- STUDY (Módulos externos) ---
router.use('/study', studyRoutes);

// --- RANKINGS ---
// Usamos el objeto rankingsController que definimos en el otro archivo
router.get('/ranking', rankingsController.getRanking);

export default router;
