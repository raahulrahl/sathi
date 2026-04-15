import Link from 'next/link';
import { Github, Mail, Twitter } from 'lucide-react';

/**
 * Site footer. Three-tier structure:
 *   1. Brand block (wordmark + tagline) and "system status" pill with
 *      a pulsing dot, plus social icons. This is the "living" part —
 *      signals the site is alive and linked.
 *   2. Four link columns: Product / Company / Legal / Connect.
 *   3. Bottom bar with the one-line disclaimer and copyright.
 *
 * Server component — no interactivity. Status pill links to /status
 * which shows a real per-component breakdown.
 */

const GITHUB_URL = 'https://github.com/raahulrahl/saathi';
const TWITTER_URL = 'https://twitter.com/getsaathi';
const CONTACT_EMAIL = 'hello@getsaathi.com';
const MAILTO = `mailto:${CONTACT_EMAIL}`;

export function SiteFooter() {
  return (
    <footer className="mt-24 px-4 pb-10">
      <div className="container overflow-hidden rounded-[40px] border border-oat bg-gradient-to-br from-card via-card to-oat-light/30 p-8 shadow-clay md:p-14">
        {/* ── 1. Brand row ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-baseline gap-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              <span className="leading-none" aria-hidden>
                🌼
              </span>
              <span>Saathi</span>
              <span className="text-xl font-normal text-warm-silver">साथी</span>
            </div>
            <p className="mt-3 max-w-md text-sm text-warm-charcoal md:text-base">
              A companion on the flight home. Saathi makes the introduction — nothing more.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 lg:items-end">
            {/* Animated status pill */}
            <Link
              href="/status"
              className="group inline-flex items-center gap-2 rounded-full border border-matcha-300/60 bg-matcha-300/15 px-3 py-1.5 text-xs font-medium text-matcha-800 transition-colors hover:bg-matcha-300/30"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-matcha-600 opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-matcha-600" />
              </span>
              All systems operational
            </Link>

            {/* Social icon row */}
            <div className="flex items-center gap-2">
              <SocialIcon href={GITHUB_URL} label="GitHub" Icon={Github} external />
              <SocialIcon href={TWITTER_URL} label="Twitter / X" Icon={Twitter} external />
              <SocialIcon href={MAILTO} label="Email" Icon={Mail} />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 h-px bg-oat" />

        {/* ── 2. Link columns ──────────────────────────────────────── */}
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <FooterColumn title="Product">
            <FooterLink href="/search">Browse trips</FooterLink>
            <FooterLink href="/post/request">Post a request</FooterLink>
            <FooterLink href="/post/offer">Offer to help</FooterLink>
          </FooterColumn>

          <FooterColumn title="Company">
            <FooterLink href="/about">About &amp; trust</FooterLink>
            <FooterLink href="/faq">FAQ</FooterLink>
            <FooterLink href="/status">System status</FooterLink>
          </FooterColumn>

          <FooterColumn title="Legal">
            <FooterLink href="/terms">Terms of service</FooterLink>
            <FooterLink href="/privacy">Privacy policy</FooterLink>
            <FooterLink href="/cookie-policy">Cookie policy</FooterLink>
          </FooterColumn>

          <FooterColumn title="Connect">
            <FooterLink href={MAILTO}>Contact</FooterLink>
            <FooterLink href={GITHUB_URL} external>
              GitHub
            </FooterLink>
            <FooterLink href={TWITTER_URL} external>
              Twitter / X
            </FooterLink>
          </FooterColumn>
        </div>

        {/* ── 3. Bottom bar ────────────────────────────────────────── */}
        <div className="mt-12 flex flex-col gap-3 border-t border-dashed border-oat pt-6 text-[11px] text-warm-silver md:flex-row md:items-center md:justify-between">
          <p>
            Saathi is an introduction service. You are responsible for your own arrangement,
            payment, and travel.
          </p>
          <p>© {new Date().getFullYear()} Saathi · Made for families · Open source</p>
        </div>
      </div>
    </footer>
  );
}

// ── Footer atoms ───────────────────────────────────────────────────────

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="clay-label">{title}</div>
      <ul className="space-y-2 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const className =
    'text-warm-charcoal transition-colors hover:text-foreground hover:underline underline-offset-4';
  return (
    <li>
      {external ? (
        <a href={href} target="_blank" rel="noreferrer" className={className}>
          {children}
        </a>
      ) : (
        <Link href={href as '/'} className={className}>
          {children}
        </Link>
      )}
    </li>
  );
}

function SocialIcon({
  href,
  label,
  Icon,
  external,
}: {
  href: string;
  label: string;
  Icon: typeof Github;
  external?: boolean;
}) {
  const common = {
    'aria-label': label,
    title: label,
    className:
      'flex size-9 items-center justify-center rounded-full border border-oat bg-background text-warm-charcoal transition-all hover:border-matcha-600 hover:text-matcha-800 hover:shadow-sm',
  };
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" {...common}>
        <Icon className="size-4" />
      </a>
    );
  }
  return (
    <a href={href} {...common}>
      <Icon className="size-4" />
    </a>
  );
}
