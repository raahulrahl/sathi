import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { TripCardData } from '@/components/trip-card';
import { dateWindow } from '@/lib/dates';
import type { RankableTrip } from '@/lib/matching';

// Re-export so existing server callers can keep importing from `lib/search`.
// New callers (client components) should import from `lib/dates` directly.
export { dateWindow };

/**
 * Server-side search helpers. Extracted from `app/search/page.tsx` so the
 * page file can stay focused on the route shape + rendering, and so the
 * peek widget / any future search surface can share the same primitives.
 */

// A ±1 day window around the user's chosen date. The previous ±3 days
// was too wide: same-route-different-day isn't "same plane" — it's a
// different flight. Keeping this tight reduces false positives.
export const DEFAULT_DATE_WINDOW_DAYS = 1;

/** User-identifying + language info, used for role-aware CTAs and
 * in-card bolding of shared languages. */
export interface ViewerProfile {
  role: 'family' | 'companion' | null;
  languages: string[];
  primaryLanguage: string | null;
}

/**
 * Fetch the three bits of viewer context we need for search: their role
 * (drives the FlightComposer's offer-mode submit target), their languages
 * (used to bold shared tokens on result cards), and their primary
 * language (ranking input).
 *
 * Returns defaults when `userId` is null or the profile row isn't
 * hydrated yet — both are legitimate states during a first anonymous
 * visit or right after sign-up before the self-heal fires.
 */
export async function fetchViewerProfile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string | null,
): Promise<ViewerProfile> {
  if (!userId) return { role: null, languages: [], primaryLanguage: null };
  // profiles + profile_languages are two tables post-0011. Parallel
  // queries — they're independent and the viewer-profile fetch sits on
  // the search page's critical path, so we don't want a serial round-trip.
  const [{ data: profile }, { data: langs }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', userId).maybeSingle(),
    supabase.from('profile_languages').select('language, is_primary').eq('profile_id', userId),
  ]);
  if (!profile) return { role: null, languages: [], primaryLanguage: null };
  const role =
    profile.role === 'family' || profile.role === 'companion'
      ? (profile.role as 'family' | 'companion')
      : null;
  const rows = langs ?? [];
  return {
    role,
    languages: rows.map((r) => r.language),
    primaryLanguage: rows.find((r) => r.is_primary)?.language ?? null,
  };
}

export interface TripQueryParams {
  from: string;
  to: string;
  /** ISO YYYY-MM-DD. Always applied — a ±dateWindowDays window. */
  date: string;
  flightNumbers: string[];
  dateWindowDays?: number;
}

/**
 * Find trips worth showing to a searcher looking for help on a leg
 * from `from` to `to` around `date`.
 *
 * Matching runs on `trip_legs` (added in migration 0016) in two steps:
 *
 *   1. SQL narrows the candidate set to trips whose legs overlap the
 *      searcher's implied leg — same (flight_number, date) where
 *      provided, else any leg with origin=from OR destination=to within
 *      ±dateWindowDays. This surfaces partial-leg helpers that the
 *      previous `contains(route, [from]) AND contains(route, [to])`
 *      filter silently dropped (bug 02).
 *   2. `lib/matching.ts::scoreTrip` does the final ranking in-memory
 *      using route / language / review signals.
 *
 * Always filters to status='open'. The date window applies to both
 * modes — flight numbers alone don't disambiguate, since QR540 is a
 * daily flight with a different airframe each day (bug 04).
 */
export async function fetchTripsForSearch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  params: TripQueryParams,
) {
  const windowDays = params.dateWindowDays ?? DEFAULT_DATE_WINDOW_DAYS;
  const { start, end } = dateWindow(params.date, windowDays);

  // ── Step 1. Gather candidate trip_ids from trip_legs. ──────────────
  const candidateIds = new Set<string>();

  if (params.flightNumbers.length > 0) {
    const { data: flightHits } = await supabase
      .from('trip_legs')
      .select('trip_id')
      .in('flight_number', params.flightNumbers)
      .gte('travel_date', start)
      .lte('travel_date', end);
    for (const row of flightHits ?? []) candidateIds.add(row.trip_id);
  }

  // origin=from OR destination=to — covers end-to-end matches AND
  // partial-leg helpers (a companion on just the DOH→AMS leg of a
  // CCU→DOH→AMS request shows up via destination=AMS).
  const { data: odHits } = await supabase
    .from('trip_legs')
    .select('trip_id')
    .or(`origin.eq.${params.from},destination.eq.${params.to}`)
    .gte('travel_date', start)
    .lte('travel_date', end);
  for (const row of odHits ?? []) candidateIds.add(row.trip_id);

  // No candidates? Return a Supabase-shaped empty result so callers
  // that destructure `{ data, error }` keep working.
  if (candidateIds.size === 0) {
    return { data: [] as unknown[], error: null } as Awaited<ReturnType<typeof buildTripSelect>>;
  }

  // ── Step 2. Fetch the candidate trips with full display columns. ───
  return buildTripSelect(supabase, Array.from(candidateIds));
}

function buildTripSelect(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  tripIds: string[],
) {
  return supabase
    .from('public_trips')
    .select(
      `id, user_id, kind, route, travel_date, airline, flight_numbers,
       languages, gender_preference, help_categories, thank_you_eur, notes,
       status, traveller_age_bands, traveller_count, created_at`,
    )
    .in('id', tripIds)
    .eq('status', 'open');
}

/** Minimal profile shape needed to render a trip card. */
export interface TripPosterProfile {
  display_name: string | null;
  photo_url: string | null;
  primary_language: string;
}

/**
 * Attach poster-profile context to each trip so it can render as a
 * TripCard. Does a single batched `in()` query instead of N profile
 * lookups — important when a search returns dozens of trips from
 * different users.
 *
 * Returns the trips as `RankableTrip` rows with a `.card` property
 * ready for `<TripCard>`, plus a `.kind` discriminant for splitting
 * requests vs offers in the UI.
 */
export async function enrichTripsWithProfiles(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trips: readonly any[],
): Promise<Array<RankableTrip & { kind: 'request' | 'offer'; card: TripCardData }>> {
  const userIds = Array.from(new Set(trips.map((tr) => tr.user_id)));
  const profilesById = new Map<string, TripPosterProfile>();

  if (userIds.length > 0) {
    const { data: ps } = await supabase
      .from('public_profiles')
      .select('id, display_name, photo_url, primary_language')
      .in('id', userIds);
    (ps ?? []).forEach((p) =>
      profilesById.set(p.id, {
        display_name: p.display_name,
        photo_url: p.photo_url,
        primary_language: p.primary_language,
      }),
    );
  }

  return trips.map((tr) => {
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
      traveller_age_bands: tr.traveller_age_bands ?? [],
      traveller_count: tr.traveller_count ?? 0,
      help_categories: tr.help_categories,
      thank_you_eur: tr.thank_you_eur,
      airline: tr.airline,
      flight_numbers: tr.flight_numbers ?? null,
    };
    return {
      id: tr.id,
      user_id: tr.user_id,
      route: tr.route,
      travel_date: tr.travel_date,
      languages: tr.languages,
      primary_language: p?.primary_language ?? null,
      flight_numbers: tr.flight_numbers ?? null,
      kind: tr.kind,
      card,
    };
  });
}
