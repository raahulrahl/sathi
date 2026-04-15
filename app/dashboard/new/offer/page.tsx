import type { Metadata } from 'next';
import { requireUserId } from '@/lib/auth-guard';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TripPostClient } from '@/components/trip-post-client';

export const metadata: Metadata = { title: 'New offer' };

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; date?: string }>;
}

export default async function NewOfferPage({ searchParams }: PageProps) {
  const { from = '', to = '', date = '' } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const userId = await requireUserId('/dashboard/new/offer');

  const { data: langs } = await supabase
    .from('profile_languages')
    .select('language, is_primary')
    .eq('profile_id', userId)
    .order('is_primary', { ascending: false })
    .order('language', { ascending: true });

  return (
    <div className="container max-w-6xl py-10">
      <header className="mb-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-matcha-600">New offer</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight md:text-5xl">
          You&rsquo;re already flying there.{' '}
          <span className="text-marigold-700">Why not help someone?</span>
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          A family somewhere is quietly hoping someone like you posts. Tell us your route and
          we&rsquo;ll handle the rest.
        </p>
      </header>

      <TripPostClient
        kind="offer"
        profileLanguages={(langs ?? []).map((l) => l.language)}
        defaults={{
          ...(from && to ? { route: [from.toUpperCase(), to.toUpperCase()] } : {}),
          ...(date ? { travel_date: date } : {}),
        }}
      />
    </div>
  );
}
