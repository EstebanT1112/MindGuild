import { API_BASE_URL, fetchRanking } from '../../../services/apiConfig';
import { authenticatedFetch } from '../../../services/authenticatedFetch';

export type RoomMode = 'survival' | 'battle_royale';

export interface CreatedRoom {
  id: string;
  name: string;
  description?: string | null;
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
  is_favorite: boolean;
  last_activity_at: string | null;
}

export interface RoomMember {
  id: string;
  username: string;
  avatar_url: string | null;
  role: string;
  temporary_role?: string | null;
  is_boss?: boolean;
}

export interface RoomTeamSummary {
  id: string;
  name: string;
  color: string | null;
  members_count: number;
}

export interface RoomDetails extends CreatedRoom {
  members: RoomMember[];
  teams: RoomTeamSummary[];
}

export interface RoomTimeRankingEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_minutes: number;
}

export interface JoinedRoom extends CreatedRoom {
  membership_status: 'new' | 'reactivate';
}

export async function createRoom(
  accessToken: string,
  input: { name: string; mode: RoomMode; teams_enabled: boolean }
): Promise<CreatedRoom> {
  // RF-04: solicita al backend la creacion de sala privada con owner autenticado.
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  }, accessToken);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo crear la sala');
  }

  return data;
}

export async function joinRoom(accessToken: string, inviteCode: string): Promise<JoinedRoom> {
  // RF-05: solicita unirse a una sala existente mediante invite_code.
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ invite_code: inviteCode }),
  }, accessToken);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo unir a la sala');
  }

  return data;
}

export async function fetchMyRooms(accessToken: string): Promise<UserRoom[]> {
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms/me`, {}, accessToken);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar las salas');
  }

  return data;
}

export async function fetchRoomDetails(
  accessToken: string,
  roomId: string
): Promise<RoomDetails> {
  // RF-06: obtiene la sala completa validando acceso en backend.
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomId}`, {}, accessToken);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cargar la sala');
  }

  return data;
}

export async function fetchRoomAdminDetails(
  accessToken: string,
  roomId: string
): Promise<RoomDetails> {
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomId}/admin`, {}, accessToken);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cargar la administracion de sala');
  }

  return data;
}

export async function updateRoom(
  accessToken: string,
  roomId: string,
  input: { name?: string; description?: string | null }
): Promise<RoomDetails> {
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  }, accessToken);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo actualizar la sala');
  }

  return data;
}

export async function removeRoomMember(
  accessToken: string,
  roomId: string,
  memberId: string
): Promise<{ success: boolean; message: string }> {
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomId}/members/${memberId}/remove`, {
    method: 'POST',
  }, accessToken);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo expulsar al integrante');
  }

  return data;
}

export async function fetchRoomRoles(accessToken: string, roomId: string): Promise<RoomRolesResponse> {
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomId}/roles`, {}, accessToken);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar los roles de sala');
  }

  return data;
}

export async function assignTemporaryRoomRole(
  accessToken: string,
  roomId: string,
  input: { target_user_id: string; temporary_role: string }
): Promise<RoomRolesResponse> {
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomId}/roles/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  }, accessToken);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo asignar el rol');
  }

  return data;
}

export async function fetchRoomTimeRanking(
  accessToken: string,
  roomId: string
): Promise<RoomTimeRankingEntry[]> {
  const response = await fetchRanking('time', accessToken, roomId);
  const ranking = Array.isArray(response?.data?.data) ? response.data.data : [];

  return ranking.map(item => ({
    user_id: item.user_id,
    username: item.username,
    avatar_url: item.avatar_url,
    total_minutes: item.value,
  }));
}

export interface RoomRolesResponse {
  room_id: string;
  week_year: string;
  boss_user_id: string | null;
  members: RoomMember[];
}

export async function leaveRoom(
  accessToken: string,
  roomId: string
): Promise<{ success: boolean; message: string }> {
  // RF-07: solicita la baja logica del usuario dentro de una sala.
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms/leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ room_id: roomId }),
  }, accessToken);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo abandonar la sala');
  }

  return data;
}

export async function markRoomFavorite(accessToken: string, roomId: string): Promise<UserRoom> {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/favorite`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo marcar la sala como favorita');
  }

  return data;
}

export async function unmarkRoomFavorite(accessToken: string, roomId: string): Promise<UserRoom> {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/favorite`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo quitar la sala de favoritas');
  }

  return data;
}
