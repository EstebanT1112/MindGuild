import { Router } from 'express';
import { TeamsController } from './controller/teams.controller.js';

const router = Router();

router.get('/rooms/:roomId/teams', TeamsController.getTeams);
router.post('/rooms/:roomId/teams', TeamsController.createTeam);
router.get('/rooms/:roomId/teams/ranking', TeamsController.getRanking);
router.post('/rooms/:roomId/teams/:teamId/join', TeamsController.joinTeam);
router.post('/rooms/:roomId/teams/:teamId/leave', TeamsController.leaveTeam);
router.patch('/rooms/:roomId/teams/:teamId/name', TeamsController.renameTeam);
router.delete('/rooms/:roomId/teams/:teamId', TeamsController.deleteTeam);

export default router;
