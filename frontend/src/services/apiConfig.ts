import Constants from 'expo-constants';

const API_PORT = 3000;

function resolveApiBaseUrl() {
    const constants = Constants as any;
    const hostUri =
        Constants.expoConfig?.hostUri ??
        constants.expoGoConfig?.debuggerHost ??
        constants.manifest2?.extra?.expoClient?.hostUri ??
        constants.manifest?.debuggerHost;

    const host = hostUri?.split(':')[0];

    if (host) {
        return `http://${host}:${API_PORT}/api`;
    }

    return `http://localhost:${API_PORT}/api`;
}

export const API_BASE_URL = resolveApiBaseUrl();

console.log('API_BASE_URL', API_BASE_URL);

export interface RankingEntry {
    user_id: string;
    username: string;
    avatar_url: string | null;
    value: number;
    position: number;
}

export interface RankingResponse {
    success: boolean;
    data: {
        type: string;
        scope: string;
        week: string;
        data: RankingEntry[];
    };
}

export type RankingType = 'time' | 'qa' | 'academic' | 'boss' | 'semanal' | 'racha' | 'academico' | 'jefes';

export async function fetchRanking(
    type: RankingType,
    token?: string,
    roomId?: string
): Promise<RankingResponse> {
    try {
        const query = new URLSearchParams({ type });
        if (roomId) query.set('roomId', roomId);

        const response = await fetch(`${API_BASE_URL}/ranking?${query.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            }
        });

        // REVISIÓN CLAVE: Si no es OK, leemos el JSON interno para ver el error real del backend
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.log('❌ Detalle del error que mandó el Backend:', errorData);
            throw new Error(errorData.error || 'Error al obtener el ranking');
        }

        return await response.json();
    } catch (error) {
        console.error('💥 Error dentro de fetchRanking:', error);
        throw error;
    }
}
