import { createHmac, timingSafeEqual } from 'node:crypto';
import { AuthUnauthorizedError } from '../types/auth.types.js';

interface AppTokenPayload {
  sub: string;
  email: string;
  username: string;
  exp: number;
}

const TOKEN_PREFIX = 'mg';
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const APP_TOKEN_SECRET = resolveAppTokenSecret();

export function createAppToken(input: { id: string; email: string; username: string }) {
  const payload: AppTokenPayload = {
    sub: input.id,
    email: input.email,
    username: input.username,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${TOKEN_PREFIX}.${encodedPayload}.${signature}`;
}

export function verifyAppToken(token: string): AppTokenPayload {
  const [prefix, encodedPayload, signature] = token.split('.');

  if (prefix !== TOKEN_PREFIX || !encodedPayload || !signature) {
    throw new AuthUnauthorizedError('App token invalido');
  }

  const expectedSignature = sign(encodedPayload);

  if (!safeEquals(signature, expectedSignature)) {
    throw new AuthUnauthorizedError('App token invalido');
  }

  let payload: Partial<AppTokenPayload>;

  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<AppTokenPayload>;
  } catch {
    throw new AuthUnauthorizedError('App token invalido');
  }

  if (!payload.sub || !payload.email || !payload.username || !payload.exp) {
    throw new AuthUnauthorizedError('App token invalido');
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new AuthUnauthorizedError('App token expirado');
  }

  return payload as AppTokenPayload;
}

export function isAppToken(token: string) {
  return token.startsWith(`${TOKEN_PREFIX}.`);
}

function sign(value: string) {
  return createHmac('sha256', APP_TOKEN_SECRET).update(value).digest('base64url');
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function safeEquals(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

function resolveAppTokenSecret() {
  const secret = process.env.APP_TOKEN_SECRET ?? process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('APP_TOKEN_SECRET es requerido en produccion');
  }

  return 'mindguild-local-dev-secret-change-me';
}
