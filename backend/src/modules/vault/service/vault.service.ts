import { VaultRepository } from '../repository/vault.repository.js';
import {
  VaultAccessError,
  VaultNotFoundError,
  VaultValidationError,
  type CreateVaultMaterialInput,
  type DeleteVaultMaterialInput,
  type ListVaultMaterialsInput,
  type VaultMaterialFile,
  type VaultMaterialSummary,
  type VaultResourceType,
} from '../types/vault.types.js';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
]);

const ALLOWED_RESOURCE_TYPES = new Set<VaultResourceType>(['pdf', 'image', 'text', 'other']);

export class VaultService {
  static async listMaterials(input: ListVaultMaterialsInput): Promise<VaultMaterialSummary[]> {
    validateUuidLike(input.roomId, 'Sala invalida.');
    if (input.topicId) validateUuidLike(input.topicId, 'Tema invalido.');

    const type = normalizeResourceType(input.type);
    const search = normalizeOptionalText(input.search, 80);

    await ensureUserCanAccessRoom(input.roomId, input.userId);

    return VaultRepository.listMaterials({
      roomId: input.roomId,
      topicId: input.topicId,
      type,
      search,
    });
  }

  static async createMaterial(input: CreateVaultMaterialInput): Promise<VaultMaterialSummary> {
    validateUuidLike(input.roomId, 'Sala invalida.');
    await ensureUserCanAccessRoom(input.roomId, input.userId);

    const title = normalizeRequiredText(input.title, 'El titulo del material es obligatorio.', 80);
    const description = normalizeOptionalText(input.description, 300);
    const fileName = normalizeRequiredText(input.fileName, 'El archivo es obligatorio.', 180);
    const mimeType = normalizeRequiredText(input.mimeType, 'El tipo de archivo es obligatorio.', 120).toLowerCase();
    const fileData = decodeBase64File(input.fileBase64);
    const resourceType = resolveResourceType(mimeType);
    const topicIds = normalizeTopicIds(input.topicIds);

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new VaultValidationError('Formato no permitido. Usa PDF, imagen PNG/JPG/WEBP o texto.');
    }

    if (fileData.length > MAX_FILE_SIZE_BYTES) {
      throw new VaultValidationError('El archivo no puede superar 5 MB.');
    }

    if (topicIds.length > 0) {
      const matchingTopics = await VaultRepository.countMatchingTopics(input.roomId, topicIds);
      if (matchingTopics !== topicIds.length) {
        throw new VaultValidationError('Uno o mas temas no pertenecen a esta sala.');
      }
    }

    return VaultRepository.createMaterial({
      roomId: input.roomId,
      uploadedBy: input.userId,
      title,
      description: description ?? null,
      resourceType,
      fileName,
      mimeType,
      fileSizeBytes: fileData.length,
      fileData,
      topicIds,
    });
  }

  static async getMaterialFile(roomId: string, materialId: string, userId: string): Promise<VaultMaterialFile> {
    validateUuidLike(roomId, 'Sala invalida.');
    validateUuidLike(materialId, 'Material invalido.');
    await ensureUserCanAccessRoom(roomId, userId);

    const material = await VaultRepository.findMaterialById(roomId, materialId, true);
    if (!material) {
      throw new VaultNotFoundError('El material no existe.');
    }

    return material;
  }

  static async deleteMaterial(input: DeleteVaultMaterialInput): Promise<void> {
    validateUuidLike(input.roomId, 'Sala invalida.');
    validateUuidLike(input.materialId, 'Material invalido.');
    await ensureUserCanAccessRoom(input.roomId, input.userId);

    const material = await VaultRepository.findMaterialById(input.roomId, input.materialId, false);
    if (!material) {
      throw new VaultNotFoundError('El material no existe.');
    }

    const isOwner = await VaultRepository.isRoomOwner(input.roomId, input.userId);
    const isAuthor = material.uploaded_by.id === input.userId;

    if (!isOwner && !isAuthor) {
      throw new VaultAccessError('No tenes permiso para eliminar este material.');
    }

    await VaultRepository.deactivateMaterial({
      roomId: input.roomId,
      materialId: input.materialId,
    });
  }
}

async function ensureUserCanAccessRoom(roomId: string, userId: string): Promise<void> {
  const hasAccess = await VaultRepository.isActiveRoomMember(roomId, userId);
  if (!hasAccess) {
    throw new VaultAccessError('No tenes acceso a esta sala.');
  }
}

function normalizeRequiredText(value: unknown, message: string, maxLength: number): string {
  const text = String(value ?? '').trim();
  if (!text) {
    throw new VaultValidationError(message);
  }

  if (text.length > maxLength) {
    throw new VaultValidationError(`El texto no puede superar ${maxLength} caracteres.`);
  }

  return text;
}

function normalizeOptionalText(value: unknown, maxLength: number): string | undefined {
  const text = String(value ?? '').trim();
  if (!text) return undefined;

  if (text.length > maxLength) {
    throw new VaultValidationError(`El texto no puede superar ${maxLength} caracteres.`);
  }

  return text;
}

function normalizeResourceType(value: unknown): VaultResourceType | undefined {
  if (!value) return undefined;
  const type = String(value).trim().toLowerCase() as VaultResourceType;

  if (!ALLOWED_RESOURCE_TYPES.has(type)) {
    throw new VaultValidationError('Tipo de recurso invalido.');
  }

  return type;
}

function normalizeTopicIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const uniqueIds = Array.from(new Set(value.map(item => String(item).trim()).filter(Boolean)));
  uniqueIds.forEach(id => validateUuidLike(id, 'Tema invalido.'));

  return uniqueIds.slice(0, 5);
}

function decodeBase64File(value: unknown): Buffer {
  const raw = String(value ?? '').trim();
  if (!raw) {
    throw new VaultValidationError('El archivo es obligatorio.');
  }

  const base64 = raw.includes(',') ? raw.split(',').pop() ?? '' : raw;
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.length === 0) {
    throw new VaultValidationError('El archivo no es valido.');
  }

  return buffer;
}

function resolveResourceType(mimeType: string): VaultResourceType {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'text/plain') return 'text';
  return 'other';
}

function validateUuidLike(value: string, message: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new VaultValidationError(message);
  }
}
