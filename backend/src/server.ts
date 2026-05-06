import express from 'express';
import 'dotenv/config';
import router from './common/routes.js';

const app = express();
app.use(express.json()); // Clave para que entienda los JSON que mandás

// Usamos las rutas que definimos para tus requerimientos
app.use('/api', router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor de MindGuild corriendo en http://localhost:${PORT}`);
});
