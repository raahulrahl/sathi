'use client';

import dynamic from 'next/dynamic';

/**
 * Thin client wrapper around FlightGlobe that handles the dynamic import.
 * Server Components can't call next/dynamic (it's a client-side API),
 * so the home page renders this wrapper and passes the route data down.
 */
const FlightGlobe = dynamic(() => import('@/components/flight-globe').then((m) => m.FlightGlobe), {
  ssr: false,
  loading: () => (
    <div className="aspect-square w-full max-w-[440px] animate-pulse rounded-full bg-oat/20" />
  ),
});

interface WorldGlobeClientProps {
  routes: string[][];
}

export function WorldGlobeClient({ routes }: WorldGlobeClientProps) {
  return <FlightGlobe routes={routes} autoRotate className="mx-auto w-full max-w-[440px]" />;
}
