import { API_BASE_URL } from '../../../services/apiConfig';

export interface FullProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  streak_days: number;
  total_study_minutes: number;
  weekly_stats: {
    total_minutes: number;
    consistency_score: number;
    academic_score: number;
    bosses_count: number;
  };
  village: {
    village_level: number;
  };
}

export interface UpdateProfileInput {
  username?: string;
  avatar_url?: string | null;
  bio?: string | null;
}

export async function fetchMyProfile(accessToken: string): Promise<FullProfile> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cargar el perfil');
  }

  return data;
}

export async function updateMyProfile(
  accessToken: string,
  input: UpdateProfileInput
): Promise<FullProfile> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo actualizar el perfil');
  }

  return data;
}
