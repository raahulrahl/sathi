import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function SiteHeader() {
  let loggedIn = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    loggedIn = !!data.user;
  } catch {
    loggedIn = false;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-2xl font-semibold tracking-tight">Sathi</span>
          <span className="hidden font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground sm:inline">
            साथी
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/search" className="text-muted-foreground hover:text-foreground">
            Browse
          </Link>
          <Link href="/trust" className="text-muted-foreground hover:text-foreground">
            Trust
          </Link>
          <Link href="/about" className="text-muted-foreground hover:text-foreground">
            About
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {loggedIn ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/post/request">Post a trip</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/sign-in?next=/post/request">Post a trip</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
