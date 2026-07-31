import { TeamsRepository, type TeamRoomAccess } from '../repository/teams.repository.js';
import {
  TeamsAccessError,
  TeamsConflictError,
  TeamsNotFoundError,
  TeamsValidationError,
  type Team,
  type TeamRankingEntry,
  type TeamsOverview,
} from '../types/teams.types.js';

export class TeamsService {
  static async getTeamsOverview(userId: string, roomId: string): Promise<TeamsOverview> {
    const room = await ensureTeamsRoomAccess(roomId, userId);
    return buildOverview(roomId, userId, room);
  }

  static async createTeam(userId: string, roomId: string, input: { name?: string; color?: string | null }): Promise<Team> {
    const room = await ensureTeamsRoomAccess(roomId, userId);
    ensureRoomOwner(room);
    const name = normalizeTeamName(input.name);
    const color = normalizeTeamColor(input.color);
    const teams = await TeamsRepository.listTeams(roomId);

    if (teams.some(team => normalizeComparable(team.name) === normalizeComparable(name))) {
      throw new TeamsConflictError('Ya existe un equipo con ese nombre en esta sala');
    }

    return TeamsRepository.createTeam(roomId, userId, name, color);
  }

  static async joinTeam(userId: string, roomId: string, teamId: string): Promise<TeamsOverview> {
    const room = await ensureTeamsRoomAccess(roomId, userId);
    validateUuid(teamId, 'Equipo invalido');

    const team = await TeamsRepository.findTeam(roomId, teamId);
    if (!team) {
      throw new TeamsNotFoundError('El equipo no existe o no esta activo');
    }

    const currentTeam = await TeamsRepository.findActiveTeamByUser(roomId, userId);
    if (currentTeam && currentTeam.team_id !== teamId) {
      throw new TeamsConflictError('Ya perteneces a un equipo en esta sala');
    }

    if (!currentTeam) {
      await TeamsRepository.joinTeam(roomId, teamId, userId);
    }

    return buildOverview(roomId, userId, room);
  }

  static async leaveTeam(userId: string, roomId: string, teamId: string): Promise<TeamsOverview> {
    const room = await ensureTeamsRoomAccess(roomId, userId);
    validateUuid(teamId, 'Equipo invalido');

    const removed = await TeamsRepository.leaveTeam(roomId, teamId, userId);
    if (!removed) {
      throw new TeamsNotFoundError('No perteneces activamente a este equipo');
    }

    return buildOverview(roomId, userId, room);
  }

  static async renameWinningTeam(userId: string, roomId: string, teamId: string, input: { name?: string }): Promise<TeamsOverview> {
    const room = await ensureTeamsRoomAccess(roomId, userId);
    validateUuid(teamId, 'Equipo invalido');

    const name = normalizeTeamName(input.name);
    const team = await TeamsRepository.findTeam(roomId, teamId);
    if (!team) {
      throw new TeamsNotFoundError('El equipo no existe o no esta activo');
    }

    const winningLeader = await TeamsRepository.findWinningTeamLeader({
      roomId,
      weekYear: getCurrentWeekYear(),
      mode: room.mode,
    });

    if (!winningLeader || winningLeader.user_id !== userId) {
      throw new TeamsAccessError('Solo el mejor integrante del equipo ganador puede cambiar nombres de equipos');
    }

    const teams = await TeamsRepository.listTeams(roomId);
    if (teams.some(existingTeam =>
      existingTeam.id !== teamId &&
      normalizeComparable(existingTeam.name) === normalizeComparable(name)
    )) {
      throw new TeamsConflictError('Ya existe un equipo con ese nombre en esta sala');
    }

    const updatedTeam = await TeamsRepository.updateTeamName(roomId, teamId, name);
    if (!updatedTeam) {
      throw new TeamsNotFoundError('El equipo no existe o no esta activo');
    }

    return buildOverview(roomId, userId, room);
  }

  static async deleteTeam(userId: string, roomId: string, teamId: string): Promise<TeamsOverview> {
    const room = await ensureTeamsRoomAccess(roomId, userId);
    ensureRoomOwner(room);
    validateUuid(teamId, 'Equipo invalido');

    const removed = await TeamsRepository.deactivateTeam(roomId, teamId);
    if (!removed) {
      throw new TeamsNotFoundError('El equipo no existe o ya esta eliminado');
    }

    return buildOverview(roomId, userId, room);
  }

  static async getTeamRanking(userId: string, roomId: string): Promise<TeamRankingEntry[]> {
    const room = await ensureTeamsRoomAccess(roomId, userId);
    return TeamsRepository.getTeamRanking({
      roomId,
      weekYear: getCurrentWeekYear(),
      mode: room.mode,
    });
  }
}

async function buildOverview(
  roomId: string,
  userId: string,
  room: TeamRoomAccess
): Promise<TeamsOverview> {
  const weekYear = getCurrentWeekYear();
  const [teams, myTeam, ranking, winningLeader] = await Promise.all([
    TeamsRepository.listTeams(roomId),
    TeamsRepository.findActiveTeamByUser(roomId, userId),
    TeamsRepository.getTeamRanking({
      roomId,
      weekYear,
      mode: room.mode,
    }),
    TeamsRepository.findWinningTeamLeader({ roomId, weekYear, mode: room.mode }),
  ]);

  return {
    teams_enabled: true,
    can_manage_teams: room.is_owner,
    teams,
    my_team: myTeam,
    ranking,
    rename_permission: winningLeader && winningLeader.user_id === userId
      ? { team_id: winningLeader.team_id, can_rename: true, can_rename_all: true }
      : null,
  };
}

async function ensureTeamsRoomAccess(roomId: string, userId: string): Promise<TeamRoomAccess> {
  validateUuid(roomId, 'Sala invalida');

  const room = await TeamsRepository.getRoomAccess(roomId, userId);
  if (!room || !room.is_member) {
    throw new TeamsAccessError('No tenes acceso a esta sala');
  }

  if (!room.teams_enabled) {
    throw new TeamsConflictError('Los equipos no estan habilitados en esta sala');
  }

  return room;
}

function ensureRoomOwner(room: TeamRoomAccess): void {
  if (!room.is_owner) {
    throw new TeamsAccessError('Solo el owner de la sala puede gestionar equipos');
  }
}

function normalizeTeamName(value: unknown): string {
  const name = String(value ?? '').trim().replace(/\s+/g, ' ');

  if (name.length < 2 || name.length > 40) {
    throw new TeamsValidationError('El nombre del equipo debe tener entre 2 y 40 caracteres');
  }

  return name;
}

function normalizeTeamColor(value: unknown): string | null {
  const color = String(value ?? '').trim();
  if (!color) return null;

  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    throw new TeamsValidationError('El color del equipo debe tener formato hexadecimal');
  }

  return color;
}

function normalizeComparable(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function validateUuid(value: string, message: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new TeamsValidationError(message);
  }
}

function getCurrentWeekYear() {
  const date = new Date();
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}
