import { API_BASE_URL } from '../../../services/apiConfig';
import { authenticatedFetch } from '../../../services/authenticatedFetch';

export type VaultResourceType = 'pdf' | 'image' | 'text' | 'other';

export interface VaultTopic {
  id: string;
  room_id: string;
  name: string;
  slug: string;
  color: string | null;
  created_by: string | null;
  is_active: boolean;
}

export interface VaultMaterial {
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
  topics: {
    id: string;
    name: string;
    color: string | null;
  }[];
  created_at: string;
}

export interface CreateVaultMaterialInput {
  title: string;
  description?: string;
  file_name: string;
  mime_type: string;
  file_base64: string;
  topic_ids?: string[];
}

export interface DownloadVaultMaterialResult {
  id: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  file_base64: string;
}

export async function fetchVaultTopics(accessToken: string, roomId: string): Promise<VaultTopic[]> {
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomId}/topics`, {}, accessToken);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar los temas');
  }

  return Array.isArray(data.topics) ? data.topics : [];
}

export async function createVaultTopic(
  accessToken: string,
  roomId: string,
  input: { name: string; color?: string | null }
): Promise<VaultTopic> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/rooms/${roomId}/topics`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    accessToken
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo crear el tema');
  }

  return data.topic;
}

export async function fetchVaultMaterials(
  accessToken: string,
  roomId: string,
  params?: { topicId?: string; type?: VaultResourceType; search?: string }
): Promise<VaultMaterial[]> {
  const query = new URLSearchParams();
  if (params?.topicId) query.set('topicId', params.topicId);
  if (params?.type) query.set('type', params.type);
  if (params?.search) query.set('search', params.search);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomId}/materials${suffix}`, {}, accessToken);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar los materiales');
  }

  return Array.isArray(data.materials) ? data.materials : [];
}

export async function createVaultMaterial(
  accessToken: string,
  roomId: string,
  input: CreateVaultMaterialInput
): Promise<VaultMaterial> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/rooms/${roomId}/materials`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    accessToken
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cargar el material');
  }

  return data.material;
}

export async function downloadVaultMaterial(
  accessToken: string,
  roomId: string,
  materialId: string
): Promise<DownloadVaultMaterialResult> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/rooms/${roomId}/materials/${materialId}/download`,
    {},
    accessToken
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo descargar el material');
  }

  return data.file;
}

export async function deleteVaultMaterial(
  accessToken: string,
  roomId: string,
  materialId: string
): Promise<void> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/rooms/${roomId}/materials/${materialId}`,
    { method: 'DELETE' },
    accessToken
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo eliminar el material');
  }
}
