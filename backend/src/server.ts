import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; 
import router from './common/routes.js';
import { missionsService } from './modules/missions/service/missions.service.js';
import { ChatService } from './modules/chat/service/chat.service.js';

dotenv.config({ override: true });

const app = express();

app.use(cors()); 
app.use(express.json()); 

app.use('/api', router);

const PORT = process.env.PORT || 3000;

// ⚡ REPARADO: Un solo listen explícito en '0.0.0.0' para evitar colisiones de puertos
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Servidor de MindGuild corriendo en cualquier interfaz en el puerto ${PORT}`);
    setupDailyMissionsExpiration();
    setupDailyChatCleanup();
});

function setupDailyMissionsExpiration() {
    const ahora = new Date();
    const mañana = new Date(ahora);

    mañana.setDate(ahora.getDate() + 1);
    mañana.setHours(0, 0, 0, 0);

    const tiempoParaMedianoche = mañana.getTime() - ahora.getTime();
    console.log(`⏳ Programador de misiones activo. Próximo reset en: ${(tiempoParaMedianoche / 1000 / 60 / 60).toFixed(2)} horas.`);

    setTimeout(async () => {
        try {
            await missionsService.expireOldMissions();
        } catch (error) {
            console.error('❌ Falló el reset automático inicial a medianoche:', error);
        }

        setInterval(async () => {
            try {
                await missionsService.expireOldMissions();
            } catch (error) {
                console.error('❌ Falló el reset automático en el intervalo diario:', error);
            }
        }, 24 * 60 * 60 * 1000);

    }, tiempoParaMedianoche);
}

function setupDailyChatCleanup() {
    const ahora = new Date();
    const manana = new Date(ahora);

    manana.setDate(ahora.getDate() + 1);
    manana.setHours(0, 0, 0, 0);

    const tiempoParaMedianoche = manana.getTime() - ahora.getTime();
    console.log(`💬 Programador de chat activo. Proxima limpieza en: ${(tiempoParaMedianoche / 1000 / 60 / 60).toFixed(2)} horas.`);

    setTimeout(async () => {
        try {
            const deleted = await ChatService.deleteExpiredMessages();
            console.log(`🧹 Limpieza de chat ejecutada. Mensajes eliminados: ${deleted}.`);
        } catch (error) {
            console.error('❌ Fallo la limpieza automatica inicial de chat:', error);
        }

        setInterval(async () => {
            try {
                const deleted = await ChatService.deleteExpiredMessages();
                console.log(`🧹 Limpieza diaria de chat ejecutada. Mensajes eliminados: ${deleted}.`);
            } catch (error) {
                console.error('❌ Fallo la limpieza automatica diaria de chat:', error);
            }
        }, 24 * 60 * 60 * 1000);
    }, tiempoParaMedianoche);
}
