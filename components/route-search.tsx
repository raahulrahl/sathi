'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowRight, Calendar, Search } from 'lucide-react';
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
}

export function RouteSearch({
  className,
  defaultFrom = '',
  defaultTo = '',
  defaultDate,
}: RouteSearchProps) {
  const router = useRouter();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [date, setDate] = useState(defaultDate ?? format(new Date(), 'yyyy-MM-dd'));
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    const params = new URLSearchParams({ from: f, to: t, date });
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        'grid grid-cols-1 gap-3 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-[1fr_auto_1fr_auto_auto]',
        className,
      )}
    >
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
      {error ? (
        <p className="col-span-full text-sm text-destructive" role="alert">
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
