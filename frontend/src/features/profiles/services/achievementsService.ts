import { API_BASE_URL } from '../../../services/apiConfig';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  badge_icon?: string | null;
  type: string;
  target_value: number;
  unlocked: boolean;
  unlocked_at?: string | null;
}

export async function fetchAchievements(
  accessToken: string
): Promise<Achievement[]> {
  const response = await fetch(`${API_BASE_URL}/achievements/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar los logros');
  }

  return data.data;
}
