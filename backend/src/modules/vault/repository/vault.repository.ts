import { pool } from '../../../common/config/db.js';
import type { VaultMaterialFile, VaultMaterialSummary, VaultResourceType, VaultTopic } from '../types/vault.types.js';

export class VaultRepository {
  static async isActiveRoomMember(roomId: string, userId: string): Promise<boolean> {
    const { rows } = await pool.query(
      `
        SELECT 1
        FROM rooms r
        JOIN room_members rm ON rm.room_id = r.id
        WHERE r.id = $1
          AND r.is_active = true
          AND rm.user_id = $2
          AND rm.is_active = true
        LIMIT 1;
      `,
      [roomId, userId]
    );

    return rows.length > 0;
  }

  static async isRoomOwner(roomId: string, userId: string): Promise<boolean> {
    const { rows } = await pool.query(
      `
        SELECT 1
        FROM rooms
        WHERE id = $1
          AND owner_id = $2
          AND is_active = true
        LIMIT 1;
      `,
      [roomId, userId]
    );

    return rows.length > 0;
  }

  static async listRoomTopics(roomId: string): Promise<VaultTopic[]> {
    const { rows } = await pool.query<VaultTopic>(
      `
        SELECT id, room_id, name, slug, color, created_by, is_active
        FROM academic_topics
        WHERE room_id = $1
          AND is_active = true
        ORDER BY name ASC;
      `,
      [roomId]
    );

    return rows;
  }

  static async findRoomTopicBySlug(roomId: string, slug: string): Promise<VaultTopic | null> {
    const { rows } = await pool.query<VaultTopic>(
      `
        SELECT id, room_id, name, slug, color, created_by, is_active
        FROM academic_topics
        WHERE room_id = $1
          AND slug = $2
          AND is_active = true
        LIMIT 1;
      `,
      [roomId, slug]
    );

    return rows[0] ?? null;
  }

  static async createRoomTopic(input: {
    roomId: string;
    name: string;
    slug: string;
    color: string | null;
    createdBy: string;
  }): Promise<VaultTopic> {
    const { rows } = await pool.query<VaultTopic>(
      `
        INSERT INTO academic_topics (room_id, name, slug, color, created_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (room_id, slug)
        WHERE is_active = true
        DO UPDATE SET
          name = EXCLUDED.name,
          color = COALESCE(EXCLUDED.color, academic_topics.color),
          updated_at = NOW()
        RETURNING id, room_id, name, slug, color, created_by, is_active;
      `,
      [input.roomId, input.name, input.slug, input.color, input.createdBy]
    );

    return rows[0];
  }

  static async listMaterials(input: {
    roomId: string;
    topicId?: string;
    type?: VaultResourceType;
    search?: string;
  }): Promise<VaultMaterialSummary[]> {
    const params: any[] = [input.roomId];
    const filters = ['rm.room_id = $1', 'rm.is_active = true'];

    if (input.type) {
      params.push(input.type);
      filters.push(`rm.resource_type = $${params.length}`);
    }

    if (input.search) {
      params.push(`%${input.search}%`);
      filters.push(`
        (
          rm.title ILIKE $${params.length}
          OR rm.description ILIKE $${params.length}
          OR rm.file_name ILIKE $${params.length}
          OR EXISTS (
            SELECT 1
            FROM room_material_topics rmt_search
            JOIN academic_topics at_search ON at_search.id = rmt_search.topic_id
            WHERE rmt_search.material_id = rm.id
              AND at_search.is_active = true
              AND (
                at_search.name ILIKE $${params.length}
                OR at_search.slug ILIKE $${params.length}
              )
          )
        )
      `);
    }

    if (input.topicId) {
      params.push(input.topicId);
      filters.push(`
        EXISTS (
          SELECT 1
          FROM room_material_topics rmt_filter
          WHERE rmt_filter.material_id = rm.id
            AND rmt_filter.topic_id = $${params.length}
        )
      `);
    }

    const { rows } = await pool.query<VaultMaterialSummary>(
      `
        SELECT
          rm.id,
          rm.room_id,
          rm.title,
          rm.description,
          rm.resource_type,
          rm.file_name,
          rm.mime_type,
          rm.file_size_bytes,
          json_build_object(
            'id', p.id,
            'username', p.username,
            'avatar_url', p.avatar_url
          ) AS uploaded_by,
          COALESCE(topics.topics, '[]'::json) AS topics,
          rm.created_at
        FROM room_materials rm
        JOIN profiles p ON p.id = rm.uploaded_by
        LEFT JOIN LATERAL (
          SELECT json_agg(
            json_build_object(
              'id', at.id,
              'name', at.name,
              'color', at.color
            )
            ORDER BY at.name ASC
          ) AS topics
          FROM room_material_topics rmt
          JOIN academic_topics at ON at.id = rmt.topic_id
          WHERE rmt.material_id = rm.id
            AND at.is_active = true
        ) topics ON true
        WHERE ${filters.join(' AND ')}
        ORDER BY rm.created_at DESC;
      `,
      params
    );

    return rows;
  }

