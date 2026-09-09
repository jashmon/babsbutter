import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'babs_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const sessionSecret = import.meta.env.AUTH_SESSION_SECRET || 'babs-butter-dev-session-secret';

const SESSION_SUBJECT = 'access';
export const AUTH_PASSWORD = import.meta.env.AUTH_PASSWORD || 'abby';

function sign(value: string) {
  return createHmac('sha256', sessionSecret).update(value).digest('base64url');
}

export function createSession() {
  const payload = `${SESSION_SUBJECT}:${Date.now() + SESSION_TTL_SECONDS * 1000}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySession(token: string | undefined) {
  if (!token) return false;
  const separator = token.lastIndexOf('.');
  if (separator < 1) return false;
  const payload = token.slice(0, separator);
  const providedSignature = token.slice(separator + 1);
  const expectedSignature = sign(payload);
  if (providedSignature.length !== expectedSignature.length) return false;

  try {
    if (!timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))) return false;
  } catch {
    return false;
  }

  const [subject, expiresAt] = payload.split(':');
  return subject === SESSION_SUBJECT && Number(expiresAt) > Date.now();
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: import.meta.env.PROD,
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
};
