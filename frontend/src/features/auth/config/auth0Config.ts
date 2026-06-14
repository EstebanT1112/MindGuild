import * as AuthSession from 'expo-auth-session';

export const AUTH0_DOMAIN = requireExpoPublicEnv('EXPO_PUBLIC_AUTH0_DOMAIN');
export const AUTH0_CLIENT_ID = requireExpoPublicEnv('EXPO_PUBLIC_AUTH0_CLIENT_ID');

export const AUTH0_CONNECTION = 'Username-Password-Authentication';
export const AUTH0_GOOGLE_CONNECTION = 'google-oauth2';
export const AUTH0_REDIRECT_PATH =
    process.env.EXPO_PUBLIC_AUTH0_REDIRECT_PATH ?? 'auth/callback';

export const AUTH0_SCOPES = ['openid', 'profile', 'email'];

export const AUTH0_DISCOVERY = {
    authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
    tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
    revocationEndpoint: `https://${AUTH0_DOMAIN}/oauth/revoke`,
};

export function getAuth0RedirectUri() {
    if (process.env.EXPO_PUBLIC_AUTH0_REDIRECT_URI) {
        return process.env.EXPO_PUBLIC_AUTH0_REDIRECT_URI;
    }

    return AuthSession.makeRedirectUri({
        scheme: 'tpmindguild',
        path: AUTH0_REDIRECT_PATH,
    });
}

function requireExpoPublicEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Falta configurar ${name} en frontend/.env`);
    }

    return value;
}
