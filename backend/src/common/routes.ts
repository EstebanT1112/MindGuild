import { Router } from 'express';
import { AuthController } from '../modules/auth/controller/auth.controller.js';
import { RoomsController } from '../modules/rooms/controller/rooms.controller.js';
import { UsersController } from '../modules/users/controller/users.controller.js';
import { rankingsController } from '../modules/rankings/controller/ranking.controller.js';
import { missionsController } from '../modules/missions/controller/missions.controller.js'; 
import { checkAuth } from './middleware/auth.middleware.js'; 
import studyRoutes from '../modules/study/study.routes.js';
import achievementRoutes from '../modules/achievements/achievements.routes.js';
import sessionRoutes from '../modules/sessions/session.routes.js';

import { FriendsController } from '../modules/friends/controller/friends.controller.js';

const router = Router();

// --- AUTH ---
router.post('/auth/register', AuthController.register);
router.post('/auth/social-login', AuthController.socialLogin);
router.post('/auth/link-google', AuthController.linkGoogle);
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

// --- ACHIEVEMENTS ---
router.use('/achievements', achievementRoutes);

// --- MISIONES (RF-12) PROTEGIDAS ---
router.get('/missions', checkAuth, missionsController.getUserMissions);
router.post('/missions/progress', checkAuth, missionsController.updateUserMissionProgress);

// --- SISTEMA DE AMIGOS (RF-04) PROTEGIDO ---
router.get('/friends', checkAuth, FriendsController.getFriends);
router.get('/friends/requests', checkAuth, FriendsController.getRequests);
router.post('/friends/requests', checkAuth, FriendsController.sendRequest);
router.post('/friends/requests/:requestId/accept', checkAuth, FriendsController.acceptRequest);
router.post('/friends/requests/:requestId/reject', checkAuth, FriendsController.rejectRequest);

export default router;