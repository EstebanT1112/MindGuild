import { API_BASE_URL } from '../../../services/apiConfig';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
    AUTH0_CLIENT_ID,
    AUTH0_CONNECTION,
    AUTH0_DISCOVERY,
    AUTH0_DOMAIN,
    AUTH0_GOOGLE_CONNECTION,
    AUTH0_SCOPES,
    getAuth0RedirectUri,
} from '../config/auth0Config';
import { saveRefreshToken } from './tokenStorage';

WebBrowser.maybeCompleteAuthSession();

export interface ProfileResult {
    id: string;
    email: string;
    username: string;
}

export interface Auth0Result {
    auth_user_id: string;
    email: string;
    access_token: string;
    refresh_token?: string;
}

export interface RegisterResult extends Auth0Result {
    profile: ProfileResult;
}

export interface LoginResult extends Auth0Result {
    profile: ProfileResult;
}

export interface AuthError {
    code: string;
    message: string;
}

export interface LinkGoogleResult {
    auth_providers: string[];
}

export async function register(
    email: string,
    password: string,
    username: string
): Promise<RegisterResult> {
    // Orquesta RF-01: primero crea el usuario en Auth0 y luego persiste el perfil en backend.
    console.log('Register step: Auth0 signup');
    const authResult = await registerWithAuth0(email, password);
    console.log('Register step: backend profile', API_BASE_URL);
    const profile = await createProfile({
        auth_user_id: authResult.auth_user_id,
        email: authResult.email,
        username,
    });

    return {
        ...authResult,
        profile,
    };
}

export async function login(
    email: string,
    password: string
): Promise<LoginResult> {
    // RF-02: valida credenciales en Auth0 y sincroniza la sesion con el perfil local.
    const authResult = await loginWithAuth0(email, password);
    //Prueba de post
    //console.log(authResult.access_token);
    const profile = await getCurrentProfile(authResult.access_token);
    await saveRefreshToken(authResult.refresh_token);

    return {
        ...authResult,
        profile,
    };
}

export async function loginWithGoogle(): Promise<LoginResult> {
    // RF-01: usa Authorization Code + PKCE con Universal Login de Auth0 para Google.
    const tokenResult = await getGoogleTokens();

    const response = await safeFetch(`${API_BASE_URL}/auth/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: tokenResult.accessToken }),
    }, 'No se pudo conectar con el backend para iniciar sesion con Google.');

    const data = await parseJson(response);

    if (!response.ok) {
        throw {
            code: `backend_${response.status}`,
            message: data.error ?? 'No se pudo iniciar sesion con Google.',
        };
    }

    await saveRefreshToken(tokenResult.refreshToken);

    return {
        auth_user_id: data.auth_user_id,
        email: data.email,
        access_token: tokenResult.accessToken,
        refresh_token: tokenResult.refreshToken,
        profile: data.profile,
    };
}

export async function linkGoogleAccount(currentAccessToken: string): Promise<LinkGoogleResult> {
    // RF-01: vincula Google al perfil autenticado sin cambiar la sesion actual.
    const googleAccessToken = await getGoogleAccessToken();

    const response = await safeFetch(`${API_BASE_URL}/auth/link-google`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentAccessToken}`,
        },
        body: JSON.stringify({ access_token: googleAccessToken }),
    }, 'No se pudo conectar con el backend para vincular Google.');

    const data = await parseJson(response);

    if (!response.ok) {
        throw {
            code: `backend_${response.status}`,
            message: data.error ?? 'No se pudo vincular Google.',
        };
    }

    return data;
}

export async function requestPasswordReset(email: string): Promise<void> {
    // RF-01: solicita a Auth0 el envio de email de recuperacion sin revelar existencia.
    const response = await safeFetch(`https://${AUTH0_DOMAIN}/dbconnections/change_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: AUTH0_CLIENT_ID,
            connection: AUTH0_CONNECTION,
            email,
        }),
    });

    if (!response.ok) {
        const data = await parseJson(response);
        throw buildError(data);
    }
}

export async function registerWithAuth0(
    email: string,
    password: string
): Promise<Auth0Result> {
    // Registra credenciales en Auth0 y obtiene el access_token necesario para leer /userinfo.
    const signupRes = await safeFetch(`https://${AUTH0_DOMAIN}/dbconnections/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: AUTH0_CLIENT_ID,
            connection: AUTH0_CONNECTION,
            email,
            password,
        }),
    });

    const signupData = await parseJson(signupRes);

    if (!signupRes.ok) {
        throw buildError(signupData);
    }

    const tokenRes = await safeFetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            grant_type: 'password',
            client_id: AUTH0_CLIENT_ID,
            connection: AUTH0_CONNECTION,
            username: email,
            password,
            scope: AUTH0_SCOPES.join(' '),
        }),
    });

    const tokenData = await parseJson(tokenRes);

    if (!tokenRes.ok) {
        throw buildError(tokenData);
    }

    const userData = await fetchAuth0UserInfo(tokenData.access_token);

    return {
        auth_user_id: userData.sub,
        email: userData.email ?? signupData.email,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
    };
}

