const AUTH0_DOMAIN = 'mindguildestebanapp.au.auth0.com';
const AUTH0_CLIENT_ID = 'Roe6rfTONBQJg3PwSZqObN2XCPwBR1b9';
const AUTH0_CONNECTION = 'Username-Password-Authentication';

export interface Auth0Result {
    auth_user_id: string;
    email: string;
    access_token: string;
}

export interface AuthError {
    code: string;
    message: string;
}

// ─── REGISTRO ───────────────────────────────────────────────────────────────

export async function registerWithAuth0(
    email: string,
    password: string
    ): Promise<Auth0Result> {
    // 1. Crear usuario en Auth0
    const signupRes = await fetch(`https://${AUTH0_DOMAIN}/dbconnections/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        client_id: AUTH0_CLIENT_ID,
        connection: AUTH0_CONNECTION,
        email,
        password,
        }),
    });

    const signupData = await signupRes.json();

    if (!signupRes.ok) {
        throw buildError(signupData);
    }

    // 2. Login automático para obtener el token
    const tokenRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
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

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
        throw buildError(tokenData);
    }

    return {
        auth_user_id: signupData._id,
        email: signupData.email,
        access_token: tokenData.access_token,
    };
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────

export async function loginWithAuth0(
    email: string,
    password: string
    ): Promise<Auth0Result> {
    const tokenRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
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

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
        throw buildError(tokenData);
    }

    // Obtener info del usuario con el token
    const userRes = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();

    return {
        auth_user_id: userData.sub,
        email: userData.email,
        access_token: tokenData.access_token,
    };
}

// ─── HELPER ──────────────────────────────────────────────────────────────────

function buildError(data: any): AuthError {
    const code = data.code || data.error || 'unknown_error';
    const message = resolveErrorMessage(code, data.description || data.error_description);
    return { code, message };
}

function resolveErrorMessage(code: string, fallback?: string): string {
    const messages: Record<string, string> = {
        user_exists: 'Este email ya está registrado.',
        invalid_password: 'La contraseña no cumple los requisitos mínimos.',
        invalid_signup: 'Los datos ingresados no son válidos.',
        too_many_attempts: 'Demasiados intentos. Esperá unos minutos.',
        invalid_grant: 'Email o contraseña incorrectos.',
        access_denied: 'Acceso denegado. Verificá tus credenciales.',
    };
    return messages[code] ?? fallback ?? 'Ocurrió un error inesperado.';
}