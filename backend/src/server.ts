import express from 'express';
import dotenv from 'dotenv';
import router from './common/routes.js';
import { missionsService } from './modules/missions/service/missions.service.js'; // Importamos el servicio de misiones

dotenv.config({ override: true });

const app = express();
app.use(express.json()); // Clave para que entienda los JSON que mandás

// Usamos las rutas que definimos para tus requerimientos
app.use('/api', router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor de MindGuild corriendo en http://localhost:${PORT}`);
    
    // 🔄 AUTOMATIZACIÓN: Configuración del Reset Diario Global de Misiones (Prompt 3)
    setupDailyMissionsReset();
});

/**
 * Calcula el tiempo restante hasta la próxima medianoche y agenda
 * el vaciado masivo de progreso de misiones diariamente.
 */
function setupDailyMissionsReset() {
    const ahora = new Date();
    const mañana = new Date(ahora);
    
    // Seteamos el objetivo exactamente a las 00:00:00 del día de mañana
    mañana.setDate(ahora.getDate() + 1);
    mañana.setHours(0, 0, 0, 0);
    
    const tiempoParaMedianoche = mañana.getTime() - ahora.getTime();
    
    console.log(`⏳ Programador de misiones activo. Próximo reset en: ${(tiempoParaMedianoche / 1000 / 60 / 60).toFixed(2)} horas.`);

    // 1. Agendamos el primer disparo para la medianoche actual
    setTimeout(async () => {
        try {
            await missionsService.resetAllUserMissions();
        } catch (error) {
            // El catch evita que un fallo en la BD tire abajo todo el servidor de MindGuild
            console.error('❌ Falló el reset automático inicial a medianoche:', error);
        }

        // 2. Una vez alcanzada la primera medianoche, dejamos fijo el intervalo de 24 horas exactas
        setInterval(async () => {
            try {
                await missionsService.resetAllUserMissions();
            } catch (error) {
                console.error('❌ Falló el reset automático en el intervalo diario:', error);
            }
        }, 24 * 60 * 60 * 1000); // 86.400.000 milisegundos = 24 horas

    }, tiempoParaMedianoche);
}