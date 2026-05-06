import { pool } from '../../../common/config/db.js';

export const RoomsRepository = {
  // Cambia el estado a inactivo y registra la fecha de salida[cite: 4]
  async deactivateMember(userId: string, roomId: string) {
    const query = `
      UPDATE room_members 
      SET is_active = false, left_at = NOW() 
      WHERE user_id = $1 AND room_id = $2 AND is_active = true
      RETURNING id;
    `;
    const { rows } = await pool.query(query, [userId, roomId]);
    return rows[0]; // Retorna el ID si tuvo éxito, sino undefined
  },

  // Función extra que vas a necesitar para el RF-08 (Sistema de tiempo)
  async checkActiveMembership(userId: string, roomId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM room_members 
      WHERE user_id = $1 AND room_id = $2 AND is_active = true;
    `;
    const { rows } = await pool.query(query, [userId, roomId]);
    return rows.length > 0;
  }
};