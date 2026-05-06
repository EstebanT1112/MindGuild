import { studyRepository } from '../repository/study.repository.js';

export const studyService = {
  /**
   * Registra el impacto de una sesión aprobada en todas las estadísticas.
   * Coordina los 3 prompts del RF-09.
   */
  async registerStudyTime(sessionId: string, currentUserId: string) {
    // 1. VALIDACIÓN (Prompt 1 + Seguridad de Dueño)
    const validatedData = await this.validateSessionForImpact(sessionId, currentUserId);

    // 2. ACTUALIZACIÓN GLOBAL (Prompt 2)
    const newTotalAccumulated = await studyRepository.updateUserTotalMinutes(
      validatedData.userId,
      validatedData.durationMinutes
    );

    // 3. ACTUALIZACIÓN SEMANAL (Prompt 3)
    const { weekYear } = await studyRepository.updateWeeklyStats(
      validatedData.userId,
      validatedData.roomId,
      validatedData.durationMinutes
    );

    return {
      success: true,
      message: "Tiempo de estudio impactado correctamente en rankings y perfil",
      data: {
        userId: validatedData.userId,
        minutesAdded: validatedData.durationMinutes,
        currentWeek: weekYear,
        newTotalHistorical: newTotalAccumulated
      }
    };
  },

  /**
   * Filtra si la sesión cumple los requisitos mínimos para sumar tiempo.
   */
  async validateSessionForImpact(sessionId: string, currentUserId: string) {
    const session = await studyRepository.getSessionForValidation(sessionId);

    if (!session) throw new Error('Sesión no encontrada');

    // SEGURIDAD: Validar que el que pide el impacto es el dueño de la sesión
    if (session.user_id !== currentUserId) {
      throw new Error('No tenés permiso para acreditar esta sesión');
    }

    // REGLAS DEL REQUERIMIENTO
    if (session.status !== 'completed') throw new Error('Sesión incompleta');
    if (!session.valid) throw new Error('Sesión marcada como no válida');
    if (session.approval_status !== 'approved') throw new Error('Sesión no aprobada');
    if (session.duration_minutes < 60) throw new Error('Mínimo 60 minutos requeridos');

    return {
      userId: session.user_id,
      roomId: session.room_id,
      durationMinutes: session.duration_minutes
    };
  }
};