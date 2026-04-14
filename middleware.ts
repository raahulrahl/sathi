import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Auth-gated routes. Everything else is public per Product Spec §3:
 * browse first, sign up later. Only the act of posting, requesting,
 * dashboard, and in-match views require a session.
 */
const isProtected = createRouteMatcher([
  '/onboarding(.*)',
  '/dashboard(.*)',
  '/post/(.*)',
  '/trip/(.*)/request(.*)',
  '/match/(.*)',
  '/api/verify/(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    const { userId, redirectToSignIn } = await auth();
    if (!userId) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next internals + static files; run on API routes.
    '/((?!_next|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    '/(api|trpc)(.*)',
  ],
};
