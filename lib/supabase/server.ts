import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

/**
 * Server-side Supabase client that trusts Clerk as the auth source.
 *
 * Two supported Clerk ↔ Supabase wirings (Supabase has shipped both over
 * the last year; the right one depends on which one you set up in the
 * Supabase dashboard):
 *
 *   A. **Third-Party Auth integration (newer, recommended)**:
 *      Supabase → Authentication → Third-Party Auth → add Clerk with
 *      your Clerk issuer URL. Supabase fetches Clerk's JWKS and validates
 *      incoming JWTs signed by Clerk's RS256 key. No shared secret. Our
 *      code just forwards `getToken()` (default Clerk session token).
 *
 *   B. **"supabase" JWT template (legacy, HS256)**:
 *      Clerk → JWT Templates → new template named "supabase", signed with
 *      Supabase's JWT Secret. Our code fetches that template-signed token
 *      via `getToken({ template: 'supabase' })`.
 *
 * We try the named template first, fall back to the default session
 * token. Whichever Supabase is configured for, one of them will verify.
 * If both return null, we fall back to the anon key (public views still
 * work without a session).
 *
 * Downstream, regardless of pattern, our RLS policies call
 * `public.clerk_user_id()` (supabase/migrations/0005_clerk.sql), which
 * reads the `sub` claim from whichever token got through.
 */
export async function createSupabaseServerClient() {
  const { getToken } = await auth();

  // Template first (legacy HS256 path). If Clerk doesn't have a "supabase"
  // template configured, getToken returns null — fine, we try the default.
  let clerkToken: string | null = null;
  try {
    clerkToken = await getToken({ template: 'supabase' });
  } catch {
    // template lookup threw — fall through
  }
  // Default session token (RS256). Works with Third-Party Auth.
  if (!clerkToken) {
    try {
      clerkToken = await getToken();
    } catch {
      // no session, or Clerk unreachable
    }
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      global: {
        headers: clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

/**
 * Service-role client. Bypasses RLS entirely — only use from server-side
 * code that needs to create users (webhooks) or run the cron. Never call
 * from a code path that can be reached by a browser.
 */
export function createSupabaseServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
