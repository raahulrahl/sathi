import type { Metadata } from 'next';
import { Linkedin, Mail, MessageCircle, Twitter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Trust & safety',
  description: 'How Sathi keeps families and companions safe.',
};

const CHANNELS = [
  {
    icon: Linkedin,
    name: 'LinkedIn',
    body: 'A real employer, a real network. Fake-able, but hard to fake alongside three other channels.',
  },
  {
    icon: Twitter,
    name: 'X (Twitter)',
    body: 'Account age and history are visible proxies for whether the person exists outside of this app.',
  },
  {
    icon: Mail,
    name: 'Email',
    body: 'Automatically verified at signup — magic link or OAuth.',
  },
  {
    icon: MessageCircle,
    name: 'WhatsApp',
    body: 'One-time code on a working number. The lingua franca for Indian parents.',
  },
];

export default function TrustPage() {
  return (
    <article className="container max-w-3xl py-14">
      <h1 className="font-serif text-4xl">Trust & safety</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Sathi doesn't do passport uploads. Verification is <b>social-graph based</b>: every user
        must connect at least two of LinkedIn, X, email, and WhatsApp before they can post a trip or
        send a request.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {CHANNELS.map(({ icon: Icon, name, body }) => (
          <Card key={name}>
            <CardContent className="space-y-2 p-5">
              <div className="flex items-center gap-2">
                <Icon className="size-5 text-saffron-600" aria-hidden />
                <h3 className="font-serif text-lg">{name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mt-14 font-serif text-2xl">Other non-negotiables</h2>
      <ul className="mt-4 space-y-3 text-muted-foreground">
        <li>
          <b>No PII before accept.</b> Full names, contact info, and parent photos are hidden until
          a match request is accepted.
        </li>
        <li>
          <b>Reviews tied to completed trips only.</b> Both parties must mark the trip completed —
          there's no way to leave a review otherwise.
        </li>
        <li>
          <b>Report & block.</b> Every profile and every chat has a report button; blocked users'
          trips don't appear in your search.
        </li>
        <li>
          <b>Admin review.</b> Flagged text and reports land in a human queue — we suspend and
          re-verify by hand.
        </li>
      </ul>

      <div className="mt-10 rounded-lg border bg-muted/40 p-5 text-sm text-muted-foreground">
        <b>A clear disclaimer:</b> Sathi is an introduction service. You are responsible for your
        own arrangement, payment, and travel. We do not screen beyond social verification.
      </div>
    </article>
  );
}
