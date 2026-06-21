import { API_BASE_URL } from '../../../services/apiConfig';
import { authenticatedFetch } from '../../../services/authenticatedFetch';

export async function claimMissionReward(accessToken: string, userMissionId: string) {
  const response = await authenticatedFetch(`${API_BASE_URL}/missions/${userMissionId}/claim`, {
    method: 'POST',
  }, accessToken);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? data.error ?? 'No se pudo reclamar la mision');
  }

  return data.data;
}
