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

export async function fetchRanking(type: 'semanal' | 'racha' | 'academico' | 'jefes'): Promise<RankingEntry[]> {
    const response = await fetch(`${API_BASE_URL}/ranking?type=${type}`);

    if (!response.ok) {
        throw new Error('Error al obtener el ranking');
    }

    return await response.json();
}
