import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Check, Linkedin, Mail, MessageCircle, Twitter } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { VerificationChannel } from '@/types/db';
import { LinkOAuthButton } from './link-oauth-button';
import { WhatsAppVerify } from './whatsapp-verify';
import { ProfileBasics } from './profile-basics';

export const metadata: Metadata = { title: 'Welcome to Sathi' };

const CHANNELS: Array<{
  id: VerificationChannel;
  label: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    blurb: 'A real employer and a real network. Strongest signal for families.',
    icon: Linkedin,
  },
  { id: 'twitter', label: 'X (Twitter)', blurb: 'Account age and post history.', icon: Twitter },
  {
    id: 'email',
    label: 'Email',
    blurb: 'Auto-verified on signup for email / magic-link / OAuth flows.',
    icon: Mail,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    blurb: 'A working WhatsApp number. Lingua franca for Indian parents.',
    icon: MessageCircle,
  },
];

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userResp } = await supabase.auth.getUser();
  if (!userResp.user) redirect('/auth/sign-in?next=/onboarding');

  const [{ data: profile }, { data: verifications }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userResp.user.id).maybeSingle(),
    supabase
      .from('verifications')
      .select('channel, verified_at, handle')
      .eq('user_id', userResp.user.id),
  ]);

  const verifiedChannels = new Set(
    (verifications ?? []).filter((v) => v.verified_at).map((v) => v.channel as VerificationChannel),
  );
  const verifiedCount = verifiedChannels.size;
  const canPost = verifiedCount >= 2;

  return (
    <div className="container max-w-3xl py-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Onboarding</p>
        <h1 className="font-serif text-3xl">
          Welcome to Sathi, {profile?.display_name ?? 'friend'}.
        </h1>
        <p className="text-muted-foreground">
          Connect at least two verification channels, then tell us a little about yourself.
          Everything below takes under five minutes.
        </p>
      </header>

      {canPost ? (
        <Alert variant="warm" className="mt-6">
          <Check className="size-4" />
          <AlertTitle>You're verified.</AlertTitle>
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
            Two verified channels are the minimum before posting or requesting a Sathi. Pick any two
            below.
          </AlertDescription>
        </Alert>
      )}

      <section className="mt-8 space-y-4">
        <h2 className="font-serif text-xl">Verification channels</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {CHANNELS.map(({ id, label, blurb, icon: Icon }) => {
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
                  {!verified && (id === 'linkedin' || id === 'twitter') ? (
                    <LinkOAuthButton provider={id} />
                  ) : null}
                  {!verified && id === 'email' ? (
                    <p className="text-xs text-muted-foreground">
                      Sign out and sign back in with email to verify. Most users already have this
                      badge.
                    </p>
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
              Profile is still being created. Refresh in a moment.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
