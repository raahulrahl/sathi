'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
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
 */
export function LinkOAuthButton({ provider }: { provider: LinkableProvider }) {
  const { user, isLoaded } = useUser();
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (!isLoaded || !user) return;
    setPending(true);
    try {
      await user.createExternalAccount({
        strategy: CLERK_STRATEGY[provider],
        redirectUrl: window.location.href,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={!isLoaded || pending}
      className="w-full"
    >
      {pending ? 'Redirecting…' : `Link ${LABEL[provider]}`}
    </Button>
  );
}
