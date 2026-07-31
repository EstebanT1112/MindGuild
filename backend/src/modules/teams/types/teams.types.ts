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

export interface MyTeam {
  team_id: string;
  team_name: string;
} 

export interface TeamsOverview {
  teams_enabled: boolean;
  can_manage_teams: boolean;
  teams: Team[];
  my_team: MyTeam | null;
  ranking: TeamRankingEntry[];
  rename_permission: TeamRenamePermission | null;
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

export interface TeamRenamePermission {
  team_id: string;
  can_rename: boolean;
  can_rename_all: boolean;
}

export class TeamsValidationError extends Error {
  statusCode = 400;
}

export class TeamsAccessError extends Error {
  statusCode = 403;
}

export class TeamsConflictError extends Error {
  statusCode = 409;
}

export class TeamsNotFoundError extends Error {
  statusCode = 404;
}
