import { Router } from 'express';
import { AuthController } from '../modules/auth/controller/auth.controller.js';
import { RoomsController } from '../modules/rooms/controller/rooms.controller.js';
import { UsersController } from '../modules/users/controller/users.controller.js';
import { rankingsController } from '../modules/rankings/controller/ranking.controller.js';
import { missionsController } from '../modules/missions/controller/missions.controller.js'; // Importación de tu controlador
import studyRoutes from '../modules/study/study.routes.js';
import sessionRoutes from '../modules/sessions/session.routes.js';

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

// --- SESSIONS ---
router.use('/sessions', sessionRoutes);

// --- RANKINGS ---
router.get('/ranking', rankingsController.getRanking);

// --- MISIONES (RF-12) ---
// Endpoint para obtener y asignar misiones diarias (Prompt 1)
router.get('/missions', missionsController.getUserMissions);
// Endpoint para actualizar el progreso de una misión (Prompt 2)
router.post('/missions/progress', missionsController.updateUserMissionProgress);

export default router;
