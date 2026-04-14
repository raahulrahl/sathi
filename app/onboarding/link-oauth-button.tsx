'use client';

import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type LinkableProvider = 'linkedin' | 'twitter';

const SUPABASE_PROVIDER: Record<LinkableProvider, 'linkedin_oidc' | 'twitter'> = {
  linkedin: 'linkedin_oidc',
  twitter: 'twitter',
};

/**
 * Adds an additional OAuth identity to the current user. Supabase writes it to
 * auth.identities; the trigger in 0003 mirrors it into `verifications`.
 */
export function LinkOAuthButton({ provider }: { provider: LinkableProvider }) {
  const supabase = createSupabaseBrowserClient();
  async function onClick() {
    const next = '/onboarding';
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
        : undefined;
    // linkIdentity keeps the current session and adds the new identity.
    const linkOpts = { provider: SUPABASE_PROVIDER[provider] } as const;
    const { error } = await supabase.auth.linkIdentity(linkOpts);
    if (error) {
      // Fall back to a regular OAuth sign-in — Supabase will link the identity
      // on providers that allow merging, or show an error.
      await supabase.auth.signInWithOAuth({
        provider: SUPABASE_PROVIDER[provider],
        ...(redirectTo ? { options: { redirectTo } } : {}),
      });
    }
  }
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="w-full">
      Link {provider === 'linkedin' ? 'LinkedIn' : 'X'}
    </Button>
  );
}
