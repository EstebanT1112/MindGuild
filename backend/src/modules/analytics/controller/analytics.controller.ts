import type { Request, Response } from 'express';
import { AnalyticsService } from '../service/analytics.service.js';

export const AnalyticsController = {
  async getMyDashboard(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const result = await AnalyticsService.getMyDashboard(userId);

      return res.status(200).json(result);
    } catch (error: any) {
      return handleAnalyticsError(res, error, 'Error interno al obtener dashboard individual');
    }
  },

  async getRoomDashboard(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const roomId = String(req.params.roomId ?? '');
      const result = await AnalyticsService.getRoomDashboard(userId, roomId);

      return res.status(200).json(result);
    } catch (error: any) {
      return handleAnalyticsError(res, error, 'Error interno al obtener dashboard de sala');
    }
  },

  async getMyDifficultyHeatmap(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const result = await AnalyticsService.getMyDifficultyHeatmap(userId, {
        period: getQueryString(req, 'period'),
        weekYear: getQueryString(req, 'week_year'),
      });

      return res.status(200).json(result);
    } catch (error: any) {
      return handleAnalyticsError(res, error, 'Error interno al obtener heatmap individual');
    }
  },

  async getRoomDifficultyHeatmap(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const roomId = String(req.params.roomId ?? '');
      const result = await AnalyticsService.getRoomDifficultyHeatmap(userId, roomId, {
        period: getQueryString(req, 'period'),
        weekYear: getQueryString(req, 'week_year'),
      });

      return res.status(200).json(result);
    } catch (error: any) {
      return handleAnalyticsError(res, error, 'Error interno al obtener heatmap de sala');
    }
  },
};

function getUserId(req: Request) {
  return (req as any).user?.id;
}

function getQueryString(req: Request, key: string) {
  const value = req.query[key];
  return typeof value === 'string' ? value : undefined;
}

function handleAnalyticsError(res: Response, error: any, fallbackMessage: string) {
  const statusCode = Number(error?.statusCode ?? 500);

  if (statusCode >= 500) {
    console.error(fallbackMessage, error);
  }

  return res.status(statusCode).json({
    error: error?.message ?? fallbackMessage,
  });
}
