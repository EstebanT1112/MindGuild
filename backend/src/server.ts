import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // En orden
import router from './common/routes.js';
import { missionsService } from './modules/missions/service/missions.service.js';

dotenv.config({ override: true });

const app = express();

// 💡 LOS MIDDLEWARES VAN PRIMERO COLECTIVAMENTE
app.use(cors()); // 👈 ¡FALTABA ESTA LÍNEA! Habilita que el celu o emulador hable con el backend
app.use(express.json()); // Clave para que entienda los JSON que mandás

// 💡 LAS RUTAS VAN DESPUÉS DE LOS MIDDLEWARES
app.use('/api', router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor de MindGuild corriendo en http://localhost:${PORT}`);
});
// Escuchamos explícitamente en '0.0.0.0' para que no se quede cerrado solo en localhost
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Servidor de MindGuild corriendo en cualquier interfaz en el puerto ${PORT}`);

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

    // 🔥 CONFIGURACIÓN REAL DE PRODUCCIÓN: Descomentamos esta línea y sacamos los 10000
    const tiempoParaMedianoche = mañana.getTime() - ahora.getTime();

    console.log(`⏳ Programador de misiones activo. Próximo reset en: ${(tiempoParaMedianoche / 1000 / 60 / 60).toFixed(2)} horas.`);

    // 1. Agendamos el primer disparo para la medianoche real
    setTimeout(async () => {
        try {
            await missionsService.resetAllUserMissions();
        } catch (error) {
            console.error('❌ Falló el reset automático inicial a medianoche:', error);
        }

        // 2. Intervalo de 24 horas exactas
        setInterval(async () => {
            try {
                await missionsService.resetAllUserMissions();
            } catch (error) {
                console.error('❌ Falló el reset automático en el intervalo diario:', error);
            }
        }, 24 * 60 * 60 * 1000);

    }, tiempoParaMedianoche);
}
