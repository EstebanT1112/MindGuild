import { Pool } from 'pg';
import 'dotenv/config';

// El pool de conexiones permite manejar múltiples peticiones a la vez
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requerido para conexiones seguras con Supabase
  }
});

// Test de conexión rápido
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error conectando a Supabase:', err.stack);
  } else {
    console.log('✅ MindGuild conectado a Supabase con éxito');
  }
});