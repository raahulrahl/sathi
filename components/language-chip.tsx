import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LanguageChipProps {
  language: string;
  matched?: boolean;
  primary?: boolean;
  className?: string;
}

/**
 * Language pill. When a language matches the viewer's, it's rendered bold
 * and in the warm palette — per Product Spec §3.5, the matched language is
 * bolded inside the card.
 */
export function LanguageChip({
  language,
  matched = false,
  primary = false,
  className,
}: LanguageChipProps) {
  return (
    <Badge
      variant={matched ? 'default' : 'secondary'}
      className={cn(
        'rounded-full font-normal',
        matched && 'bg-saffron-600 font-semibold text-saffron-50 hover:bg-saffron-700',
        primary && matched && 'ring-2 ring-saffron-300 ring-offset-1',
        !matched && 'bg-secondary',
        className,
      )}
    >
      {language}
      {primary && (
        <span className="ml-1 text-[10px] uppercase tracking-wide opacity-70">primary</span>
      )}
    </Badge>
  );
}

export function LanguageChipRow({
  languages,
  primary,
  viewerLanguages = [],
}: {
  languages: string[];
  primary?: string | null;
  viewerLanguages?: string[];
}) {
  const vset = new Set(viewerLanguages.map((l) => l.toLowerCase()));
  return (
    <div className="flex flex-wrap gap-1.5">
      {languages.map((l) => (
        <LanguageChip
          key={l}
          language={l}
          matched={vset.has(l.toLowerCase())}
          primary={!!primary && primary.toLowerCase() === l.toLowerCase()}
        />
      ))}
    </div>
  );
}
