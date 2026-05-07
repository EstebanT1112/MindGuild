import { pool } from '../../../common/config/db.js';

export const rankingsRepository = {
  // RF-11: Validar si el usuario es miembro activo de la sala
  async getMemberStatus(roomId: string, userId: string) {
    const { rows } = await pool.query(
      `SELECT is_active FROM room_members WHERE room_id = $1 AND user_id = $2 LIMIT 1`,
      [roomId, userId]
    );
    return rows[0] || null;
  },

  // Tu lógica anterior adaptada a SQL puro y Postgres Pool
  async getRankingData(type: string, weekYear: string, roomId?: string) {
    // 1. Caso de RACHA (Viene de la tabla profiles)
    if (type === 'racha') {
      const { rows } = await pool.query(
        `SELECT id, username, avatar_url, streak_days 
         FROM profiles 
         ORDER BY streak_days DESC 
         LIMIT 50`
      );
      return rows;
    }

    // 2. Casos Semanal, Académico o Jefes (Vienen de estadísticas semanales)
    // Mapeamos el tipo a la columna correspondiente
    const columnMap: Record<string, string> = {
      semanal: 'total_minutes',
      academico: 'academic_score',
      jefes: 'bosses_count'
    };

    const column = columnMap[type] || 'total_minutes';

    // Si pasamos roomId, filtramos por sala (Ranking de Sala)
    // Si no, es un ranking Global
    const query = `
      SELECT 
        ru.total_minutes,
        ru.academic_score,
        ru.bosses_count,
        p.id, 
        p.username, 
        p.avatar_url
      FROM ${roomId ? 'room_user_weekly_stats ru' : 'user_weekly_stats ru'}
      INNER JOIN profiles p ON ru.user_id = p.id
      WHERE ru.week_year = $1 
      ${roomId ? 'AND ru.room_id = $2' : ''}
      ORDER BY ru.${column} DESC
      LIMIT 50;
    `;

    const params = roomId ? [weekYear, roomId] : [weekYear];
    const { rows } = await pool.query(query, params);
    return rows;
  }
};