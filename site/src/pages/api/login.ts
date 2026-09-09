import type { APIRoute } from 'astro';
import {
  AUTH_PASSWORD,
  SESSION_COOKIE,
  createSession,
  sessionCookieOptions,
} from '../../lib/auth';

export const POST: APIRoute = async ({ cookies, redirect, request }) => {
  const form = await request.formData();
  const password = String(form.get('password') || '');
  const requestedReturnTo = String(form.get('returnTo') || '/');
  const returnTo = requestedReturnTo.startsWith('/') && !requestedReturnTo.startsWith('//') ? requestedReturnTo : '/';

  if (password !== AUTH_PASSWORD) {
    return redirect(`/login?error=1&returnTo=${encodeURIComponent(returnTo)}`, 303);
  }

  cookies.set(SESSION_COOKIE, createSession(), sessionCookieOptions);
  return redirect(returnTo, 303);
};
