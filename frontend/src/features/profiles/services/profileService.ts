import { API_BASE_URL } from '../../../services/apiConfig';
import { authenticatedFetch } from '../../../services/authenticatedFetch';

export interface FullProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  streak_days: number;
  total_study_minutes: number;
  coins_balance: number;
  streak_completed_today: boolean;
  streak_shield_active: boolean;
  streak_shield_until: string | null;
  streak_status: 'inactive' | 'pending' | 'active' | 'shielded';
  auth_providers: string[];
  weekly_stats: {
    total_minutes: number;
    consistency_score: number;
    academic_score: number;
    bosses_count: number;
    coins_earned: number;
    daily_minutes: Array<{
      day: string;
      minutes: number;
    }>;
  };
  village: {
    village_level: number;
  };
}

export interface UpdateProfileInput {
  username?: string;
  avatar_url?: string | null;
  bio?: string | null;
  expo_push_token?: string | null;
}

export async function fetchMyProfile(accessToken: string): Promise<FullProfile> {
  // RF-03: pide al backend el perfil unificado con stats semanales y aldea.
  const response = await authenticatedFetch(`${API_BASE_URL}/users/me`, {
    headers: {
    },
  }, accessToken);

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
  // RF-03: actualiza solo campos editables y espera el perfil completo actualizado.
  const response = await authenticatedFetch(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  }, accessToken);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo actualizar el perfil');
  }

  return data;
}
