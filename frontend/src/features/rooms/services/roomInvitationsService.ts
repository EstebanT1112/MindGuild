import Constants from 'expo-constants';

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
  async fetchReceivedRoomInvitations(accessToken: string) {
    const response = await fetch(`${API_URL}/room-invitations`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'No se pudieron cargar las invitaciones de sala.');
    }
    return response.json();
  },

  /**
   * Envía una invitación de sala a un amigo específico
   */
  async sendRoomInvitation(accessToken: string, roomId: string, receiverId: string) {
    const response = await fetch(`${API_URL}/room-invitations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ room_id: roomId, receiver_id: receiverId })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'No se pudo enviar la invitación.');
    }
    return response.json();
  },

  /**
   * Acepta una invitación de sala y retorna los datos de la membresía nueva
   */
  async acceptRoomInvitation(accessToken: string, invitationId: string) {
    const response = await fetch(`${API_URL}/room-invitations/${invitationId}/accept`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'No se pudo aceptar la invitación.');
    }
    return response.json() as Promise<{ success: boolean; room: { id: string; name: string; membership_status: 'new' | 'reactivate' } }>;
  },

  /**
   * Rechaza una invitación de sala cambiando su estado a 'rejected'
   */
  async rejectRoomInvitation(accessToken: string, invitationId: string) {
    const response = await fetch(`${API_URL}/room-invitations/${invitationId}/reject`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'No se pudo rechazar la invitación.');
    }
    return response.json();
  }
};