import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL no esta configurada');
}

export const pool = new Pool({
  connectionString: databaseUrl,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error conectando a Supabase:', err.stack);
  } else {
    console.log('MindGuild conectado a Supabase');
  }
});
