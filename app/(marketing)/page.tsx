import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { FlightComposer } from '@/components/flight-composer';
import { PeekWidget } from '@/components/peek-widget';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Landing page — written for aunties, uncles, and the daughters and sons
 * posting for them. Not for SaaS buyers.
 *
 * Shape: hero + flight composer, one prose block that explains the whole
 * thing in two paragraphs, one example post that reads like a note, one
 * line showing who's around, one closing action. No eyebrow labels, no
 * feature cards, no side-by-side testimonial columns.
 */

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
          HERO — badge, one-line headline, one-sentence subtext, composer.
          No floating doodles: they were contributing to the asymmetry and
          the SaaS feel.
         ------------------------------------------------------------------ */}
      <section>
        <div className="container flex flex-col items-center gap-10 py-16 md:py-20">
          <div className="flex max-w-3xl flex-col items-center gap-5 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-oat bg-white px-3 py-1 text-xs font-medium text-warm-charcoal">
              <span className="font-semibold text-marigold-700">साथी</span> · a little community for
              travel days
            </span>
            <h1 className="max-w-3xl text-balance font-display text-4xl font-semibold leading-[1.1] tracking-[-0.02em] text-foreground md:text-5xl lg:text-[56px]">
              Find someone kind on <span className="text-marigold-700">Ma&rsquo;s</span> flight.
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
        </div>
      </section>

      {/* ------------------------------------------------------------------
          PEEK — answers the chicken-and-egg question: "Should I buy the
          ticket?" Both sides of the market need this. A family checking
          sees if any companions have already posted for that week; a
          companion checking sees if any families are already looking. The
          widget is visually quieter than the main composer (dashed border,
          no shadow) so people don't fill both — this is a peek, the other
          is a commit.
         ------------------------------------------------------------------ */}
      <section className="container max-w-4xl pb-12 pt-0">
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <h2 className="font-display text-2xl font-semibold leading-tight tracking-[-0.02em] md:text-3xl">
            Haven&rsquo;t booked the ticket yet?
          </h2>
          <p className="text-base leading-relaxed text-warm-charcoal">
            Before you buy a seat, peek at who&rsquo;s already flying that week. Only book the
            ticket if you can see a saathi on it.
          </p>
        </div>
        <PeekWidget className="mx-auto mt-6 max-w-3xl" />
      </section>

      {/* ------------------------------------------------------------------
          NARRATIVE — one centered prose column. This replaces "Three small
          steps" + "Language first" + "Same plane, not same-ish trip", all
          of which were SaaS-shaped sections with eyebrow labels and icons.
         ------------------------------------------------------------------ */}
      <section className="container max-w-2xl pb-6 pt-2">
        <div className="space-y-6 text-lg leading-relaxed text-warm-charcoal">
          <p>
            Here&rsquo;s how it works. You post the flight — dates, numbers, the languages she
            speaks, whatever help she might need. We look at everyone already booked on that same
            plane, show you the ones who share her language, and rank them by whether their friends
            have vouched for them. You say hello. You meet at the gate. We never touch the money.
          </p>
          <p>
            Passport checks don&rsquo;t help Ma. A Bengali-speaking student at Schiphol does.
            That&rsquo;s why we sort by the language your parent actually speaks — not by how
            polished someone&rsquo;s LinkedIn looks. And we only pair people who are on the exact
            same flight number, not just the same route. Someone flying{' '}
            <span className="font-mono text-marigold-700">CCU → AMS</span> on the 10th can&rsquo;t
            help a parent on the 14th. Two people with{' '}
            <span className="font-mono font-semibold text-marigold-700">QR540 · QR23</span> are on
            the same aircraft — that&rsquo;s a real match.
          </p>
        </div>

        {/* One example post. Styled as a note, not a testimonial — no round
            initial avatar, no framed card, no "A note from Priya" eyebrow. */}
        <figure className="mx-auto mt-10 max-w-xl rounded-2xl border border-marigold-200/80 bg-marigold-50 p-6 md:p-7">
          <blockquote className="font-display text-lg leading-snug text-foreground md:text-xl">
            &ldquo;Ma flies <span className="font-mono">CCU → AMS via DOH</span> on 14 December. She
            speaks <b className="text-marigold-700">Bengali</b> and a little English. Offering €20
            for anyone on the same flight who can walk her through the transfer at Doha.&rdquo;
          </blockquote>
          <figcaption className="mt-4 text-sm text-warm-charcoal">— Priya, Amsterdam</figcaption>
        </figure>
      </section>

      {/* ------------------------------------------------------------------
          TICKER — a single line of who's around. Replaces the 4-card grid
          with badges and avatars, which read like a marketplace directory.
         ------------------------------------------------------------------ */}
      <section className="container max-w-3xl py-12 text-center">
        <p className="text-sm leading-relaxed text-warm-charcoal">
          Around today: <span className="text-foreground">Arjun (Bengali · Delft)</span>
          <span className="px-1.5 text-warm-silver">·</span>
          <span className="text-foreground">Meera (Tamil · Berlin)</span>
          <span className="px-1.5 text-warm-silver">·</span>
          <span className="text-foreground">Yusuf (Urdu · Amsterdam)</span>
          <span className="px-1.5 text-warm-silver">·</span>
          <span className="text-foreground">Priya (Bengali, Ma&rsquo;s Dec 14 flight)</span>.{' '}
          <Link href="/search" className="text-marigold-700 underline-offset-4 hover:underline">
            See everyone →
          </Link>
        </p>
        <p className="mt-2 text-xs text-warm-silver">
          Examples for now. Real people appear here as they join.
        </p>
      </section>

      {/* ------------------------------------------------------------------
          CLOSING — one action, one line of reassurance. The hero composer
          already handles both modes; this is just for people who scrolled.
         ------------------------------------------------------------------ */}
      <section className="container pb-24 pt-4 text-center">
        <Link
          href="/post/request"
          className="clay-hover inline-flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-sm font-semibold text-background"
        >
          Post a flight
        </Link>
        <p className="mt-3 text-sm text-warm-silver">Takes a minute. Free. Always will be.</p>
      </section>
    </div>
  );
}
