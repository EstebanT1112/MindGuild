import { pool } from '../../../common/config/db.js';

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: string;
  target_value: number;
  coin_reward: number;
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
   * 1. Consulta todas las misiones configuradas como activas en el sistema,
   * ordenadas secuencialmente por su prioridad de orden.
   */
  async getActiveMissions(): Promise<Mission[]> {
    const query = `
      SELECT id, title, description, type, target_value, coin_reward, active, sort_order
      FROM misiones
      WHERE active = true
      ORDER BY sort_order ASC;
    `;
    const { rows } = await pool.query(query);
    return rows as Mission[];
  },

  /**
   * 2. Asigna una lista de misiones a un usuario específico.
   * Utiliza ON CONFLICT DO NOTHING para asegurar que si el usuario ya tenía asignada
   * esa misión el día de hoy, no se duplique ni rompa la base de datos.
   */
  async assignMissionsToUser(userId: string, missionIds: string[]): Promise<void> {
    if (missionIds.length === 0) return;

    // Construimos una inserción masiva dinámica utilizando placeholders ($1, $2, etc.)
    const values: any[] = [];
    const valueStrings: string[] = [];
    
    let paramIndex = 1;
    for (const missionId of missionIds) {
      valueStrings.push(`($${paramIndex}, $${paramIndex + 1})`);
      values.push(userId, missionId);
      paramIndex += 2;
    }

    const query = `
      INSERT INTO user_misiones (user_id, mision_id, progreso, completado, claimed)
      VALUES ${valueStrings.join(', ')}
      ON CONFLICT (user_id, mision_id) DO NOTHING;
    `;

    await pool.query(query, values);
  },

  /**
   * 3. Obtiene el listado de misiones actuales del usuario con el detalle global cruzado
   * mediante un INNER JOIN para poder mostrar títulos y descripciones en el celular.
   */
  async getUserMissionsWithDetails(userId: string): Promise<any[]> {
    const query = `
      SELECT 
        um.id as user_mission_id,
        um.progreso,
        um.completado,
        um.claimed,
        m.id as mission_id,
        m.title,
        m.description,
        m.type,
        m.target_value,
        m.coin_reward
      FROM user_misiones um
      INNER JOIN misiones m ON um.mision_id = m.id
      WHERE um.user_id = $1
      ORDER BY m.sort_order ASC;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  },

  /**
   * 4. PROMPT 2: Incrementa el progreso de las misiones de un tipo específico para un usuario.
   * Modifica 'progreso', y evalúa dinámicamente si llegó al 'target_value' de la misión
   * para actualizar 'completado' y 'completed_at' de forma automática.
   */
  async updateMissionProgress(userId: string, missionType: string, incrementValue: number): Promise<void> {
    const query = `
      UPDATE user_misiones um
      SET 
        progreso = um.progreso + $3,
        completado = CASE 
          WHEN (um.progreso + $3) >= m.target_value THEN true 
          ELSE um.completado 
        END,
        completed_at = CASE 
          WHEN (um.progreso + $3) >= m.target_value AND um.completado = false THEN NOW() 
          ELSE um.completed_at 
        END
      FROM misiones m
      WHERE um.mision_id = m.id
        AND um.user_id = $1
        AND m.type = $2
        AND um.completado = false;
    `;
    
    await pool.query(query, [userId, missionType, incrementValue]);
  },

  /**
   * 5. PROMPT 3: Reset diario global de misiones.
   * Devuelve a cero absoluto el progreso, estados de completado y de premios reclamados
   * para todos los registros del sistema masivamente.
   */
  async resetDailyMissions(): Promise<void> {
    const query = `
      UPDATE user_misiones
      SET 
        progreso = 0,
        completado = false,
        completed_at = NULL,
        claimed = false,
        claimed_at = NULL;
    `;
    await pool.query(query);
  }
};