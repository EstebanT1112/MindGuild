import Constants from 'expo-constants';
import { authenticatedFetch } from '../../../services/authenticatedFetch';

const getApiUrl = (): string => {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGoLaunchContext?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000/api`;
  }
  return 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

export const roomInvitationsService = {
  /**
   * Lista las invitaciones de sala pendientes que recibió el usuario
   */
  async fetchReceivedRoomInvitations(accessToken?: string | null) {
    const response = await authenticatedFetch(`${API_URL}/room-invitations`, {}, accessToken);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'No se pudieron cargar las invitaciones de sala.');
    }
    return response.json();
  },

  /**
   * Envía una invitación de sala a un amigo específico
   */
  async sendRoomInvitation(accessToken: string | null | undefined, roomId: string, receiverId: string) {
    const response = await authenticatedFetch(`${API_URL}/room-invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ room_id: roomId, receiver_id: receiverId })
    }, accessToken);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'No se pudo enviar la invitación.');
    }
    return response.json();
  },

  /**
   * Acepta una invitación de sala y retorna los datos de la membresía nueva
   */
  async acceptRoomInvitation(accessToken: string | null | undefined, invitationId: string) {
    const response = await authenticatedFetch(`${API_URL}/room-invitations/${invitationId}/accept`, {
      method: 'POST',
    }, accessToken);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'No se pudo aceptar la invitación.');
    }
    return response.json() as Promise<{ success: boolean; room: { id: string; name: string; membership_status: 'new' | 'reactivate' } }>;
  },

  /**
   * Rechaza una invitación de sala cambiando su estado a 'rejected'
   */
  async rejectRoomInvitation(accessToken: string | null | undefined, invitationId: string) {
    const response = await authenticatedFetch(`${API_URL}/room-invitations/${invitationId}/reject`, {
      method: 'POST',
    }, accessToken);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'No se pudo rechazar la invitación.');
    }
    return response.json();
  }
};
