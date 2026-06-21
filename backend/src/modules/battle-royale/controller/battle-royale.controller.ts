import type { Request, Response } from 'express';
import { BattleRoyaleService } from '../service/battle-royale.service.js';
import {
  BattleRoyaleConflictError,
  BattleRoyaleForbiddenError,
  BattleRoyaleNotFoundError,
  BattleRoyaleValidationError,
} from '../types/battle-royale.types.js';

export const BattleRoyaleController = {
  async getConfig(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const roomId = getParam(req, 'roomId');
      const result = await BattleRoyaleService.getConfig(userId, roomId);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleBattleRoyaleError(error, res, 'Error interno al obtener configuracion Battle Royale');
    }
  },

  async createWeeklyQuiz(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const roomId = getParam(req, 'roomId');
      const result = await BattleRoyaleService.createWeeklyQuiz(userId, roomId, req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleBattleRoyaleError(error, res, 'Error interno al configurar cuestionario');
    }
  },

  async updateWeeklyQuiz(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const roomId = getParam(req, 'roomId');
      const quizId = getParam(req, 'quizId');
      const result = await BattleRoyaleService.updateWeeklyQuiz(userId, roomId, quizId, req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleBattleRoyaleError(error, res, 'Error interno al actualizar cuestionario');
    }
  },

  async getQuestions(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const roomId = getParam(req, 'roomId');
      const result = await BattleRoyaleService.listQuestions(userId, roomId);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleBattleRoyaleError(error, res, 'Error interno al listar preguntas');
    }
  },

  async createQuestion(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const roomId = getParam(req, 'roomId');
      const result = await BattleRoyaleService.createQuestion(userId, roomId, req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      return handleBattleRoyaleError(error, res, 'Error interno al crear pregunta');
    }
  },

  async getWeeklyQuizStatus(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const roomId = getParam(req, 'roomId');
      const result = await BattleRoyaleService.getWeeklyQuizStatus(userId, roomId);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleBattleRoyaleError(error, res, 'Error interno al obtener estado del quiz');
    }
  },

  async startWeeklyQuiz(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const roomId = getParam(req, 'roomId');
      const result = await BattleRoyaleService.startWeeklyQuiz(userId, roomId);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleBattleRoyaleError(error, res, 'Error interno al iniciar quiz');
    }
  },

  async saveWeeklyQuizAnswer(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const attemptId = getParam(req, 'attemptId');
      const result = await BattleRoyaleService.saveWeeklyQuizAnswer(userId, attemptId, req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleBattleRoyaleError(error, res, 'Error interno al guardar respuesta');
    }
  },

  async completeWeeklyQuiz(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const attemptId = getParam(req, 'attemptId');
      const result = await BattleRoyaleService.completeWeeklyQuiz(userId, attemptId);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleBattleRoyaleError(error, res, 'Error interno al finalizar quiz');
    }
  },

  async getValidationItems(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const roomId = getParam(req, 'roomId');
      const result = await BattleRoyaleService.listValidationItems(userId, roomId);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleBattleRoyaleError(error, res, 'Error interno al listar validaciones');
    }
  },

  async voteValidationItem(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const result = await BattleRoyaleService.voteValidationItem(userId, req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleBattleRoyaleError(error, res, 'Error interno al votar validacion');
    }
  },

  async resolveWeeklyQuiz(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const roomId = getParam(req, 'roomId');
      const result = await BattleRoyaleService.resolveWeeklyQuiz(userId, roomId);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleBattleRoyaleError(error, res, 'Error interno al resolver validacion');
    }
  },

  async getWeeklyQuizResult(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const roomId = getParam(req, 'roomId');
      const result = await BattleRoyaleService.getWeeklyQuizResult(userId, roomId);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleBattleRoyaleError(error, res, 'Error interno al obtener resultado del quiz');
    }
  },

  async resetWeeklyQuiz(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const roomId = getParam(req, 'roomId');
      const result = await BattleRoyaleService.resetWeeklyQuiz(userId, roomId);
      return res.status(200).json(result);
    } catch (error: any) {
      return handleBattleRoyaleError(error, res, 'Error interno al reiniciar cuestionario');
    }
  },
};

function getUserId(req: Request) {
  const userId = (req as any).user?.id;

  if (!userId) {
    throw new BattleRoyaleForbiddenError('Usuario no autenticado');
  }

  return String(userId);
}

function getParam(req: Request, name: string) {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : value;
}

function handleBattleRoyaleError(error: any, res: Response, fallbackMessage: string) {
  if (error instanceof BattleRoyaleValidationError) {
    return res.status(400).json({ error: error.message });
  }

  if (error instanceof BattleRoyaleForbiddenError) {
    return res.status(403).json({ error: error.message });
  }

  if (error instanceof BattleRoyaleNotFoundError) {
    return res.status(404).json({ error: error.message });
  }

  if (error instanceof BattleRoyaleConflictError) {
    return res.status(409).json({ error: error.message });
  }

  console.error(fallbackMessage, {
    message: error?.message,
    code: error?.code,
    detail: error?.detail,
  });

  return res.status(500).json({ error: fallbackMessage });
}
