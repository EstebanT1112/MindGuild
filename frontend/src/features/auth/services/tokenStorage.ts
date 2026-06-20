import * as SecureStore from 'expo-secure-store';
import {
    AUTH0_CLIENT_ID,
    AUTH0_DISCOVERY,
} from '../config/auth0Config';

const REFRESH_TOKEN_KEY = 'mindguild.auth.refresh_token';
let refreshInFlight: Promise<string | null> | null = null;

export async function saveRefreshToken(refreshToken?: string | null) {
    if (!refreshToken) {
        console.warn('Auth0 no devolvio refresh_token. Revisar scope offline_access y Allow Offline Access.');
        return;
    }

    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearRefreshToken() {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function refreshAccessToken(): Promise<string | null> {
    if (refreshInFlight) {
        return refreshInFlight;
    }

    refreshInFlight = refreshAccessTokenInternal();

    try {
        return await refreshInFlight;
    } finally {
        refreshInFlight = null;
    }
}

async function refreshAccessTokenInternal(): Promise<string | null> {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
        return null;
    }

    const response = await fetch(AUTH0_DISCOVERY.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            grant_type: 'refresh_token',
            client_id: AUTH0_CLIENT_ID,
            refresh_token: refreshToken,
        }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.access_token) {
        await clearRefreshToken();
        return null;
    }

    if (data.refresh_token) {
        await saveRefreshToken(data.refresh_token);
    }

    return data.access_token;
}
