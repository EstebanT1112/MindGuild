import type { Request, Response } from 'express';
import { TeamsService } from '../service/teams.service.js';

export class TeamsController {
  static async getTeams(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const result = await TeamsService.getTeamsOverview(userId, String(req.params.roomId));
      res.json({ success: true, ...result });
    } catch (error: any) {
      handleTeamsError(res, error, 'Error interno al obtener equipos');
    }
  }

  static async createTeam(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const team = await TeamsService.createTeam(userId, String(req.params.roomId), req.body ?? {});
      res.status(201).json({ success: true, team });
    } catch (error: any) {
      handleTeamsError(res, error, 'Error interno al crear equipo');
    }
  }

  static async joinTeam(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const result = await TeamsService.joinTeam(
        userId,
        String(req.params.roomId),
        String(req.params.teamId)
      );
      res.json({ success: true, ...result });
    } catch (error: any) {
      handleTeamsError(res, error, 'Error interno al unirse al equipo');
    }
  }

  static async leaveTeam(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const result = await TeamsService.leaveTeam(
        userId,
        String(req.params.roomId),
        String(req.params.teamId)
      );
      res.json({ success: true, ...result });
    } catch (error: any) {
      handleTeamsError(res, error, 'Error interno al salir del equipo');
    }
  }

  static async renameTeam(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const result = await TeamsService.renameWinningTeam(
        userId,
        String(req.params.roomId),
        String(req.params.teamId),
        req.body ?? {}
      );
      res.json({ success: true, ...result });
    } catch (error: any) {
      handleTeamsError(res, error, 'Error interno al cambiar nombre del equipo');
    }
  }

  static async deleteTeam(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const result = await TeamsService.deleteTeam(
        userId,
        String(req.params.roomId),
        String(req.params.teamId)
      );
      res.json({ success: true, ...result });
    } catch (error: any) {
      handleTeamsError(res, error, 'Error interno al eliminar equipo');
    }
  }

  static async getRanking(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const ranking = await TeamsService.getTeamRanking(userId, String(req.params.roomId));
      res.json({ success: true, ranking });
    } catch (error: any) {
      handleTeamsError(res, error, 'Error interno al obtener ranking de equipos');
    }
  }
}

function handleTeamsError(res: Response, error: any, fallbackMessage: string): void {
  const statusCode = error?.statusCode ?? 500;
  if (statusCode >= 500) {
    console.error(fallbackMessage, error);
  }

  res.status(statusCode).json({
    success: false,
    error: error?.message ?? fallbackMessage,
  });
}
