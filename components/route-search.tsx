'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowRight, Calendar, Plane, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isValidIata, searchAirports, type Airport } from '@/lib/iata';
import { cn } from '@/lib/utils';

interface RouteSearchProps {
  className?: string;
  defaultFrom?: string;
  defaultTo?: string;
  defaultDate?: string;
  defaultFlightNumbers?: string[];
}

/** Normalise a raw flight-number entry: uppercase, whitespace stripped. */
function normaliseFlight(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function RouteSearch({
  className,
  defaultFrom = '',
  defaultTo = '',
  defaultDate,
  defaultFlightNumbers = [],
}: RouteSearchProps) {
  const router = useRouter();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [date, setDate] = useState(defaultDate ?? format(new Date(), 'yyyy-MM-dd'));
  const [flights, setFlights] = useState<string[]>(defaultFlightNumbers);
  const [flightDraft, setFlightDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  function addFlight(raw: string) {
    const fn = normaliseFlight(raw);
    if (!fn) return;
    setFlights((prev) => (prev.includes(fn) ? prev : [...prev, fn]));
    setFlightDraft('');
  }

  function removeFlight(fn: string) {
    setFlights((prev) => prev.filter((x) => x !== fn));
  }

  function onFlightKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addFlight(flightDraft);
    } else if (e.key === 'Backspace' && flightDraft === '' && flights.length > 0) {
      // Delete last chip when the user backspaces in an empty input.
      setFlights((prev) => prev.slice(0, -1));
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const f = from.trim().toUpperCase();
    const t = to.trim().toUpperCase();
    if (!isValidIata(f) || !isValidIata(t)) {
      setError('Please pick valid 3-letter airport codes (e.g. CCU, AMS).');
      return;
    }
    if (f === t) {
      setError('Origin and destination cannot be the same.');
      return;
    }
    // Flush any pending draft into the chips list on submit.
    const pending = normaliseFlight(flightDraft);
    const allFlights = pending && !flights.includes(pending) ? [...flights, pending] : flights;

    setError(null);
    const params = new URLSearchParams({ from: f, to: t, date });
    if (allFlights.length > 0) params.set('fn', allFlights.join(','));
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className={cn('space-y-3 rounded-xl border bg-card p-4 shadow-sm', className)}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr_auto_auto]">
        <IataField id="from" label="From" value={from} onChange={setFrom} placeholder="CCU" />
        <div className="hidden items-center justify-center md:flex">
          <ArrowRight className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <IataField id="to" label="To" value={to} onChange={setTo} placeholder="AMS" />
        <div className="space-y-1">
          <Label htmlFor="date">Travel date</Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex flex-col justify-end">
          <Button type="submit" size="lg" className="h-10 md:h-[42px]">
            <Search className="mr-1 size-4" />
            Search
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="flight">
          Flight numbers{' '}
          <span className="text-xs font-normal text-muted-foreground">
            — one per leg. The strongest match. Leave blank to browse the route.
          </span>
        </Label>
        <div
          className={cn(
            'flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5',
            'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          )}
        >
          <Plane className="ml-1 size-4 -rotate-45 text-muted-foreground" aria-hidden />
          {flights.map((fn) => (
            <Badge
              key={fn}
              variant="secondary"
              className="gap-1 rounded-full py-1 pl-2.5 pr-1 font-mono"
            >
              {fn}
              <button
                type="button"
                onClick={() => removeFlight(fn)}
                aria-label={`Remove ${fn}`}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <input
            id="flight"
            value={flightDraft}
            onChange={(e) => setFlightDraft(e.target.value.toUpperCase())}
            onKeyDown={onFlightKeyDown}
            onBlur={() => addFlight(flightDraft)}
            placeholder={flights.length === 0 ? 'QR540, QR23 — press space or enter' : ''}
            className={cn(
              'min-w-[8ch] flex-1 bg-transparent px-1 py-1 font-mono text-sm uppercase tracking-wide outline-none',
              'placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground',
            )}
            autoComplete="off"
            maxLength={10}
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function IataField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [focused, setFocused] = useState(false);
  const suggestions: Airport[] = focused && value.length >= 1 ? searchAirports(value) : [];
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase().slice(0, 3))}
          placeholder={placeholder}
          maxLength={3}
          autoComplete="off"
          className="font-mono uppercase tracking-wider"
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
        />
        {suggestions.length > 0 ? (
          <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md border bg-popover shadow-lg">
            {suggestions.map((a) => (
              <li key={a.iata}>
                <button
                  type="button"
                  onClick={() => onChange(a.iata)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <span className="font-mono font-semibold">{a.iata}</span>
                  <span className="text-muted-foreground">
                    {a.city} · {a.country}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
