import { Router } from 'express';
import { RoomsController } from '../modules/rooms/controller/rooms.controller.js';
// Importamos el controlador de rankings (ajustá la ruta según tu carpeta 'rankings')
import * as RankingController from '../modules/rankings/controller/ranking.controller.js';

const router = Router();

// Endpoint para el RF-07 (lo que ya tenías)
router.post('/rooms/leave', RoomsController.handleLeaveRoom);

// --- NUEVO ENDPOINT PARA RF-08 ---
// Este es el que va a consumir tu RankingScreen del front
router.get('/ranking', RankingController.getRanking);


export default router;