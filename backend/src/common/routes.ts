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
import battleRoyaleRoutes from '../modules/battle-royale/battle-royale.routes.js';
import walletRoutes from '../modules/wallet/wallet.routes.js';

// --- INVITACIONES A SALAS ---
import RoomInvitationsController from '../modules/room-invitations/controller/room-invitations.controller.js';
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
router.get('/rooms/:roomId/admin', RoomsController.getAdminRoomDetails);
router.get('/rooms/:roomId/roles', RoomsController.getRoomRoles);
router.post('/rooms/:roomId/roles/assign', RoomsController.assignTemporaryRole);
router.patch('/rooms/:roomId', RoomsController.updateRoom);
router.post('/rooms/:roomId/members/:memberId/remove', RoomsController.removeMember);
router.post('/rooms/:roomId/favorite', RoomsController.markFavorite);
router.delete('/rooms/:roomId/favorite', RoomsController.unmarkFavorite);
router.get('/rooms/:roomId/rankings/time', rankingsController.getRoomTimeRanking);
router.get('/rooms/:roomId', RoomsController.getRoomDetails);

// --- STUDY (Modulos externos) ---
router.use('/study', studyRoutes);

// --- SESSIONS (RF-10) ---
// Se agrega checkAuth aquí para proteger todas las operaciones de forma unificada
router.use('/sessions', checkAuth, sessionRoutes);

// --- BATTLE ROYALE (RF-02) PROTEGIDO ---
router.use('/battle-royale', checkAuth, battleRoyaleRoutes);

// --- RANKINGS ---
router.post('/ranking/recalculate-week', checkAuth, rankingsController.recalculateWeek);
router.post('/ranking/close-week', checkAuth, rankingsController.closeWeek);
router.get('/ranking', checkAuth, rankingsController.getRanking);

// --- WALLET ---
router.use('/wallet', checkAuth, walletRoutes);

// --- ACHIEVEMENTS ---
router.use('/achievements', achievementRoutes);

// --- MISIONES (RF-12) PROTEGIDAS ---
router.get('/missions', checkAuth, missionsController.getUserMissions);
router.post('/missions/progress', checkAuth, missionsController.updateUserMissionProgress);
router.post('/missions/:userMissionId/claim', checkAuth, missionsController.claimMissionReward);

// --- INVITACIONES A SALAS (RF-05) PROTEGIDAS ---
router.get('/room-invitations', checkAuth, RoomInvitationsController.getReceivedInvitations);
router.post('/room-invitations', checkAuth, RoomInvitationsController.createInvitation);
router.post('/room-invitations/:invitationId/accept', checkAuth, RoomInvitationsController.acceptInvitation);
router.post('/room-invitations/:invitationId/reject', checkAuth, RoomInvitationsController.rejectInvitation);
// --- SISTEMA DE AMIGOS (RF-04) PROTEGIDO ---
router.get('/friends', checkAuth, FriendsController.getFriends);
router.get('/friends/requests', checkAuth, FriendsController.getRequests);
router.post('/friends/requests', checkAuth, FriendsController.sendRequest);
router.post('/friends/requests/:requestId/accept', checkAuth, FriendsController.acceptRequest);
router.post('/friends/requests/:requestId/reject', checkAuth, FriendsController.rejectRequest);

export default router;
