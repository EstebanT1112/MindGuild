import { API_BASE_URL } from '../../../services/apiConfig';
import { authenticatedFetch } from '../../../services/authenticatedFetch';

export interface TeamMember {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  role: string;
  joined_at: string;
}

export interface Team {
  id: string;
  room_id: string;
  name: string;
  color: string | null;
  created_by: string | null;
  created_at: string;
  members: TeamMember[];
}

export interface TeamRankingEntry {
  team_id: string;
  team_name: string;
  color: string | null;
  members_count: number;
  total_minutes: number;
  quiz_score: number;
  academic_score: number;
  bosses_count: number;
  position: number;
}

export interface TeamsOverview {
  teams_enabled: boolean;
  can_manage_teams: boolean;
  teams: Team[];
  my_team: { team_id: string; team_name: string } | null;
  ranking: TeamRankingEntry[];
  rename_permission: { team_id: string; can_rename: boolean; can_rename_all: boolean } | null;
}

export async function fetchTeamsOverview(accessToken: string, roomId: string): Promise<TeamsOverview> {
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomId}/teams`, {}, accessToken);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar los equipos');
  }

  return {
    teams_enabled: Boolean(data.teams_enabled),
    can_manage_teams: Boolean(data.can_manage_teams),
    teams: Array.isArray(data.teams) ? data.teams : [],
    my_team: data.my_team ?? null,
    ranking: Array.isArray(data.ranking) ? data.ranking : [],
    rename_permission: data.rename_permission ?? null,
  };
}

export async function createTeam(accessToken: string, roomId: string, name: string, color?: string | null): Promise<Team> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/rooms/${roomId}/teams`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    },
    accessToken
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo crear el equipo');
  }

  return data.team;
}

export async function joinTeam(accessToken: string, roomId: string, teamId: string): Promise<TeamsOverview> {
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomId}/teams/${teamId}/join`, {
    method: 'POST',
  }, accessToken);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo unir al equipo');
  }

  return data;
}

export async function leaveTeam(accessToken: string, roomId: string, teamId: string): Promise<TeamsOverview> {
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomId}/teams/${teamId}/leave`, {
    method: 'POST',
  }, accessToken);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo salir del equipo');
  }

  return data;
}

export async function renameTeam(accessToken: string, roomId: string, teamId: string, name: string): Promise<TeamsOverview> {
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomId}/teams/${teamId}/name`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }, accessToken);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cambiar el nombre del equipo');
  }

  return data;
}

export async function deleteTeam(accessToken: string, roomId: string, teamId: string): Promise<TeamsOverview> {
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomId}/teams/${teamId}`, {
    method: 'DELETE',
  }, accessToken);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo eliminar el equipo');
  }

  return data;
}
