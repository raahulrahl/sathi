import 'server-only';

import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { dateWindow } from '@/lib/dates';

/**
 * Auto-match: after a trip is created, find existing open trips that
 * could be a match and return them so we can notify those users.
 *
 * Matching runs on `trip_legs` (added in migration 0016) — one row per
 * consecutive airport pair in a trip's route. For each leg of the new
 * trip, we look for overlapping legs on other open trips of the
 * opposite kind:
 *
 *   1. Same (flight_number, travel_date) — strongest signal; same
 *      physical aircraft on the same day.
 *   2. Same (origin, destination, travel_date ± 1 day) — same directed
 *      route leg on the same day (± a day to cover redeyes and TZ fuzz).
 *
 * Anything else (partial endpoint overlap, same city different plane,
 * etc.) does not auto-notify — too noisy. Those still surface on the
 * search page where the user is actively browsing.
 *
 * Uses the service-role client because we need to read across all users'
 * trips, not just the poster's.
 */

const DATE_WINDOW_DAYS = 1;

export interface NewTripInfo {
  id: string;
  user_id: string;
  kind: 'request' | 'offer';
  route: string[];
  travel_date: string;
  flight_numbers: string[];
  languages: string[];
}

export interface MatchedTrip {
  id: string;
  user_id: string;
  kind: 'request' | 'offer';
  route: string[];
  travel_date: string;
  flight_numbers: string[] | null;
}

/** Build the (origin, destination, flight_number) legs for a new trip. */
function newTripLegs(trip: NewTripInfo): Array<{
  origin: string;
  destination: string;
  flight_number: string | null;
}> {
  const legs: ReturnType<typeof newTripLegs> = [];
  for (let i = 0; i < trip.route.length - 1; i++) {
    legs.push({
      origin: trip.route[i]!,
      destination: trip.route[i + 1]!,
      flight_number: trip.flight_numbers[i] ?? null,
    });
  }
  return legs;
}

export async function findMatchingTrips(newTrip: NewTripInfo): Promise<MatchedTrip[]> {
  const supabase = createSupabaseServiceClient();
  const oppositeKind = newTrip.kind === 'request' ? 'offer' : 'request';

  const legs = newTripLegs(newTrip);
  if (legs.length === 0) return [];

  const { start, end } = dateWindow(newTrip.travel_date, DATE_WINDOW_DAYS);

  // Collect candidate trip_ids from trip_legs. We issue two queries per
  // new trip — one for flight-number matches, one for (o,d,date) matches —
  // and union the ids in memory. Postgres' OR-of-index-conditions path
  // is finicky with partial indexes; two explicit queries are cheaper
  // and easier to reason about than trying to coax the planner.
  const flightNumbers = legs.map((l) => l.flight_number).filter((fn): fn is string => !!fn);

  const candidateIds = new Set<string>();

  if (flightNumbers.length > 0) {
    const { data: flightHits, error } = await supabase
      .from('trip_legs')
      .select('trip_id')
      .in('flight_number', flightNumbers)
      .gte('travel_date', start)
      .lte('travel_date', end);
    if (error) {
      console.error('[auto-match] flight-leg query failed:', error.message);
    } else {
      for (const row of flightHits ?? []) candidateIds.add(row.trip_id);
    }
  }

  // (origin, destination, date) matches — issued as a single query using
  // an OR of per-leg predicates. Fewer round-trips than one-per-leg, and
  // each OR branch resolves to trip_legs_od_date_idx.
  const odClauses = legs
    .map((l) => `and(origin.eq.${l.origin},destination.eq.${l.destination})`)
    .join(',');

  const { data: odHits, error: odError } = await supabase
    .from('trip_legs')
    .select('trip_id')
    .or(odClauses)
    .gte('travel_date', start)
    .lte('travel_date', end);
  if (odError) {
    console.error('[auto-match] od-leg query failed:', odError.message);
  } else {
    for (const row of odHits ?? []) candidateIds.add(row.trip_id);
  }

  if (candidateIds.size === 0) return [];

  // Fetch the candidate trips themselves, filtered down to opposite kind,
  // open status, not-self. Belt-and-suspenders — the leg match already
  // scoped by date, but we still need to exclude closed / own trips.
  const { data, error } = await supabase
    .from('trips')
    .select('id, user_id, kind, route, travel_date, flight_numbers')
    .in('id', Array.from(candidateIds))
    .eq('status', 'open')
    .eq('kind', oppositeKind)
    .neq('user_id', newTrip.user_id);

  if (error) {
    console.error('[auto-match] trip fetch failed:', error.message);
    return [];
  }

  console.log(`[auto-match] found ${data?.length ?? 0} matching trips for ${newTrip.id}`);
  return (data ?? []) as MatchedTrip[];
}
