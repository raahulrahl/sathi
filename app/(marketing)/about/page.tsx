import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'What Sathi is and why it exists.',
};

export default function AboutPage() {
  return (
    <article className="prose prose-neutral prose-headings:font-serif container max-w-2xl py-14">
      <h1>About Sathi</h1>
      <p className="lead">
        Every year, hundreds of thousands of first-generation immigrant families want to bring a
        parent over from India, China, the Philippines, Nigeria. The blocker is rarely the visa or
        the ticket. It's the flight itself.
      </p>
      <p>
        Most parents don't speak English, have never seen a self-service kiosk, can't read the
        boarding signage, and panic at connecting flights. Today the workaround lives in WhatsApp
        groups and Facebook posts:{' '}
        <em>&ldquo;Anyone flying CCU → AMS via DOH on the 14th? My mother needs help.&rdquo;</em>
      </p>
      <p>That's the entire product. Make that post a structured search.</p>
      <h2>What we are</h2>
      <p>
        Sathi makes the introduction between two people who would have met on WhatsApp anyway. Money
        moves between them directly — Revolut, UPI, cash at the gate, whatever they prefer. We don't
        touch it. That keeps us out of payments licensing, out of disputes, and lets us ship.
      </p>
      <h2>What we are not</h2>
      <p>
        Sathi isn't meet-and-assist-as-a-service. Professional airport assistance exists — Schiphol
        charges €80–120 for it. Sathi is cheaper, but more importantly it's cultural: someone who
        speaks your mother's language is worth more than a uniformed assistant who doesn't.
      </p>
      <h2>Who's behind this</h2>
      <p>
        Sathi is an independent project. Early community and build updates live on{' '}
        <a href="https://musingsonai.beehiiv.com">Musings on AI</a>.
      </p>
    </article>
  );
}
