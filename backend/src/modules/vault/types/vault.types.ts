export type VaultResourceType = 'pdf' | 'image' | 'text' | 'other';

export interface VaultMaterialTopic {
  id: string;
  name: string;
  color: string | null;
}

export interface VaultTopic extends VaultMaterialTopic {
  room_id: string;
  slug: string;
  created_by: string | null;
  is_active: boolean;
}

export interface VaultMaterialSummary {
  id: string;
  room_id: string;
  title: string;
  description: string | null;
  resource_type: VaultResourceType;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  uploaded_by: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  topics: VaultMaterialTopic[];
  created_at: string;
}

export interface VaultMaterialFile extends VaultMaterialSummary {
  file_data: Buffer;
}

export interface ListVaultMaterialsInput {
  roomId: string;
  userId: string;
  topicId?: string;
  type?: string;
  search?: string;
}

export interface CreateVaultMaterialInput {
  roomId: string;
  userId: string;
  title: string;
  description?: string | null;
  fileName: string;
  mimeType: string;
  fileBase64: string;
  topicIds?: string[];
}

export interface DeleteVaultMaterialInput {
  roomId: string;
  materialId: string;
  userId: string;
}

export interface CreateVaultTopicInput {
  roomId: string;
  userId: string;
  name?: string;
  color?: string | null;
}

export class VaultValidationError extends Error {
  statusCode = 400;
}

export class VaultAccessError extends Error {
  statusCode = 403;
}

export class VaultNotFoundError extends Error {
  statusCode = 404;
}
