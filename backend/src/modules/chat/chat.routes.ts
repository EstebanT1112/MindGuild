import { Router } from 'express';
import { ChatController } from './controller/chat.controller.js';

const router = Router();

router.get('/rooms/:roomId/messages', ChatController.getRoomMessages);
router.post('/rooms/:roomId/messages', ChatController.sendRoomMessage);

export default router;
