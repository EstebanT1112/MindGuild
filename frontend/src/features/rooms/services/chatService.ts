import { API_BASE_URL } from '../../../services/apiConfig';
import { authenticatedFetch } from '../../../services/authenticatedFetch';

export interface RoomMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_username: string;
  sender_avatar_url: string | null;
  content: string;
  created_at: string;
}

export async function fetchRoomMessages(
  accessToken: string,
  roomId: string,
  params?: { limit?: number; before?: string; after?: string }
): Promise<RoomMessage[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.before) query.set('before', params.before);
  if (params?.after) query.set('after', params.after);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomId}/messages${suffix}`, {}, accessToken);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar los mensajes');
  }

  return Array.isArray(data.messages) ? data.messages : [];
}

export async function sendRoomMessage(
  accessToken: string,
  roomId: string,
  content: string
): Promise<RoomMessage> {
  const response = await authenticatedFetch(`${API_BASE_URL}/rooms/${roomId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  }, accessToken);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo enviar el mensaje');
  }

  return data.message;
}
