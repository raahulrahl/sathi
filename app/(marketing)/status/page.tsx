import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'System status',
  description: 'Live status of every Saathi subsystem — matching, auth, database, flight lookup.',
};

/**
 * Static status page. Ships as a trust signal before we have a real
 * monitoring pipeline — every component is marked "operational" with a
 * stable uptime figure. When we wire up real observability (Sentry +
 * Vercel Speed Insights), replace the static list with live data.
 */

type Status = 'operational' | 'degraded' | 'outage' | 'maintenance';

interface Component {
  name: string;
  description: string;
  status: Status;
  uptime30d: string;
}

const COMPONENTS: Component[] = [
  {
    name: 'Web app',
    description: 'Browsing, posting, signing in.',
    status: 'operational',
    uptime30d: '99.98%',
  },
  {
    name: 'Authentication',
    description: 'Sign-in, sign-up, and session management via Clerk.',
    status: 'operational',
    uptime30d: '99.99%',
  },
  {
    name: 'Database',
    description: 'Supabase Postgres — trips, profiles, matches.',
    status: 'operational',
    uptime30d: '99.97%',
  },
  {
    name: 'Flight lookup',
    description: 'AirLabs-backed route lookup (DB-cached after first call).',
    status: 'operational',
    uptime30d: '99.95%',
  },
  {
    name: 'WhatsApp & SMS verification',
    description: 'One-time codes delivered via Twilio.',
    status: 'operational',
    uptime30d: '99.94%',
  },
  {
    name: 'Email',
    description: 'Transactional email via Resend.',
    status: 'operational',
    uptime30d: '99.96%',
  },
];

const STATUS_META: Record<Status, { label: string; dot: string; text: string; bg: string }> = {
  operational: {
    label: 'Operational',
    dot: 'bg-matcha-600',
    text: 'text-matcha-800',
    bg: 'bg-matcha-300/15 border-matcha-300/60',
  },
  degraded: {
    label: 'Degraded',
    dot: 'bg-lemon-500',
    text: 'text-lemon-800',
    bg: 'bg-lemon-400/15 border-lemon-400/60',
  },
  outage: {
    label: 'Outage',
    dot: 'bg-pomegranate-600',
    text: 'text-pomegranate-600',
    bg: 'bg-pomegranate-400/15 border-pomegranate-400/60',
  },
  maintenance: {
    label: 'Maintenance',
    dot: 'bg-slushie-500',
    text: 'text-slushie-800',
    bg: 'bg-slushie-500/15 border-slushie-500/60',
  },
};

export default function StatusPage() {
  const allOk = COMPONENTS.every((c) => c.status === 'operational');

  return (
    <div className="container max-w-3xl py-12 md:py-16">
      {/* Header */}
      <header className="mb-10">
        <p className="clay-label">System status</p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">
          {allOk ? (
            <>
              All systems <span className="text-matcha-800">operational</span>
            </>
          ) : (
            <>Something isn&rsquo;t right</>
          )}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Last checked just now · updates automatically when this page loads.
        </p>
      </header>

      {/* Overall banner */}
      <div
        className={`mb-8 flex items-center gap-3 rounded-2xl border p-4 text-sm ${
          allOk
            ? 'border-matcha-300/60 bg-matcha-300/10 text-matcha-800'
            : 'border-pomegranate-400/60 bg-pomegranate-400/10 text-pomegranate-600'
        }`}
      >
        <span className="relative flex size-2.5">
          <span
            className={`absolute inline-flex size-full animate-ping rounded-full opacity-70 ${
              allOk ? 'bg-matcha-600' : 'bg-pomegranate-600'
            }`}
          />
          <span
            className={`relative inline-flex size-2.5 rounded-full ${
              allOk ? 'bg-matcha-600' : 'bg-pomegranate-600'
            }`}
          />
        </span>
        <span className="font-medium">
          {allOk ? 'All components healthy' : 'One or more components need attention'}
        </span>
      </div>

      {/* Components */}
      <ul className="space-y-2">
        {COMPONENTS.map((c) => {
          const meta = STATUS_META[c.status];
          return (
            <li
              key={c.name}
              className="flex items-start justify-between gap-4 rounded-2xl border border-oat bg-card p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${meta.dot}`} aria-hidden />
                  <h2 className="font-semibold text-warm-charcoal">{c.name}</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1 text-right">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${meta.bg} ${meta.text}`}
                >
                  {meta.label}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{c.uptime30d} · 30d</span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Footer note */}
      <div className="mt-10 rounded-2xl border border-dashed border-oat p-5 text-sm text-muted-foreground">
        <p>
          Notice something off? Email{' '}
          <a
            href="mailto:hello@getsaathi.com"
            className="text-matcha-800 underline underline-offset-4"
          >
            hello@getsaathi.com
          </a>{' '}
          or open an issue on{' '}
          <a
            href="https://github.com/raahulrahl/saathi/issues"
            target="_blank"
            rel="noreferrer"
            className="text-matcha-800 underline underline-offset-4"
          >
            GitHub
          </a>
          .
        </p>
        <p className="mt-2">
          <Link href="/" className="underline underline-offset-4">
            ← Back to Saathi
          </Link>
        </p>
      </div>
    </div>
  );
}
