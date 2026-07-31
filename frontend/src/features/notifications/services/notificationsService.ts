import { API_BASE_URL } from '../../../services/apiConfig';
import { authenticatedFetch } from '../../../services/authenticatedFetch';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  reference_type: string | null;
  reference_id: string | null;
  read: boolean;
  created_at: string;
}

export async function fetchMyNotifications(
  accessToken: string,
  options: { unreadOnly?: boolean; limit?: number; offset?: number } = {}
): Promise<AppNotification[]> {
  const params = new URLSearchParams();
  if (options.unreadOnly) params.set('unreadOnly', 'true');
  if (options.limit) params.set('limit', String(options.limit));
  if (options.offset) params.set('offset', String(options.offset));

  const suffix = params.toString() ? `?${params.toString()}` : '';
  const response = await authenticatedFetch(`${API_BASE_URL}/notifications/me${suffix}`, {}, accessToken);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? data.error ?? 'No se pudieron cargar las notificaciones');
  }

  return Array.isArray(data.data) ? data.data : [];
}

export async function fetchUnreadNotificationsCount(accessToken: string): Promise<number> {
  const response = await authenticatedFetch(`${API_BASE_URL}/notifications/me/unread-count`, {}, accessToken);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? data.error ?? 'No se pudo cargar el contador de notificaciones');
  }

  return Number(data.data?.count) || 0;
}

export async function markNotificationAsRead(accessToken: string, notificationId: string): Promise<AppNotification> {
  const response = await authenticatedFetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: 'PATCH',
  }, accessToken);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? data.error ?? 'No se pudo marcar la notificacion');
  }

  return data.data;
}

export async function markAllNotificationsAsRead(accessToken: string): Promise<number> {
  const response = await authenticatedFetch(`${API_BASE_URL}/notifications/me/read-all`, {
    method: 'PATCH',
  }, accessToken);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? data.error ?? 'No se pudieron marcar las notificaciones');
  }

  return Number(data.data?.updated) || 0;
}

export async function clearAllNotifications(accessToken: string): Promise<number> {
  const response = await authenticatedFetch(`${API_BASE_URL}/notifications/me`, {
    method: 'DELETE',
  }, accessToken);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? data.error ?? 'No se pudieron limpiar las notificaciones');
  }

  return Number(data.data?.deleted) || 0;
}
