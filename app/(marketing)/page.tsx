import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { Heart, MessageCircle, Plane } from 'lucide-react';
import { FlightComposer } from '@/components/flight-composer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Small inline SVG doodles. Hand-drawn-feeling monoline icons that soften
 * the page without needing to import an illustration pack.
 */
function TeacupDoodle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 40" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M8 14c0-1 0-1 1-1h26c1 0 1 0 1 1v10c0 6-5 10-14 10s-14-4-14-10V14z" />
      <path d="M36 16c3 0 6 2 6 6s-3 6-6 6" strokeLinecap="round" />
      <path d="M14 6c-1 2 1 4 0 6M22 4c-1 2 1 4 0 6M30 6c-1 2 1 4 0 6" strokeLinecap="round" />
    </svg>
  );
}
function PaperPlaneDoodle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M6 24 L42 6 L30 42 L22 28 Z" strokeLinejoin="round" />
      <path d="M22 28 L42 6" strokeLinecap="round" />
    </svg>
  );
}
function HeartDoodle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 30" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path
        d="M16 27 L4 14 C1 10 3 4 8 4 c3 0 5 2 8 5 c3-3 5-5 8-5 c5 0 7 6 4 10 L16 27 z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function LandingPage() {
  let viewerRole: 'family' | 'companion' | null = null;
  const { userId } = await auth();
  if (userId) {
    const supabase = await createSupabaseServerClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    if (profile?.role === 'family' || profile?.role === 'companion') {
      viewerRole = profile.role;
    }
  }

  return (
    <div className="flex flex-col">
      {/* ------------------------------------------------------------------
          HERO — warm, calm, scene-setting. Small tagline, one question
          as the headline, one sentence of subtext, the composer.
         ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden">
        {/* Soft decorative doodles */}
        <PaperPlaneDoodle
          aria-hidden
          className="pointer-events-none absolute left-[6%] top-[18%] hidden size-16 -rotate-12 text-oat md:block"
        />
        <TeacupDoodle
          aria-hidden
          className="pointer-events-none absolute right-[8%] top-[22%] hidden size-14 rotate-6 text-oat md:block"
        />
        <HeartDoodle
          aria-hidden
          className="pointer-events-none absolute bottom-[12%] left-[10%] hidden size-10 rotate-12 text-oat md:block"
        />

        <div className="container flex flex-col items-center gap-10 py-16 md:py-20">
          <div className="flex max-w-3xl flex-col items-center gap-5 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-oat bg-white px-3 py-1 text-xs font-medium text-warm-charcoal">
              साथी · a little community for travel days
            </span>
            <h1 className="max-w-3xl text-balance font-display text-4xl font-semibold leading-[1.1] tracking-[-0.02em] text-foreground md:text-5xl lg:text-[56px]">
              Find someone kind on Ma&rsquo;s flight.
            </h1>
            <p className="max-w-2xl text-balance text-lg leading-relaxed text-warm-charcoal">
              Saathi is a small community of travellers who look out for each other&rsquo;s parents
              through unfamiliar airports. Tell us the flight — we&rsquo;ll find someone who speaks
              her language.
            </p>
          </div>

          <FlightComposer
            variant="hero"
            defaultMode="seek"
            viewerRole={viewerRole}
            className="max-w-4xl"
          />

          <p className="max-w-md text-balance text-center text-sm text-warm-silver">
            We don&rsquo;t charge, and we don&rsquo;t take a cut. Just a small thank-you between the
            two of you, in whatever currency feels right.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          HOW IT WORKS — three soft cards on cream, no numbered circles.
         ------------------------------------------------------------------ */}
      <section className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="clay-label">How it goes</p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-4xl">
            Three small steps. That&rsquo;s it.
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <Card key={step.title}>
              <CardContent className="space-y-4 p-6">
                <div
                  className={`flex size-11 items-center justify-center rounded-full ${step.accent}`}
                >
                  <step.icon className="size-5" aria-hidden />
                </div>
                <h3 className="font-display text-xl font-semibold tracking-tight">{step.title}</h3>
                <p className="text-base leading-relaxed text-warm-charcoal">{step.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------
          LANGUAGE — lighter Matcha, no inverse, warm tea-room feel.
         ------------------------------------------------------------------ */}
      <section className="relative px-4 py-4 md:py-6">
        <div className="container rounded-[40px] border border-matcha-300/60 bg-matcha-300/40 p-8 md:p-14">
          <div className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
            <div>
              <p className="clay-label text-matcha-800">Language first</p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] md:text-4xl">
                She speaks Bengali.
                <br />
                That&rsquo;s where we start.
              </h2>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-foreground/80">
                Passport checks don&rsquo;t help Ma. A Bengali-speaking student at Schiphol does.
                Saathi ranks companions by the language they share with your parent, not by how
                shiny someone&rsquo;s LinkedIn looks.
              </p>
              <ul className="mt-6 space-y-4 text-base">
                <li className="flex gap-3">
                  <span className="mt-1 inline-block size-2 shrink-0 rounded-full bg-matcha-600" />
                  <span>
                    <b>Mother tongue first.</b> We bold it on every card so you can scan in a
                    glance.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-block size-2 shrink-0 rounded-full bg-matcha-600" />
                  <span>
                    <b>Quiet trust signals.</b> LinkedIn, X, WhatsApp — two or more, verified before
                    anyone can post.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-block size-2 shrink-0 rounded-full bg-matcha-600" />
                  <span>
                    <b>Real reviews only.</b> Both of you have to confirm the trip happened before a
                    review is even possible.
                  </span>
                </li>
              </ul>
            </div>
            <div className="rounded-3xl border border-matcha-300 bg-white p-6 shadow-clay md:p-8">
              <p className="clay-label text-matcha-800">A note from Priya</p>
              <p className="mt-3 font-display text-xl leading-snug text-foreground md:text-2xl">
                &ldquo;Ma flies <span className="font-mono text-matcha-800">CCU → AMS via DOH</span>{' '}
                on 14 December. She speaks <b>Bengali</b> and a little English. We&rsquo;re offering
                €20 for anyone on the same flight who can walk her through the transfer at
                Doha.&rdquo;
              </p>
              <p className="mt-5 flex items-center gap-3 text-sm text-warm-charcoal">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-matcha-600 font-semibold text-white">
                  P
                </span>
                <span>
                  <b className="text-foreground">Priya R.</b>
                  <br />
                  Amsterdam · daughter
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          RECENT SAATHIS — small row of example profile cards. Placeholder
          until real users. Inherently humanizes the page.
         ------------------------------------------------------------------ */}
      <section className="container py-16">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="clay-label">People on Saathi right now</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Someone like this is probably on Ma&rsquo;s flight.
            </h2>
          </div>
          <Link
            href="/search"
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Browse all →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXAMPLE_SAATHIS.map((s) => (
            <Card key={s.name} className="clay-hover">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex size-11 items-center justify-center rounded-full font-semibold text-white ${s.avatarColor}`}
                  >
                    {s.name[0]}
                  </span>
                  <div>
                    <div className="font-semibold leading-tight">{s.name}</div>
                    <div className="text-xs text-warm-charcoal">{s.role}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.languages.map((l, i) => (
                    <Badge key={l} variant={i === 0 ? 'matcha' : 'outline'}>
                      {l}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-warm-charcoal">{s.blurb}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-warm-silver">
          Examples for illustration. Real profiles appear here as people join.
        </p>
      </section>

      {/* ------------------------------------------------------------------
          SAME PLANE — kept, but lightened. Cream background with a soft
          Slushie accent instead of the full electric-cyan wash.
         ------------------------------------------------------------------ */}
      <section className="container pb-16">
        <div className="grid gap-10 rounded-[40px] border border-dashed border-oat p-8 md:grid-cols-[1.1fr_1fr] md:items-center md:p-12">
          <div>
            <p className="clay-label text-slushie-800">Same plane, not same-ish trip</p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] md:text-4xl">
              It only helps if you&rsquo;re on the same flight.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-warm-charcoal">
              Someone flying CCU → AMS on the 10th can&rsquo;t help a parent on the 14th, even if
              both are on the same route. So we match strictly on flight number. Two people with{' '}
              <span className="font-mono font-semibold">QR540 · QR23</span> are on the exact same
              aircraft — that&rsquo;s a real match.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 rounded-2xl bg-slushie-500/20 p-6">
            <span className="rounded-full bg-foreground px-4 py-1.5 font-mono text-sm font-semibold text-background">
              ✈ QR540
            </span>
            <span className="rounded-full bg-foreground px-4 py-1.5 font-mono text-sm font-semibold text-background">
              ✈ QR23
            </span>
            <span className="rounded-full border border-slushie-800/30 bg-white px-4 py-1.5 font-mono text-sm text-warm-silver">
              ✈ LH757
            </span>
            <span className="rounded-full border border-slushie-800/30 bg-white px-4 py-1.5 font-mono text-sm text-warm-silver">
              ✈ KL870
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          CTA — two warm buttons with role-scoped language.
         ------------------------------------------------------------------ */}
      <section className="container pb-20 pt-4 text-center">
        <div className="mx-auto max-w-2xl space-y-5">
          <Plane className="mx-auto size-8 -rotate-45 text-foreground/70" aria-hidden />
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-4xl">
            Ready to find your Saathi?
          </h2>
          <p className="text-base text-warm-charcoal">
            Post your flight, or browse who&rsquo;s already there. Both take a minute. Both free.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              href="/post/request"
              className="clay-hover inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background"
            >
              I&rsquo;m bringing a parent over
            </Link>
            <Link
              href="/post/offer"
              className="clay-hover inline-flex h-12 items-center justify-center rounded-full border border-oat bg-white px-6 text-sm font-semibold text-foreground"
            >
              I&rsquo;m flying home anyway
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const STEPS = [
  {
    title: 'Tell us the flight',
    body: 'Route, date, flight numbers, the languages Ma speaks, what help she needs. Layovers are usually where parents struggle — add them if you can.',
    accent: 'bg-matcha-300 text-matcha-800',
    icon: Plane,
  },
  {
    title: 'We find someone friendly',
    body: 'We look at everyone on the same flight, pick the ones who share a language with Ma, and rank the rest by trust signals and past reviews.',
    accent: 'bg-lemon-400 text-lemon-800',
    icon: Heart,
  },
  {
    title: 'Say hello, meet at the gate',
    body: 'Accept a request, chat in-app, arrange a small thank-you in your own currency. Meet at the airport. We never touch the money.',
    accent: 'bg-ube-300 text-ube-900',
    icon: MessageCircle,
  },
];

const EXAMPLE_SAATHIS: Array<{
  name: string;
  role: string;
  languages: string[];
  blurb: string;
  avatarColor: string;
}> = [
  {
    name: 'Arjun',
    role: 'Student · Delft',
    languages: ['Bengali', 'Hindi', 'English'],
    blurb: 'Flies CCU → AMS every winter. Walks bags through the Doha transfer for aunties.',
    avatarColor: 'bg-matcha-600',
  },
  {
    name: 'Meera',
    role: 'Designer · Berlin',
    languages: ['Tamil', 'English', 'German'],
    blurb: 'Red-eyes from MAA via DXB most months. Patient with people who hate kiosks.',
    avatarColor: 'bg-ube-800',
  },
  {
    name: 'Yusuf',
    role: 'Nurse · Amsterdam',
    languages: ['Urdu', 'Hindi', 'English'],
    blurb: 'Two flights to LHE a year. Happy to wait with someone at a quiet gate.',
    avatarColor: 'bg-lemon-700',
  },
  {
    name: 'Priya',
    role: 'Daughter · posting for Ma',
    languages: ['Bengali', 'English'],
    blurb: 'Looking for someone calm on Ma’s Dec 14 flight. A cup of tea when you land.',
    avatarColor: 'bg-pomegranate-400',
  },
];
