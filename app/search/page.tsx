import { auth } from '@clerk/nextjs/server';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Calendar, Compass } from 'lucide-react';
import { RouteSearch } from '@/components/route-search';
import { TripCard, type TripCardData } from '@/components/trip-card';
import { EmptyState } from '@/components/empty-state';
import { Separator } from '@/components/ui/separator';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rankTrips, type RankableTrip, type Scored } from '@/lib/matching';
import { isValidIata, formatAirport } from '@/lib/iata';

export const metadata: Metadata = {
  title: 'Browse trips',
  description: 'Find people already flying your route.',
};

// Always fresh — search is timely by nature and ranking depends on the request.
export const dynamic = 'force-dynamic';

interface SearchPageProps {
  searchParams: Promise<{ from?: string; to?: string; date?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { from = '', to = '', date = '' } = await searchParams;
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  const validInput = isValidIata(f) && isValidIata(t) && !!date;

  return (
    <div className="container py-8">
      <div className="space-y-1">
        <h1 className="font-serif text-3xl">Who's on this route?</h1>
        <p className="text-sm text-muted-foreground">
          Results cover ±3 days. Language match first, then date proximity.
        </p>
      </div>

      <RouteSearch
        className="mt-6"
        defaultFrom={f}
        defaultTo={t}
        {...(date ? { defaultDate: date } : {})}
      />

      {!validInput ? (
        <EmptyState
          className="mt-10"
          icon={Compass}
          title="Search to see who's flying"
          description="Enter an origin, destination, and date above."
        />
      ) : (
        <Suspense fallback={<div className="mt-10 text-sm text-muted-foreground">Loading…</div>}>
          <Results from={f} to={t} date={date} />
        </Suspense>
      )}
    </div>
  );
}

async function Results({ from, to, date }: { from: string; to: string; date: string }) {
  const supabase = await createSupabaseServerClient();

  // Authed viewer's languages used for in-card bolding.
  let viewerLanguages: string[] = [];
  let viewerPrimary: string | null = null;
  const { userId } = await auth();
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('languages, primary_language')
      .eq('id', userId)
      .maybeSingle();
    if (profile) {
      viewerLanguages = profile.languages ?? [];
      viewerPrimary = profile.primary_language;
    }
  }

  // Date window ±3 days. We fetch a slightly wider window and filter+rank in TS.
  const { start, end } = dateWindow(date, 3);

  // Pull the public_trips view + verified count, filtered to routes that
  // include both endpoints at any position (we further filter in TS via
  // routeMatch). Keep it fast with a date range.
  const { data: trips, error } = await supabase
    .from('public_trips')
    .select(
      `id, user_id, kind, route, travel_date, airline, languages,
       gender_preference, help_categories, thank_you_eur, notes, status,
       elderly_age_band, created_at`,
    )
    .eq('status', 'open')
    .gte('travel_date', start)
    .lte('travel_date', end)
    .contains('route', [from])
    .contains('route', [to]);

  if (error) {
    return (
      <div className="mt-10 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        Couldn't load trips: {error.message}
      </div>
    );
  }

  // Join profile bits for the card (display_name, photo, primary language,
  // verified count). Single round-trip via in() on the unique user_ids.
  const userIds = Array.from(new Set(trips?.map((tr) => tr.user_id) ?? []));
  const profilesById = new Map<
    string,
    {
      display_name: string | null;
      photo_url: string | null;
      primary_language: string;
      verified_channel_count: number;
    }
  >();
  if (userIds.length > 0) {
    const { data: ps } = await supabase
      .from('public_profiles')
      .select('id, display_name, photo_url, primary_language, verified_channel_count')
      .in('id', userIds);
    (ps ?? []).forEach((p) =>
      profilesById.set(p.id, {
        display_name: p.display_name,
        photo_url: p.photo_url,
        primary_language: p.primary_language,
        verified_channel_count: p.verified_channel_count,
      }),
    );
  }

  const enriched: (RankableTrip & { kind: 'request' | 'offer'; card: TripCardData })[] = (
    trips ?? []
  ).map((tr) => {
    const p = profilesById.get(tr.user_id);
    const card: TripCardData = {
      id: tr.id,
      kind: tr.kind,
      display_name: p?.display_name ?? 'Anonymous',
      photo_url: p?.photo_url ?? null,
      languages: tr.languages,
      primary_language: p?.primary_language ?? null,
      route: tr.route,
      travel_date: tr.travel_date,
      elderly_age_band: tr.elderly_age_band,
      help_categories: tr.help_categories,
      thank_you_eur: tr.thank_you_eur,
      airline: tr.airline,
      verified_channel_count: p?.verified_channel_count ?? 0,
    };
    return {
      id: tr.id,
      user_id: tr.user_id,
      route: tr.route,
      travel_date: tr.travel_date,
      languages: tr.languages,
      primary_language: p?.primary_language ?? null,
      verified_channel_count: p?.verified_channel_count ?? 0,
      kind: tr.kind,
      card,
    };
  });

  const ranked = rankTrips(enriched, {
    origin: from,
    destination: to,
    date,
    dateWindowDays: 3,
    viewerLanguages,
    viewerPrimaryLanguage: viewerPrimary,
  });

  const requests = ranked.filter((r) => (r.trip as (typeof enriched)[number]).kind === 'request');
  const offers = ranked.filter((r) => (r.trip as (typeof enriched)[number]).kind === 'offer');

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="size-4" />
          ±3 days around {date}
        </span>
        <Separator orientation="vertical" className="h-4" />
        <span>
          {formatAirport(from)} → {formatAirport(to)}
        </span>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <Column
          label="Families looking for a companion"
          emptyTitle="No open requests here yet"
          emptyBody="Be the first to post on this route — parents are always looking."
          cta="Post a request"
          ctaHref={`/post/request?from=${from}&to=${to}&date=${date}`}
          items={requests}
          viewerLanguages={viewerLanguages}
        />
        <Column
          label="Travellers offering to help"
          emptyTitle="No companions posted yet"
          emptyBody="If you're flying this route, post an offer — it's the single most useful thing you can do."
          cta="Offer to help"
          ctaHref={`/post/offer?from=${from}&to=${to}&date=${date}`}
          items={offers}
          viewerLanguages={viewerLanguages}
        />
      </div>
    </>
  );
}

function Column<T extends RankableTrip & { card: TripCardData }>({
  label,
  emptyTitle,
  emptyBody,
  cta,
  ctaHref,
  items,
  viewerLanguages,
}: {
  label: string;
  emptyTitle: string;
  emptyBody: string;
  cta: string;
  ctaHref: string;
  items: Scored<T>[];
  viewerLanguages: string[];
}) {
  return (
    <section>
      <h2 className="font-serif text-2xl">{label}</h2>
      <p className="text-sm text-muted-foreground">
        {items.length} match{items.length === 1 ? '' : 'es'}
      </p>
      <div className="mt-4 space-y-4">
        {items.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyBody} cta={cta} href={ctaHref} />
        ) : (
          items.map((s) => (
            <TripCard
              key={s.trip.id}
              data={s.trip.card}
              viewerLanguages={viewerLanguages}
              scored={s}
            />
          ))
        )}
      </div>
    </section>
  );
}

function dateWindow(centre: string, days: number) {
  const c = new Date(`${centre}T00:00:00Z`);
  const ms = days * 86_400_000;
  const start = new Date(c.getTime() - ms).toISOString().slice(0, 10);
  const end = new Date(c.getTime() + ms).toISOString().slice(0, 10);
  return { start, end };
}
