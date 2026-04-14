import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/40">
      <div className="container grid gap-8 py-10 text-sm md:grid-cols-4">
        <div>
          <div className="font-serif text-xl font-semibold">Sathi</div>
          <p className="mt-2 max-w-xs text-muted-foreground">
            A matchmaking platform for elderly travellers and the solo travellers already flying
            their route. Sathi makes the introduction — nothing more.
          </p>
        </div>
        <nav className="space-y-2">
          <div className="font-medium">Product</div>
          <ul className="space-y-1.5 text-muted-foreground">
            <li>
              <Link href="/search" className="hover:text-foreground">
                Browse trips
              </Link>
            </li>
            <li>
              <Link href="/post/request" className="hover:text-foreground">
                Post a request
              </Link>
            </li>
            <li>
              <Link href="/post/offer" className="hover:text-foreground">
                Offer to help
              </Link>
            </li>
          </ul>
        </nav>
        <nav className="space-y-2">
          <div className="font-medium">Company</div>
          <ul className="space-y-1.5 text-muted-foreground">
            <li>
              <Link href="/about" className="hover:text-foreground">
                About
              </Link>
            </li>
            <li>
              <Link href="/trust" className="hover:text-foreground">
                Trust & safety
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-foreground">
                FAQ
              </Link>
            </li>
          </ul>
        </nav>
        <nav className="space-y-2">
          <div className="font-medium">Legal</div>
          <ul className="space-y-1.5 text-muted-foreground">
            <li>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t">
        <div className="container flex flex-wrap items-center justify-between gap-2 py-4 text-xs text-muted-foreground">
          <p>
            Sathi is an introduction service. You are responsible for your own arrangement, payment,
            and travel.
          </p>
          <p>© {new Date().getFullYear()} Sathi</p>
        </div>
      </div>
    </footer>
  );
}
