import { redirect } from 'next/navigation';
import { requireUserId } from '@/lib/auth-guard';
import { syncClerkUserToSupabase } from '@/lib/clerk-sync';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Post-authentication landing page.
 *
 * Clerk sends everyone here after sign-in / sign-up. This page decides
 * where they actually belong based on profile completeness:
 *
 *   - No `profile.role` yet → first-time user, send to /onboarding.
 *   - role already set       → returning user, send to /dashboard.
 *
 * Why this indirection: Clerk only supports a single AFTER_SIGN_IN_URL
 * env var, with no native "has-onboarded" branching. Without this page,
 * returning users land on /onboarding every login and have to re-save
 * the same form or click away — bad muscle memory and confusing.
 *
 * The page renders nothing — it always redirects. Server component with
 * zero UI means there's no flicker between routes.
 */
export default async function PostAuthPage() {
  const userId = await requireUserId('/post-auth');

  // Self-heal: ensure a profile row exists so the role check below is valid.
  // This mirrors what /onboarding does on load, so brand-new users who are
  // about to be sent there don't need that page to do it redundantly.
  await syncClerkUserToSupabase(userId);

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  // `role` is the canonical "has finished onboarding" signal — the
  // onboarding form requires it, and it's only set after submit.
  if (!profile?.role) {
    redirect('/onboarding');
  }

  redirect('/dashboard');
}
