import { API_BASE_URL } from '../../../services/apiConfig';

export type RoomMode = 'survival' | 'battle_royale';

export interface CreatedRoom {
  id: string;
  name: string;
  mode: RoomMode;
  invite_code: string;
  owner_id: string;
  max_members: number;
  is_active: boolean;
  teams_enabled: boolean;
}

export async function createRoom(
  accessToken: string,
  input: { name: string; mode: RoomMode; teams_enabled: boolean }
): Promise<CreatedRoom> {
  const response = await fetch(`${API_BASE_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo crear la sala');
  }

  return data;
}
