import 'server-only';
import { currentUser } from '@clerk/nextjs/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

/**
 * Self-heal: ensure a public.profiles row exists for the current Clerk
 * user. Runs server-side on every authenticated page load that matters
 * (onboarding + post flows), so the app works even before the Clerk
 * webhook is wired up and recovers when the webhook misses an event.
 *
 * Uses the service role client (bypasses RLS) because the profiles table
 * has no INSERT policy for the user themselves — inserts only come from
 * the webhook / this self-heal.
 *
 * History: this function also used to mirror each of Clerk's verified
 * external_accounts into a public.verifications table for trust badges.
 * That table was dropped in 0009_profile_schema_cleanup — we weren't
 * doing useful work with the rows. The Clerk session still carries all
 * the OAuth info if we want to display "signed in via X" live.
 */
export async function syncClerkUserToSupabase(userId: string): Promise<void> {
  const user = await currentUser();
  if (!user || user.id !== userId) return;

  const supabase = createSupabaseServiceClient();

  // Diagnostic log — surfaces in server terminal + Sentry breadcrumbs.
  // Triggered once per authenticated page load, so volume is bounded.
  // eslint-disable-next-line no-console
  console.info('[clerk-sync] user', user.id, {
    externalAccountCount: user.externalAccounts?.length ?? 0,
  });

  const primaryEmail =
    user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId && e.verification?.status === 'verified',
    )?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null;

  const displayName =
    [user.firstName, user.lastName?.[0] ? `${user.lastName[0]}.` : null]
      .filter(Boolean)
      .join(' ')
      .trim() || (primaryEmail ? primaryEmail.split('@')[0] : null);

  // Insert the profile once; never overwrite once it exists (onboarding
  // owns user-editable fields after creation).
  await supabase
    .from('profiles')
    .insert({
      id: user.id,
      role: 'companion',
      display_name: displayName,
      photo_url: user.imageUrl ?? null,
      email: primaryEmail,
      languages: ['English'],
      primary_language: 'English',
    })
    .then(
      () => undefined,
      () => undefined, // ignore duplicate-key; the profile already exists
    );
}
