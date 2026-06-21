import { API_BASE_URL } from '../../../services/apiConfig';
import { authenticatedFetch } from '../../../services/authenticatedFetch';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  badge_icon?: string | null;
  type: string;
  target_value: number;
  unlocked: boolean;
  unlocked_at?: string | null;
  reward_coins?: number;
  reward_claimed_at?: string | null;
}

export async function fetchAchievements(
  accessToken: string
): Promise<Achievement[]> {
  const response = await authenticatedFetch(`${API_BASE_URL}/achievements/me`, {}, accessToken);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar los logros');
  }

  return data.data;
}

export async function claimAchievementReward(accessToken: string, achievementId: string) {
  const response = await authenticatedFetch(`${API_BASE_URL}/achievements/${achievementId}/claim`, {
    method: 'POST',
  }, accessToken);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo reclamar la recompensa');
  }

  return data.data;
}
