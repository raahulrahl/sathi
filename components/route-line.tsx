import { ArrowRight, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { lookupAirport } from '@/lib/iata';

/**
 * Horizontal route display like `CCU → DOH → AMS`. Each segment shows
 * the IATA code (always) plus the city name in muted text (by default).
 * Arrows between segments render at mid-weight so the chain reads as a
 * single unit. Used on trip cards, the match page, and the trip detail
 * page.
 *
 * Set `showCity={false}` for dense listings where only the codes matter
 * (e.g. the search results column headers).
 */
export function RouteLine({
  route,
  className,
  showCity = true,
}: {
  route: string[];
  className?: string;
  showCity?: boolean;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 text-sm', className)}>
      {route.map((code, i) => {
        const a = lookupAirport(code);
        return (
          <span key={`${code}-${i}`} className="flex items-center gap-2">
            <span className="inline-flex flex-col leading-tight">
              <span className="font-mono text-base font-semibold tracking-wide">{code}</span>
              {showCity && a?.city ? (
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {a.city}
                </span>
              ) : null}
            </span>
            {i < route.length - 1 ? (
              i === 0 && route.length === 2 ? (
                <Plane className="size-4 -rotate-45 text-muted-foreground" aria-hidden />
              ) : (
                <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
              )
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
