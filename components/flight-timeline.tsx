'use client';

import { Fragment } from 'react';
import { Plane } from 'lucide-react';
import type { FlightLookupResult } from '@/app/post/post-wizard';

interface FlightTimelineProps {
  /**
   * Looked-up flight details keyed by leg index (0 = first leg).
   * Gaps are allowed — the timeline shows only consecutive known legs.
   */
  details: Record<number, FlightLookupResult>;
  /** Total number of legs the user has added (for "missing leg" placeholders). */
  legCount: number;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

function layoverDuration(arrival: string, nextDeparture: string): string {
  const diffMs = new Date(nextDeparture).getTime() - new Date(arrival).getTime();
  if (diffMs <= 0) return '';
  const h = Math.floor(diffMs / 3_600_000);
  const m = Math.floor((diffMs % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export function FlightTimeline({ details, legCount }: FlightTimelineProps) {
  // Collect consecutive details starting at leg 0
  const legs: FlightLookupResult[] = [];
  for (let i = 0; i < legCount; i++) {
    const d = details[i];
    if (!d) break;
    legs.push(d);
  }

  if (legs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-oat bg-card/60 px-4 py-5 text-center">
        <p className="text-xs text-muted-foreground">Enter a flight number to see the timeline</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-oat bg-card px-4 py-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Timeline
      </p>
      <ol className="relative">
        {legs.map((leg, i) => (
          <Fragment key={i}>
            {/* Departure point */}
            <TimelineStop
              time={formatTime(leg.departure)}
              date={formatDate(leg.departure)}
              iata={leg.from.iata}
              label={i === 0 ? 'Departure' : undefined}
            />
            {/* In-flight connector */}
            <TimelineConnector primary={`${leg.flightNumber}`} secondary={leg.duration} inFlight />
            {/* Arrival point */}
            <TimelineStop
              time={formatTime(leg.arrival)}
              date={formatDate(leg.arrival)}
              iata={leg.to.iata}
              label={i === legs.length - 1 ? 'Arrival' : undefined}
            />
            {/* Layover (between legs) */}
            {i < legs.length - 1 && (
              <TimelineConnector
                primary="Layover"
                secondary={layoverDuration(leg.arrival, legs[i + 1]!.departure)}
              />
            )}
          </Fragment>
        ))}
      </ol>
    </div>
  );
}

// ── Timeline atoms ──────────────────────────────────────────────────────

function TimelineStop({
  time,
  date,
  iata,
  label,
}: {
  time: string;
  date: string;
  iata: string;
  label?: string | undefined;
}) {
  return (
    <li className="relative flex gap-3 pl-6">
      {/* Dot */}
      <span
        aria-hidden
        className="absolute left-0 top-1.5 size-3 rounded-full border-2 border-matcha-600 bg-background"
      />
      <div className="min-w-0 flex-1 pb-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-semibold tabular-nums">{time}</span>
          <span className="text-[11px] text-muted-foreground">{date}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-mono font-semibold text-warm-charcoal">{iata}</span>
          {label && (
            <span className="rounded bg-matcha-300/30 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-matcha-800">
              {label}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function TimelineConnector({
  primary,
  secondary,
  inFlight,
}: {
  primary: string;
  secondary: string;
  inFlight?: boolean;
}) {
  return (
    <li className="relative flex gap-3 pl-6">
      {/* Dotted vertical line */}
      <span
        aria-hidden
        className="absolute bottom-0 left-[5px] top-0 w-px border-l border-dashed border-oat-dark"
      />
      <div className="flex items-center gap-1.5 py-1.5 text-[11px] text-muted-foreground">
        {inFlight && <Plane className="size-3 -rotate-45" aria-hidden />}
        <span className="font-mono font-medium">{primary}</span>
        <span>·</span>
        <span>{secondary}</span>
      </div>
    </li>
  );
}
