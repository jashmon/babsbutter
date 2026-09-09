import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, verifySession } from './lib/auth';

const publicPaths = ['/login', '/api/login', '/api/logout', '/favicon.svg'];

export const onRequest = defineMiddleware(({ cookies, locals, redirect, url }, next) => {
  const isPublicPath = publicPaths.includes(url.pathname) || url.pathname.startsWith('/assets/');
  if (isPublicPath) return next();

  if (!verifySession(cookies.get(SESSION_COOKIE)?.value)) {
    const returnTo = `${url.pathname}${url.search}${url.hash}`;
    return redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`, 302);
  }

  locals.user = { username: 'access' };
  return next();
});
