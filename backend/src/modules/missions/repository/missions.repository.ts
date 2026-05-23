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
   * 2. Asigna una lista de misiones a un usuario específico.
   */
  /**
   * 2. Asigna una lista de misiones a un usuario específico.
   * CORREGIDO: Removidas columnas con default del TARGET del INSERT para coincidir con las expresiones de los parámetros.
   */
  async assignMissionsToUser(userId: string, missionIds: string[]): Promise<void> {
    if (missionIds.length === 0) return;

    const values: any[] = [];
    const valueStrings: string[] = [];
    
    let paramIndex = 1;
    for (const missionId of missionIds) {
      valueStrings.push(`($${paramIndex}, $${paramIndex + 1})`);
      values.push(userId, missionId);
      paramIndex += 2;
    }

    // Al dejar solo user_id y mission_id, coincide 1:1 con el par de parámetros enviados en el loop
    const query = `
      INSERT INTO user_missions (user_id, mission_id)
      VALUES ${valueStrings.join(', ')}
      ON CONFLICT (user_id, mission_id) DO NOTHING;
    `;

    await pool.query(query, values);
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