  static async createMaterial(input: {
    roomId: string;
    uploadedBy: string;
    title: string;
    description: string | null;
    resourceType: VaultResourceType;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    fileData: Buffer;
    topicIds: string[];
  }): Promise<VaultMaterialSummary> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows } = await client.query<{ id: string }>(
        `
          INSERT INTO room_materials (
            room_id,
            uploaded_by,
            title,
            description,
            resource_type,
            file_name,
            mime_type,
            file_size_bytes,
            file_data
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id;
        `,
        [
          input.roomId,
          input.uploadedBy,
          input.title,
          input.description,
          input.resourceType,
          input.fileName,
          input.mimeType,
          input.fileSizeBytes,
          input.fileData,
        ]
      );

      const materialId = rows[0].id;

      if (input.topicIds.length > 0) {
        await client.query(
          `
            INSERT INTO room_material_topics (material_id, topic_id)
            SELECT $1, academic_topics.id
            FROM academic_topics
            WHERE academic_topics.room_id = $2
              AND academic_topics.is_active = true
              AND academic_topics.id = ANY($3::uuid[])
            ON CONFLICT DO NOTHING;
          `,
          [materialId, input.roomId, input.topicIds]
        );
      }

      await client.query('COMMIT');

      const material = await this.findMaterialById(input.roomId, materialId, false);
      if (!material) {
        throw new Error('No se pudo recuperar el material creado');
      }

      return material;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findMaterialById(
    roomId: string,
    materialId: string,
    includeFileData: false
  ): Promise<VaultMaterialSummary | null>;
  static async findMaterialById(
    roomId: string,
    materialId: string,
    includeFileData: true
  ): Promise<VaultMaterialFile | null>;
  static async findMaterialById(
    roomId: string,
    materialId: string,
    includeFileData: boolean
  ): Promise<VaultMaterialSummary | VaultMaterialFile | null> {
    const fileDataSelect = includeFileData ? ', rm.file_data' : '';

    const { rows } = await pool.query<VaultMaterialSummary | VaultMaterialFile>(
      `
        SELECT
          rm.id,
          rm.room_id,
          rm.title,
          rm.description,
          rm.resource_type,
          rm.file_name,
          rm.mime_type,
          rm.file_size_bytes,
          json_build_object(
            'id', p.id,
            'username', p.username,
            'avatar_url', p.avatar_url
          ) AS uploaded_by,
          COALESCE(topics.topics, '[]'::json) AS topics,
          rm.created_at
          ${fileDataSelect}
        FROM room_materials rm
        JOIN profiles p ON p.id = rm.uploaded_by
        LEFT JOIN LATERAL (
          SELECT json_agg(
            json_build_object(
              'id', at.id,
              'name', at.name,
              'color', at.color
            )
            ORDER BY at.name ASC
          ) AS topics
          FROM room_material_topics rmt
          JOIN academic_topics at ON at.id = rmt.topic_id
          WHERE rmt.material_id = rm.id
            AND at.is_active = true
        ) topics ON true
        WHERE rm.room_id = $1
          AND rm.id = $2
          AND rm.is_active = true
        LIMIT 1;
      `,
      [roomId, materialId]
    );

    return rows[0] ?? null;
  }

  static async countMatchingTopics(roomId: string, topicIds: string[]): Promise<number> {
    if (topicIds.length === 0) return 0;

    const { rows } = await pool.query<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM academic_topics
        WHERE room_id = $1
          AND is_active = true
          AND id = ANY($2::uuid[]);
      `,
      [roomId, topicIds]
    );

    return Number(rows[0]?.total ?? 0);
  }

  static async deactivateMaterial(input: {
    roomId: string;
    materialId: string;
  }): Promise<void> {
    await pool.query(
      `
        UPDATE room_materials
        SET is_active = false,
            deleted_at = now(),
            updated_at = now()
        WHERE room_id = $1
          AND id = $2
          AND is_active = true;
      `,
      [input.roomId, input.materialId]
    );
  }
}
