import { API_BASE_URL } from '../../../services/apiConfig';

const AUTH0_DOMAIN = 'mindguildestebanapp.au.auth0.com';
const AUTH0_CLIENT_ID = 'Roe6rfTONBQJg3PwSZqObN2XCPwBR1b9';
const AUTH0_CONNECTION = 'Username-Password-Authentication';

export interface ProfileResult {
    id: string;
    email: string;
    username: string;
}

export interface Auth0Result {
    auth_user_id: string;
    email: string;
    access_token: string;
}

export interface RegisterResult extends Auth0Result {
    profile: ProfileResult;
}

export interface AuthError {
    code: string;
    message: string;
}

export async function register(
    email: string,
    password: string,
    username: string
): Promise<RegisterResult> {
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

export async function registerWithAuth0(
    email: string,
    password: string
): Promise<Auth0Result> {
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
            scope: 'openid profile email',
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
    };
}

export async function loginWithAuth0(
    email: string,
    password: string
): Promise<Auth0Result> {
    const tokenRes = await safeFetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            grant_type: 'password',
            client_id: AUTH0_CLIENT_ID,
            connection: AUTH0_CONNECTION,
            username: email,
            password,
            scope: 'openid profile email',
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
    };
}

async function createProfile(input: {
    auth_user_id: string;
    email: string;
    username: string;
}): Promise<ProfileResult> {
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

async function fetchAuth0UserInfo(accessToken: string) {
    const userRes = await safeFetch(`https://${AUTH0_DOMAIN}/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    const userData = await parseJson(userRes);

    if (!userRes.ok) {
        throw buildError(userData);
    }

    return userData;
}

async function safeFetch(url: string, options: RequestInit, networkMessage?: string) {
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
        backend_400: 'Los datos del perfil no son validos.',
        backend_409: 'El email o username ya esta registrado.',
    };
    return messages[code] ?? fallback ?? `Ocurrio un error inesperado (${code}).`;
}
