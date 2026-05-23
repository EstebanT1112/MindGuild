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

export interface UserRoom extends CreatedRoom {
  members_count: number;
  role: string;
}

export interface JoinedRoom extends CreatedRoom {
  membership_status: 'new' | 'reactivate';
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

export async function joinRoom(accessToken: string, inviteCode: string): Promise<JoinedRoom> {
  const response = await fetch(`${API_BASE_URL}/rooms/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ invite_code: inviteCode }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo unir a la sala');
  }

  return data;
}

export async function fetchMyRooms(accessToken: string): Promise<UserRoom[]> {
  const response = await fetch(`${API_BASE_URL}/rooms/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar las salas');
  }

  return data;
}
