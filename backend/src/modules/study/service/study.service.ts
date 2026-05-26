import { studyRepository } from '../repository/study.repository.js';

export const studyService = {
  async getStudyHistory(userId: string) {
    const sessions = await studyRepository.getUserSessions(userId, 20);
    const totalAccumulated = await studyRepository.getUserTotalMinutes(userId);

    return {
      summary: {
        total_study_minutes: totalAccumulated,
        session_count: sessions.length,
      },
      history: sessions.map(s => ({
        id: s.id,
        duration: s.duration_minutes,
        date: s.started_at,
        status: s.status,
        approval: s.approval_status,
        room: s.room_name || 'Sesion individual',
        mode: s.mode,
      })),
    };
  },
};