export async function loginWithAuth0(
    email: string,
    password: string
): Promise<Auth0Result> {
    // Solicita a Auth0 un access_token usando las credenciales del usuario.
    const tokenRes = await safeFetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            grant_type: 'password',
            client_id: AUTH0_CLIENT_ID,
            connection: AUTH0_CONNECTION,
            username: email,
            password,
            scope: AUTH0_SCOPES.join(' '),
        }),
    });

    const tokenData = await parseJson(tokenRes);

    if (!tokenRes.ok) {
        throw buildError(tokenData);
    }

    const userData = await fetchAuth0UserInfo(tokenData.access_token);

    return {
        auth_user_id: userData.sub,
        email: userData.email,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
    };
}

async function createProfile(input: {
    auth_user_id: string;
    email: string;
    username: string;
}): Promise<ProfileResult> {
    // Crea el perfil de dominio en MindGuild usando el identificador externo de Auth0.
    const response = await safeFetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    }, 'No se pudo conectar con el backend. Verifica que este levantado en el puerto 3000 y que el celular este en la misma red WiFi.');

    const data = await parseJson(response);

    if (!response.ok) {
        throw {
            code: `backend_${response.status}`,
            message: data.error ?? 'No se pudo crear el perfil.',
        };
    }

    return data;
}

async function getCurrentProfile(accessToken: string): Promise<ProfileResult> {
    // Usa el access_token para que el backend valide identidad y devuelva el perfil local.
    const response = await safeFetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    }, 'No se pudo conectar con el backend para cargar tu perfil.');

    const data = await parseJson(response);

    if (!response.ok) {
        throw {
            code: `backend_${response.status}`,
            message: data.error ?? 'No se pudo cargar el perfil.',
        };
    }

    return data;
}

async function fetchAuth0UserInfo(accessToken: string) {
    // Obtiene el sub de Auth0, que el sistema usa como auth_user_id.
    const userRes = await safeFetch(`https://${AUTH0_DOMAIN}/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    const userData = await parseJson(userRes);

    if (!userRes.ok) {
        throw buildError(userData);
    }

    return userData;
}

async function getGoogleAccessToken(): Promise<string> {
    const tokenResult = await getGoogleTokens();
    return tokenResult.accessToken;
}

async function getGoogleTokens(): Promise<{ accessToken: string; refreshToken?: string }> {
    const redirectUri = getAuth0RedirectUri();
    console.log('AUTH0_REDIRECT_URI', redirectUri);

    const request = new AuthSession.AuthRequest({
        clientId: AUTH0_CLIENT_ID,
        responseType: AuthSession.ResponseType.Code,
        scopes: AUTH0_SCOPES,
        redirectUri,
        usePKCE: true,
        extraParams: {
            connection: AUTH0_GOOGLE_CONNECTION,
        },
    });

    const result = await request.promptAsync(AUTH0_DISCOVERY);

    if (result.type !== 'success' || !result.params.code) {
        throw {
            code: 'auth_cancelled',
            message: 'Inicio de sesion con Google cancelado.',
        };
    }

    const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
            clientId: AUTH0_CLIENT_ID,
            code: result.params.code,
            redirectUri,
            extraParams: {
                code_verifier: request.codeVerifier ?? '',
            },
        },
        AUTH0_DISCOVERY
    );

    if (!tokenResponse.accessToken) {
        throw {
            code: 'missing_access_token',
            message: 'Auth0 no devolvio un token valido.',
        };
    }

    return {
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
    };
}

async function safeFetch(url: string, options: RequestInit, networkMessage?: string) {
    // Normaliza errores de red para que la UI muestre mensajes consistentes.
    try {
        return await fetch(url, options);
    } catch (error) {
        console.log('Fetch failed', url, error);
        throw {
            code: 'network_error',
            message: networkMessage ?? 'No se pudo conectar con el servidor. Revisa tu conexion e intenta de nuevo.',
        };
    }
}

async function parseJson(response: Response) {
    try {
        return await response.json();
    } catch {
        throw {
            code: 'invalid_response',
            message: `Respuesta invalida del servidor (${response.status}).`,
        };
    }
}

function buildError(data: any): AuthError {
    // Traduce errores de Auth0/backend a un formato comun para la app.
    const code = data.code || data.error || 'unknown_error';
    const message = resolveErrorMessage(code, data.description || data.error_description);
    return { code, message };
}

function resolveErrorMessage(code: string, fallback?: string): string {
    const messages: Record<string, string> = {
        user_exists: 'Este email ya esta registrado.',
        invalid_password: 'La contrasena no cumple los requisitos minimos.',
        invalid_signup: 'Los datos ingresados no son validos.',
        too_many_attempts: 'Demasiados intentos. Espera unos minutos.',
        invalid_grant: 'Email o contrasena incorrectos.',
        access_denied: 'Acceso denegado. Verifica tus credenciales.',
        network_error: 'No se pudo conectar con el servidor. Revisa tu conexion e intenta de nuevo.',
        invalid_response: 'El servidor respondio con un formato invalido.',
        auth_cancelled: 'Inicio de sesion cancelado.',
        missing_access_token: 'Auth0 no devolvio un token valido.',
        backend_400: 'Los datos del perfil no son validos.',
        backend_401: 'La sesion no es valida. Inicia sesion nuevamente.',
        backend_404: 'No existe un perfil asociado a esta cuenta.',
        backend_409: 'El email o username ya esta registrado.',
    };
    return messages[code] ?? fallback ?? `Ocurrio un error inesperado (${code}).`;
}
