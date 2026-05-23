import { pool } from '../../../common/config/db.js';

export const rankingsRepository = {
  async roomExists(roomId: string): Promise<boolean> {
    const { rows } = await pool.query(
      `SELECT 1 FROM rooms WHERE id = $1 LIMIT 1;`,
      [roomId]
    );

    return rows.length > 0;
  },

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
  },

  async getRoomTimeRanking(roomId: string) {
    const { rows } = await pool.query(
      `
        SELECT
          p.id AS user_id,
          p.username,
          p.avatar_url,
          COALESCE(SUM(rws.total_minutes), 0)::int AS total_minutes
        FROM room_members rm
        JOIN profiles p ON p.id = rm.user_id
        LEFT JOIN room_user_weekly_stats rws
          ON rws.user_id = rm.user_id
          AND rws.room_id = rm.room_id
        WHERE rm.room_id = $1
          AND rm.is_active = true
        GROUP BY p.id, p.username, p.avatar_url
        ORDER BY total_minutes DESC;
      `,
      [roomId]
    );

    return rows;
  }
};
