import { useAuthStore } from '../store/authStore';
import { useAppDataStore } from '../store/appDataStore';
import { refreshAccessToken } from '../features/auth/services/tokenStorage';

export class SessionExpiredError extends Error {
  constructor() {
    super('Sesion expirada');
    this.name = 'SessionExpiredError';
  }
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  accessToken?: string | null
) {
  const storeToken = useAuthStore.getState().access_token;
  const token = storeToken && storeToken !== accessToken ? storeToken : accessToken ?? storeToken;
  const response = await fetch(url, withAuthorization(options, token));

  if (response.status !== 401) {
    return response;
  }

  const renewedAccessToken = await refreshAccessToken();

  if (!renewedAccessToken) {
    useAppDataStore.getState().clearAll();
    useAuthStore.getState().clearSession();
    throw new SessionExpiredError();
  }

  useAuthStore.getState().updateAccessToken(renewedAccessToken);
  const retryResponse = await fetch(url, withAuthorization(options, renewedAccessToken));

  if (retryResponse.status === 401) {
    useAppDataStore.getState().clearAll();
    useAuthStore.getState().clearSession();
    throw new SessionExpiredError();
  }

  return retryResponse;
}

function withAuthorization(options: RequestInit, accessToken?: string | null): RequestInit {
  const headers = new Headers(options.headers);

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return {
    ...options,
    headers,
  };
}
