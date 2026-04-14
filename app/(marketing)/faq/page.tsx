import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'FAQ' };

const QAS = [
  {
    q: 'Does Saathi take a cut of the thank-you?',
    a: 'No. Money moves directly between the family and the companion in whatever currency and app they prefer — Revolut, UPI, cash at the gate. Saathi never sees it.',
  },
  {
    q: 'How is this different from airport meet-and-assist services?',
    a: "Airport paid services cost €80–120, are uniformed, and rarely speak your parent's language. Saathi is cheaper and picks someone who actually shares a mother tongue.",
  },
  {
    q: "What happens if my companion doesn't show up?",
    a: "You can cancel or dispute the match. The companion's profile loses its badges. Saathi doesn't guarantee performance beyond social verification — this is why the thank-you is small, and not pre-paid.",
  },
  {
    q: 'Can the same person be both a family and a companion?',
    a: "Not in v1 — one role per account. It will eventually happen (a student who also flies her own grandmother over), and we'll handle that in v2.",
  },
  {
    q: 'Which routes are supported?',
    a: 'Any route with two or more IATA codes. Launch focus is India ↔ Netherlands and India ↔ Germany, with common layovers at Doha, Dubai, Istanbul, Frankfurt.',
  },
];

export default function FaqPage() {
  return (
    <article className="container max-w-2xl py-14">
      <h1 className="font-serif text-4xl">Frequently asked</h1>
      <dl className="mt-8 space-y-8">
        {QAS.map(({ q, a }) => (
          <div key={q}>
            <dt className="font-serif text-xl">{q}</dt>
            <dd className="mt-2 text-muted-foreground">{a}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
