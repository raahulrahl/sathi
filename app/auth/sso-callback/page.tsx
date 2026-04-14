'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

/**
 * Landing page Clerk redirects to after an OAuth round-trip. The callback
 * component exchanges the authorization code for a session and then routes
 * the user to `redirectUrlComplete` (set in sign-in-form.tsx).
 */
export default function SSOCallbackPage() {
  return (
    <div className="container flex min-h-[50vh] items-center justify-center">
      <div className="text-sm text-muted-foreground">Signing you in…</div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
