import { supabase } from '../../../common/config/supabase.js';

// Helper interno para el formato de semana (Prompt 3)
const getWeekYear = (): string => {
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
  return `${weekNumber}-${now.getFullYear()}`;
};

export const studyRepository = {
  // PROMPT 1: Buscar sesión para validar (Limpio de is_impacted)
  async getSessionForValidation(sessionId: string) {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('user_id, room_id, duration_minutes, status, valid, approval_status')
      .eq('id', sessionId)
      .single();

    if (error) return null;
    return data;
  },

  // PROMPT 2: Actualizar total histórico en el perfil
  async updateUserTotalMinutes(userId: string, durationMinutes: number) {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('total_study_minutes')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) throw new Error('Usuario inexistente');

    const newTotal = profile.total_study_minutes + durationMinutes;

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ total_study_minutes: newTotal })
      .eq('id', userId)
      .select('total_study_minutes')
      .single();

    if (updateError) throw new Error('Error al actualizar total_study_minutes');
    return updatedProfile.total_study_minutes;
  },

  // PROMPT 3: Actualizar estadísticas semanales (Global y Sala)
  async updateWeeklyStats(userId: string, roomId: string | null, durationMinutes: number) {
    const weekYear = getWeekYear();

    // Actualización Global Semanal (UPSERT vía RPC)
    const { error: weeklyError } = await supabase.rpc('increment_user_weekly_stats', {
      p_user_id: userId,
      p_week_year: weekYear,
      p_minutes: durationMinutes
    });

    if (weeklyError) throw new Error('Error en user_weekly_stats');

    // Actualización por Sala (si aplica)
    if (roomId) {
      const { error: roomWeeklyError } = await supabase.rpc('increment_room_user_weekly_stats', {
        p_user_id: userId,
        p_room_id: roomId,
        p_week_year: weekYear,
        p_minutes: durationMinutes
      });

      if (roomWeeklyError) throw new Error('Error en room_user_weekly_stats');
    }

    return { weekYear };
  }
};