'use client';

import { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

type LinkableProvider = 'linkedin' | 'twitter';

const CLERK_STRATEGY: Record<LinkableProvider, 'oauth_linkedin_oidc' | 'oauth_x'> = {
  linkedin: 'oauth_linkedin_oidc',
  twitter: 'oauth_x',
};

const LABEL: Record<LinkableProvider, string> = {
  linkedin: 'LinkedIn',
  twitter: 'X',
};

/**
 * Adds an external account to the current Clerk user. Clerk opens its own
 * OAuth window; on return the Clerk webhook fires `user.updated`, which
 * mirrors the new identity into our `verifications` table (see
 * /api/clerk-webhook).
 *
 * Errors that fell through `createExternalAccount()` used to be silently
 * swallowed — the button would re-enable but the user had no idea what
 * happened. Clerk now throws a "reverification_required" error for
 * sensitive actions on older sessions, and without surfacing it the whole
 * flow was invisible. Errors are now caught and rendered inline, with a
 * one-click "sign out and back in" fallback for the reverification case
 * since that's the fastest way to continue without dashboard config.
 */
export function LinkOAuthButton({ provider }: { provider: LinkableProvider }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ message: string; needsReauth: boolean } | null>(null);

  async function onClick() {
    if (!isLoaded || !user) return;
    setPending(true);
    setError(null);
    try {
      await user.createExternalAccount({
        strategy: CLERK_STRATEGY[provider],
        redirectUrl: window.location.href,
      });
    } catch (err) {
      const parsed = parseClerkError(err);
      setError(parsed);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={!isLoaded || pending}
        className="w-full"
      >
        {pending ? 'Redirecting…' : `Link ${LABEL[provider]}`}
      </Button>
      {error ? (
        <div className="rounded-md border border-pomegranate-400/40 bg-pomegranate-400/10 p-2 text-xs text-warm-charcoal">
          <p>{error.message}</p>
          {error.needsReauth ? (
            <button
              type="button"
              onClick={() => signOut({ redirectUrl: '/auth/sign-in?redirect_url=/onboarding' })}
              className="mt-1 font-semibold text-marigold-700 underline-offset-4 hover:underline"
            >
              Sign out and back in →
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function parseClerkError(err: unknown): { message: string; needsReauth: boolean } {
  if (err && typeof err === 'object' && 'errors' in err) {
    const first = (
      err as { errors: Array<{ code?: string; message?: string; longMessage?: string }> }
    ).errors?.[0];
    const code = first?.code ?? '';
    if (code === 'reverification_required' || code === 'session_exists') {
      return {
        message:
          'Clerk wants a fresh sign-in before linking another account (a security policy called "step-up auth"). Easiest: sign out and back in, then try linking again.',
        needsReauth: true,
      };
    }
    const msg = first?.longMessage ?? first?.message;
    if (msg && msg.toLowerCase().includes('additional verification')) {
      return {
        message:
          'Clerk wants a fresh sign-in before linking another account. Sign out and back in, then try again.',
        needsReauth: true,
      };
    }
    return { message: msg ?? 'Couldn’t link account.', needsReauth: false };
  }
  if (err instanceof Error) return { message: err.message, needsReauth: false };
  return { message: 'Couldn’t link account.', needsReauth: false };
}
