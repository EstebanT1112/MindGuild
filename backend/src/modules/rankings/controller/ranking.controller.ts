import type { Request, Response } from 'express';
import * as rankingService from '../service/ranking.service.js';
import type { RankingType } from '../types/ranking.types.js';

export const getRanking = async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as RankingType) || 'semanal';
    const week_year = (req.query.week_year as string) || '2026-19';

    const data = await rankingService.getGlobalRanking(type, week_year);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};