import type { Request, Response } from 'express';
import { VaultService } from '../service/vault.service.js';

export class VaultController {
  static async listTopics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const topics = await VaultService.listTopics(String(req.params.roomId), userId);

      res.json({ success: true, topics });
    } catch (error: any) {
      handleVaultError(res, error, 'Error interno al obtener temas');
    }
  }

  static async createTopic(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const topic = await VaultService.createTopic({
        roomId: String(req.params.roomId),
        userId,
        name: req.body?.name,
        color: req.body?.color,
      });

      res.status(201).json({ success: true, topic });
    } catch (error: any) {
      handleVaultError(res, error, 'Error interno al crear tema');
    }
  }

  static async listMaterials(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const materials = await VaultService.listMaterials({
        roomId: String(req.params.roomId),
        userId,
        topicId: typeof req.query.topicId === 'string' ? req.query.topicId : undefined,
        type: typeof req.query.type === 'string' ? req.query.type : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
      });

      res.json({ success: true, materials });
    } catch (error: any) {
      handleVaultError(res, error, 'Error interno al obtener materiales');
    }
  }

  static async createMaterial(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const material = await VaultService.createMaterial({
        roomId: String(req.params.roomId),
        userId,
        title: req.body?.title,
        description: req.body?.description,
        fileName: req.body?.file_name,
        mimeType: req.body?.mime_type,
        fileBase64: req.body?.file_base64,
        topicIds: req.body?.topic_ids,
      });

      res.status(201).json({ success: true, material });
    } catch (error: any) {
      handleVaultError(res, error, 'Error interno al cargar material');
    }
  }

  static async downloadMaterial(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const material = await VaultService.getMaterialFile(
        String(req.params.roomId),
        String(req.params.materialId),
        userId
      );

      res.json({
        success: true,
        file: {
          id: material.id,
          file_name: material.file_name,
          mime_type: material.mime_type,
          file_size_bytes: material.file_size_bytes,
          file_base64: material.file_data.toString('base64'),
        },
      });
    } catch (error: any) {
      handleVaultError(res, error, 'Error interno al descargar material');
    }
  }

  static async deleteMaterial(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      await VaultService.deleteMaterial({
        roomId: String(req.params.roomId),
        materialId: String(req.params.materialId),
        userId,
      });

      res.json({ success: true });
    } catch (error: any) {
      handleVaultError(res, error, 'Error interno al eliminar material');
    }
  }
}

function handleVaultError(res: Response, error: any, fallbackMessage: string): void {
  const statusCode = error?.statusCode ?? 500;
  if (statusCode >= 500) {
    console.error(fallbackMessage, error);
  }

  res.status(statusCode).json({
    success: false,
    error: error?.message ?? fallbackMessage,
  });
}
