'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/nextjs';
import { useMemo } from 'react';

/**
 * Browser-side Supabase client that signs every request with Clerk's
 * Supabase-template JWT. Intended to be called from a React component;
 * the returned client will be invalidated when Clerk's token rotates
 * because the hook's dependency array includes `getToken`.
 */
export function useSupabaseBrowserClient(): SupabaseClient {
  const { getToken } = useAuth();

  return useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      {
        global: {
          // fetch override so every call goes through Clerk's token.
          fetch: async (url, options: RequestInit = {}) => {
            const token = await getToken({ template: 'supabase' });
            const headers = new Headers(options.headers);
            if (token) headers.set('Authorization', `Bearer ${token}`);
            return fetch(url, { ...options, headers });
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }, [getToken]);
}
