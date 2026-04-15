'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { PostWizard, type FlightLookupResult } from '../post-wizard';
import type { TripInput } from '../actions';
import { AIRPORTS } from '@/lib/iata';
import { FlightTimeline } from '@/components/flight-timeline';

// Dynamic import so WebGL never blocks the initial page render.
const FlightGlobe = dynamic(() => import('@/components/flight-globe').then((m) => m.FlightGlobe), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-square items-center justify-center">
      <span className="text-xs text-muted-foreground">Loading globe…</span>
    </div>
  ),
});

interface OfferPageClientProps {
  profileLanguages: string[];
  defaults?: Partial<TripInput> | undefined;
}

// IATA → city lookup, built once
const CITY_BY_IATA = new Map(AIRPORTS.map((a) => [a.iata, a.city]));

export function OfferPageClient({ profileLanguages, defaults }: OfferPageClientProps) {
  const [route, setRoute] = useState<string[]>(
    (defaults?.route ?? []).filter((x) => x.length === 3),
  );
  // Flight details keyed by leg index — populated by PostWizard on successful lookup.
  const [flightDetails, setFlightDetails] = useState<Record<number, FlightLookupResult>>({});

  const handleRouteChange = useCallback((r: string[]) => {
    setRoute(r.filter((x) => x.length === 3));
  }, []);

  const handleFlightLookup = useCallback((legIndex: number, detail: FlightLookupResult) => {
    setFlightDetails((prev) => ({ ...prev, [legIndex]: detail }));
  }, []);

  const hasRoute = route.length >= 2;
  const legCount = Math.max(route.length - 1, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      {/* Form column */}
      <div className="rounded-3xl border border-oat bg-card p-6 shadow-clay md:p-8">
        <PostWizard
          kind="offer"
          profileLanguages={profileLanguages}
          defaults={defaults}
          onRouteChange={handleRouteChange}
          onFlightLookup={handleFlightLookup}
        />
      </div>

      {/* Sticky sidebar: globe + route summary + timeline */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-3">
          {/* Globe */}
          <div className="overflow-hidden rounded-3xl border border-oat bg-gradient-to-b from-cream to-oat-light/30 p-3 shadow-clay">
            <FlightGlobe route={route} className="mx-auto w-full max-w-[280px]" />
          </div>

          {/* Route summary — only when we have a route */}
          {hasRoute && (
            <div className="rounded-2xl border border-oat bg-card px-4 py-3">
              <div className="flex items-center justify-center gap-1.5 font-mono text-sm font-semibold">
                {route.map((code, i) => (
                  <span key={`${code}-${i}`} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-muted-foreground">→</span>}
                    <span>{code}</span>
                  </span>
                ))}
              </div>
              <ol className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                {route.map((code, i) => (
                  <li key={`${code}-${i}`} className="flex items-center gap-2">
                    <span className="inline-flex size-3.5 items-center justify-center rounded-full bg-matcha-300/40 font-mono text-[9px] text-matcha-800">
                      {i + 1}
                    </span>
                    <span className="font-mono">{code}</span>
                    <span>{CITY_BY_IATA.get(code) ?? ''}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Timeline — shows once a flight number resolves */}
          <FlightTimeline details={flightDetails} legCount={legCount} />
        </div>
      </aside>

      {/* Mobile: show globe + timeline below the form */}
      {hasRoute && (
        <div className="space-y-3 lg:hidden">
          <div className="rounded-3xl border border-oat bg-gradient-to-b from-cream to-oat-light/30 p-3">
            <FlightGlobe route={route} className="mx-auto w-full max-w-[240px]" />
            <p className="mt-2 text-center font-mono text-sm font-semibold">{route.join(' → ')}</p>
          </div>
          <FlightTimeline details={flightDetails} legCount={legCount} />
        </div>
      )}
    </div>
  );
}
