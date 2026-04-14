import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { Check, Linkedin, MessageCircle, Twitter } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { syncClerkUserToSupabase } from '@/lib/clerk-sync';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LinkOAuthButton } from './link-oauth-button';
import { WhatsAppVerify } from './whatsapp-verify';
import { ProfileBasics } from './profile-basics';

export const metadata: Metadata = { title: 'Welcome to Saathi' };

const CHANNELS: Array<{
  id: 'linkedin' | 'twitter' | 'whatsapp';
  label: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string }>;
  linkable: boolean;
}> = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    blurb: 'A real employer and a real network. Strongest signal for families.',
    icon: Linkedin,
    linkable: true,
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    blurb: 'Account age and post history.',
    icon: Twitter,
    linkable: true,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    blurb: 'A working WhatsApp number. Lingua franca for Indian parents.',
    icon: MessageCircle,
    linkable: false,
  },
];

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect('/auth/sign-in?redirect_url=/onboarding');

  // Self-heal so the app works even before the Clerk webhook is wired up.
  // Pulls the current Clerk user state and writes profile + verifications
  // rows. Idempotent — safe to run on every load.
  await syncClerkUserToSupabase(userId);

  const supabase = await createSupabaseServerClient();

  const [{ data: profile }, { data: verifications }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('verifications').select('channel, verified_at, handle').eq('user_id', userId),
  ]);

  const verifiedChannels = new Set(
    (verifications ?? []).filter((v) => v.verified_at).map((v) => v.channel),
  );
  // Google counts toward the 2-of-4 minimum alongside the four channels below
  // Email is intentionally NOT counted — every Clerk sign-up verifies an
  // email, so counting it would give a free badge. Google (via OAuth link)
  // still counts. The minimum is ≥2 of the available channels (LinkedIn,
  // X, WhatsApp, Google).
  const verifiedCount = verifiedChannels.size;
  const canPost = verifiedCount >= 2;

  return (
    <div className="container max-w-3xl py-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Onboarding</p>
        <h1 className="font-serif text-3xl">
          Welcome to Saathi, {profile?.display_name ?? 'friend'}.
        </h1>
        <p className="text-muted-foreground">
          Connect at least two verification channels, then tell us a little about yourself.
          Everything below takes under five minutes.
        </p>
      </header>

      {canPost ? (
        <Alert variant="warm" className="mt-6">
          <Check className="size-4" />
          <AlertTitle>You&apos;re verified.</AlertTitle>
          <AlertDescription>
            You can now post trips and send requests.{' '}
            <a href="/post/request" className="underline">
              Post a request
            </a>{' '}
            or{' '}
            <a href="/post/offer" className="underline">
              offer to help
            </a>
            .
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mt-6">
          <AlertTitle>
            You need {2 - verifiedCount} more channel{verifiedCount === 1 ? '' : 's'}.
          </AlertTitle>
          <AlertDescription>
            Two verified channels are the minimum before posting or requesting a Saathi. Pick any
            two below.
          </AlertDescription>
        </Alert>
      )}

      <section className="mt-8 space-y-4">
        <h2 className="font-serif text-xl">Verification channels</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {CHANNELS.map(({ id, label, blurb, icon: Icon, linkable }) => {
            const verified = verifiedChannels.has(id);
            return (
              <Card key={id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Icon className="size-5 text-saffron-600" aria-hidden />
                      <div className="font-serif text-lg">{label}</div>
                    </div>
                    {verified ? (
                      <Badge variant="success" className="gap-1">
                        <Check className="size-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="muted">Not linked</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{blurb}</p>
                  {!verified && linkable && (id === 'linkedin' || id === 'twitter') ? (
                    <LinkOAuthButton provider={id} />
                  ) : null}
                  {id === 'whatsapp' ? <WhatsAppVerify alreadyVerified={verified} /> : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl">About you</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These show up on your profile and drive matching.
        </p>
        <div className="mt-4">
          {profile ? (
            <ProfileBasics
              initial={{
                role: profile.role,
                display_name: profile.display_name ?? '',
                full_name: profile.full_name ?? '',
                bio: profile.bio ?? '',
                languages: profile.languages ?? [],
                primary_language: profile.primary_language,
                gender: profile.gender ?? '',
                photo_url: profile.photo_url ?? '',
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Profile is still being created. Refresh in a moment — the Clerk webhook creates it on
              signup.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
