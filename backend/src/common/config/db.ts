import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ override: true });

export const pool = new Pool({
  // En lugar de usar connectionString, desarmamos los datos para ir a lo seguro:
  user: 'postgres.plqszirpxyeecygatoeq',
  host: 'aws-1-us-west-2.pooler.supabase.com',
  database: 'postgres',
  password: '@Casarodry1', // Tu contraseña directa libre de errores de parseo
  port: 6543,
  ssl: false // Mantenemos el fix anterior sin SSL
});

// Test de conexión rápido
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error conectando a Supabase:', err.stack);
  } else {
    console.log('✅ MindGuild conectado a Supabase con éxito');
  }
});