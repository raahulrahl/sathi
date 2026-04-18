'use client';

import { useState, useTransition } from 'react';
import { Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { sendMatchRequestAction } from '@/app/trip/[id]/request/actions';

/**
 * Intro modal — shown when a family taps "Send a message" on a
 * companion card. Replaces the old /trip/[id]/request full-page form
 * for the shortlist flow. Reuses sendMatchRequestAction end-to-end:
 * same moderation, same unique (trip, requester) dedupe, same 30-char
 * minimum.
 *
 * Help-categories display: the family's trip already stores the
 * help_categories array. We show it read-only as context so the
 * family remembers what they asked for, and the companion can
 * acknowledge specific items in their reply. A future enhancement
 * could let the family scope a per-companion subset — that needs a
 * match_requests.help_categories column first, out of scope here.
 */

export interface CompanionSummary {
  /** Display name — rendered in the intro greeting. First name only. */
  name: string;
  /**
   * Trip id the match_request gets posted against. This is the
   * COMPANION's offer trip id — not the family's own trip. The
   * existing match_requests model is "anyone sends a request against
   * an open trip they don't own."
   */
  tripId: string;
}

export interface FamilyTripSummary {
  routeLabel: string;
  travelDate: string;
  flightNumbers: string[];
  helpCategories: string[];
}

interface IntroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companion: CompanionSummary;
  familyTrip: FamilyTripSummary;
  /** Called once the server action returns ok — the parent card flips
   *  to a "Pending" visual state without needing a route revalidation. */
  onSent?: () => void;
}

export function IntroModal({ open, onOpenChange, companion, familyTrip, onSent }: IntroModalProps) {
  const [message, setMessage] = useState(() =>
    buildTemplate({ companionName: companion.name, familyTrip }),
  );
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const result = await sendMatchRequestAction({
        trip_id: companion.tripId,
        intro_message: message,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSent(true);
      onSent?.();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          // Reset sent-state after close so reopening shows the form,
          // not a stale success message. Parent controls pending via
          // onSent → existingRequest prop, so UX stays correct.
          setSent(false);
          setError(null);
        }
      }}
    >
      <DialogContent>
        {sent ? (
          <div className="space-y-3">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Check className="text-matcha-700 size-5" />
                <DialogTitle>Request sent to {companion.name}.</DialogTitle>
              </div>
              <DialogDescription>
                {companion.name} will get an email and see your request on their dashboard.
                You&rsquo;ll hear back as soon as they respond — usually within a day.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Message {companion.name}</DialogTitle>
              <DialogDescription>
                Say a little about who&rsquo;s travelling and how {companion.name} can help. Contact
                details stay hidden until {companion.name} accepts.
              </DialogDescription>
            </DialogHeader>

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Couldn&rsquo;t send</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="intro-modal-message">Your message</Label>
              <Textarea
                id="intro-modal-message"
                required
                minLength={30}
                maxLength={1000}
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                At least a couple of sentences. Phone numbers and emails are blocked — they&rsquo;ll
                unlock automatically after a match.
              </p>
            </div>

            {familyTrip.helpCategories.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  From your trip — what you asked for help with:
                </p>
                <ul className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                  {familyTrip.helpCategories.map((cat) => (
                    <li key={cat} className="flex items-center gap-2">
                      <Check className="text-matcha-700 size-3.5" />
                      <span>{cat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending || message.trim().length < 30}>
                {pending ? 'Sending\u2026' : 'Send message'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function buildTemplate({
  companionName,
  familyTrip,
}: {
  companionName: string;
  familyTrip: FamilyTripSummary;
}): string {
  const flightLine =
    familyTrip.flightNumbers.length > 0 ? ` on ${familyTrip.flightNumbers.join(' + ')}` : '';
  const dateLabel = formatDate(familyTrip.travelDate);
  return [
    `Hi ${companionName},`,
    ``,
    `I noticed you're on ${familyTrip.routeLabel}${flightLine} on ${dateLabel} — same flight as someone I'm sending. They'd appreciate a hand at transfers and some company on the way.`,
    ``,
    `Happy to share more after you accept. Thank you for considering.`,
  ].join('\n');
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
