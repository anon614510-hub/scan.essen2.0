import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
    locales: ['en', 'es'],
    defaultLocale: 'en'
});

const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/:locale/sign-in(.*)',
    '/en/sign-in(.*)',
    '/es/sign-in(.*)',
    '/:locale/sign-up(.*)',
    '/en/sign-up(.*)',
    '/es/sign-up(.*)',
    '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
    if (isPublicRoute(req)) {
        return intlMiddleware(req);
    }
    await auth.protect();
    return intlMiddleware(req);
});

export const config = {
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
