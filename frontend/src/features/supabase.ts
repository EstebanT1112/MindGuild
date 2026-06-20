import { createClient } from '@supabase/supabase-js';

// Usamos el objeto global EXPO_PUBLIC que maneja de forma nativa Expo en el celular
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Alerta: Faltan configurar las variables de entorno de Supabase en el frontend (.env)');
}

export const supabase = createClient(supabaseUrl, supabaseKey);