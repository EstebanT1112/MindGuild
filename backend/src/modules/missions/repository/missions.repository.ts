import { pool } from '../../../common/config/db.js';

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: string;
  target_value: number;
  reward_coins: number;
  active: boolean;
  sort_order: number;
}

export interface UserMission {
  id: string;
  user_id: string;
  mission_id: string;
  progress: number;
  completed: boolean;
  completed_at: Date | null;
  claimed: boolean;
  claimed_at: Date | null;
}

export const missionsRepository = {
  /**
   * 1. Consulta todas las misiones activas en el sistema.
   */
  async getActiveMissions(): Promise<Mission[]> {
    const query = `
      SELECT id, title, description, type, target_value, reward_coins, active, sort_order
      FROM missions
      WHERE active = true
      ORDER BY sort_order ASC;
    `;
    const { rows } = await pool.query(query);
    return rows as Mission[];
  },

  /**
   * 2. Asigna una lista de misiones a un usuario específico de forma segura e individual.
   * CORREGIDO: Evita fallos de conflictos masivos si la constraint única compuesta no está idéntica en PostgreSQL.
   */
  async assignMissionsToUser(userId: string, missionIds: string[]): Promise<void> {
    if (missionIds.length === 0) return;

    // Ejecutamos inserts individuales controlados para asegurar que cada fila se cree de forma independiente
    for (const missionId of missionIds) {
      try {
        const query = `
          INSERT INTO user_missions (user_id, mission_id, progress, completed)
          VALUES ($1, $2, 0, false)
          ON CONFLICT DO NOTHING;
        `;
        await pool.query(query, [userId, missionId]);
      } catch (innerError) {
        // Fallback secundario si la base de datos no tiene declarada la clave explícita de conflicto compuesto
        try {
          const checkQuery = `SELECT id FROM user_missions WHERE user_id = $1 AND mission_id = $2;`;
          const { rowCount } = await pool.query(checkQuery, [userId, missionId]);
          
          if (rowCount === 0) {
            const insertQuery = `INSERT INTO user_missions (user_id, mission_id, progress, completed) VALUES ($1, $2, 0, false);`;
            await pool.query(insertQuery, [userId, missionId]);
          }
        } catch (err) {
          console.error(`❌ No se pudo auto-asignar la misión ${missionId} al usuario ${userId}:`, err);
        }
      }
    }
  },

  /**
   * 3. Obtiene el listado de misiones del usuario con el detalle global cruzado.
   */
  async getUserMissionsWithDetails(userId: string): Promise<any[]> {
    const query = `
      SELECT 
        um.id as user_mission_id,
        um.progress,
        um.completed,
        um.claimed,
        m.id as mission_id,
        m.title,
        m.description,
        m.type,
        m.target_value,
        m.reward_coins
      FROM user_missions um
      INNER JOIN missions m ON um.mission_id = m.id
      WHERE um.user_id = $1
      ORDER BY m.sort_order ASC;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  },

  /**
   * 4. PROMPT 2: Incrementa el progreso de las misiones.
   */
  async updateMissionProgress(userId: string, missionType: string, incrementValue: number): Promise<void> {
    const query = `
      UPDATE user_missions um
      SET 
        progress = um.progress + $3,
        completed = CASE 
          WHEN (um.progress + $3) >= m.target_value THEN true 
          ELSE um.completed 
        END,
        completed_at = CASE 
          WHEN (um.progress + $3) >= m.target_value AND um.completed = false THEN NOW() 
          ELSE um.completed_at 
        END
      FROM missions m
      WHERE um.mission_id = m.id
        AND um.user_id = $1
        AND m.type = $2
        AND um.completed = false;
    `;
    
    await pool.query(query, [userId, missionType, incrementValue]);
  },

  /**
   * 5. PROMPT 3: Reset diario global de misiones.
   */
  async resetDailyMissions(): Promise<void> {
    const query = `
      UPDATE user_missions
      SET 
        progress = 0,
        completed = false,
        completed_at = NULL,
        claimed = false,
        claimed_at = NULL;
    `;
    await pool.query(query);
  }
};