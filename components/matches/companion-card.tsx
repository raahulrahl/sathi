'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LanguageChipRow } from '@/components/language-chip';
import { EvidenceBadge } from '@/components/matches/evidence-badge';
import { IntroModal, type FamilyTripSummary } from '@/components/matches/intro-modal';
import type { Scored } from '@/lib/matching';

/**
 * Companion card — one row on the family-side shortlist
 * (/trip/:id/matches). Differs from the generic components/trip-card
 * in three ways:
 *
 *  1. Subject is the person, not the trip — display_name, rating, and
 *     a one-line bio take the top. The underlying trip's route/date
 *     context is already implied (it's the searcher's own trip).
 *  2. Evidence badge leads — "Also on QR540 + QR23" is the one signal
 *     the family needs to decide whether to reach out.
 *  3. Single CTA opens an intro modal, not a new page. Keeps the
 *     family scanning the shortlist without losing their place.
 *
 * Pending-state handling: if the family has already sent a match
 * request against this companion's offer trip (existingRequest !==
 * null), the CTA is replaced with a status badge and an optional
 * deep-link to the match page once accepted. Reopening the modal is
 * blocked — the DB unique constraint would refuse anyway, but the UI
 * sidesteps the error upfront.
 */

export interface CompanionCardData {
  /** The companion's offer trip id — passed to the intro modal as
   *  the match_request target. */
  tripId: string;
  /** Clerk user id — used as the React key and for profile deep-link. */
  userId: string;
  displayName: string;
  photoUrl: string | null;
  languages: string[];
  primaryLanguage: string | null;
  bio: string | null;
  verifiedChannels: string[];
  reviewCount: number;
  averageRating: number | null;
}

export interface ExistingRequestState {
  status: 'pending' | 'accepted' | 'declined' | 'auto_declined';
  matchId: string | null;
}

interface CompanionCardProps {
  companion: CompanionCardData;
  /** The full scored result — used for the evidence badge + language
   *  highlighting. */
  scored: Scored;
  /** Trip context for the badge + intro template. */
  origin: string;
  destination: string;
  travelDate: string;
  /** Family's own trip summary — feeds the intro-modal template + the
   *  help-categories read-only list. */
  familyTrip: FamilyTripSummary;
  /** If the family has already sent a match_request for this
   *  companion's trip, we show a status badge instead of the CTA. */
  existingRequest: ExistingRequestState | null;
}

export function CompanionCard({
  companion,
  scored,
  origin,
  destination,
  travelDate,
  familyTrip,
  existingRequest,
}: CompanionCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [optimisticPending, setOptimisticPending] = useState(false);

  const effectiveRequest: ExistingRequestState | null =
    existingRequest ?? (optimisticPending ? { status: 'pending', matchId: null } : null);

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-5">
        {/* ── Header: avatar + name + rating ─────────────────────────── */}
        <div className="flex items-start gap-4">
          <Avatar className="size-14 shrink-0">
            {companion.photoUrl ? (
              <AvatarImage asChild>
                <Image
                  src={companion.photoUrl}
                  alt=""
                  width={56}
                  height={56}
                  className="size-14 object-cover"
                  unoptimized
                />
              </AvatarImage>
            ) : null}
            <AvatarFallback>{initials(companion.displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <Link
                href={`/profile/${companion.userId}`}
                className="truncate font-serif text-lg hover:underline"
              >
                {companion.displayName}
              </Link>
              {companion.averageRating !== null && companion.reviewCount > 0 ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-sm text-warm-charcoal">
                  <Star className="fill-marigold-500 text-marigold-500 size-3.5" aria-hidden />
                  {companion.averageRating}
                  <span className="text-muted-foreground">/ {companion.reviewCount}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── Evidence badge — the "why this person" line ─────────────── */}
        <EvidenceBadge
          scored={scored}
          origin={origin}
          destination={destination}
          date={travelDate}
        />

        {/* ── Languages (matched ones bolded by LanguageChipRow) ──────── */}
        <LanguageChipRow
          languages={companion.languages}
          primary={companion.primaryLanguage}
          viewerLanguages={scored.matchedLanguages}
        />

        {/* ── Bio — in the companion's voice ──────────────────────────── */}
        {companion.bio ? (
          <p className="text-sm leading-relaxed text-warm-charcoal">
            &ldquo;{truncate(companion.bio, 200)}&rdquo;
          </p>
        ) : null}

        {/* ── Verified-channel icons ─────────────────────────────────── */}
        {companion.verifiedChannels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {companion.verifiedChannels.map((channel) => (
              <span
                key={channel}
                className="inline-flex items-center gap-1 rounded-full bg-matcha-300/30 px-2 py-0.5 text-[11px] font-medium text-matcha-800"
              >
                <CheckCircle2 className="size-3" aria-hidden />
                {labelForChannel(channel)}
              </span>
            ))}
          </div>
        ) : null}

        {/* ── CTA / Status ───────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 pt-1">
          {effectiveRequest ? (
            <StatusPill status={effectiveRequest.status} matchId={effectiveRequest.matchId} />
          ) : (
            <Button variant="slushie" onClick={() => setModalOpen(true)}>
              Send a message &rarr;
            </Button>
          )}
        </div>
      </CardContent>

      <IntroModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        companion={{ name: firstName(companion.displayName), tripId: companion.tripId }}
        familyTrip={familyTrip}
        onSent={() => {
          setOptimisticPending(true);
          // Close modal after a short delay so the success copy is seen.
          setTimeout(() => setModalOpen(false), 1200);
        }}
      />
    </Card>
  );
}

function StatusPill({
  status,
  matchId,
}: {
  status: ExistingRequestState['status'];
  matchId: string | null;
}) {
  if (status === 'accepted' && matchId) {
    return (
      <Button asChild variant="matcha">
        <Link href={`/match/${matchId}`}>Matched &rarr;</Link>
      </Button>
    );
  }
  const label =
    status === 'pending' ? 'Request pending' : status === 'accepted' ? 'Matched' : 'Declined';
  const variant = status === 'pending' ? 'muted' : 'outline';
  return <Badge variant={variant}>{label}</Badge>;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}\u2026`;
}

function labelForChannel(channel: string): string {
  const map: Record<string, string> = {
    linkedin: 'LinkedIn',
    twitter: 'Twitter',
    email: 'Email',
    whatsapp: 'WhatsApp',
    google: 'Google',
    github: 'GitHub',
    facebook: 'Facebook',
  };
  return map[channel] ?? channel;
}
