import { useAuthStore } from '../store/authStore';

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

  useAuthStore.getState().clearSession();
  throw new SessionExpiredError();
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
