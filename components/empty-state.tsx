import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Empty-state block used in place of results when a list has zero rows.
 * Shows an optional icon, a headline, a description, and optionally a
 * single CTA link. Used by the dashboard tabs, search results columns,
 * and the landing page.
 */
export function EmptyState({
  title,
  description,
  cta,
  href,
  icon: Icon,
  className,
}: {
  title: string;
  description: string;
  cta?: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-lg border border-dashed px-6 py-14 text-center',
        className,
      )}
    >
      {Icon ? <Icon className="mb-4 size-10 text-muted-foreground" aria-hidden /> : null}
      <h3 className="font-serif text-xl">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {cta && href ? (
        <Button asChild className="mt-6">
          <Link href={href}>{cta}</Link>
        </Button>
      ) : null}
    </div>
  );
}
