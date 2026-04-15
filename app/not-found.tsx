import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">404</p>
      <h1 className="font-serif text-4xl">We couldn't find that.</h1>
      <p className="max-w-sm text-muted-foreground">
        The trip or profile you're looking for may have been removed or never existed.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/">Back home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/browse">Browse trips</Link>
        </Button>
      </div>
    </div>
  );
}
