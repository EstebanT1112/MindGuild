// Para probar local en PC: http://localhost:3000/api
// Para Expo Go: cambiar por tu IP local (ej. 192.168.X.X)
// const BASE_URL = 'http://192.168.100.201:3000/api';
const BASE_URL = 'http://localhost:3000/api';

export interface RankingEntry {
    user_id: string;
    username: string;
    avatar_url: string | null;
    value: number;
    position: number;
}

export async function fetchRanking(type: 'semanal' | 'racha' | 'academico' | 'jefes'): Promise<RankingEntry[]> {
    const response = await fetch(`${BASE_URL}/ranking?type=${type}`);
    
    if (!response.ok) {
        throw new Error('Error al obtener el ranking');
    }

    return await response.json();
}