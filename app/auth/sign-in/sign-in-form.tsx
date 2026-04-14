'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn, useSignUp } from '@clerk/nextjs';

type OAuthStrategy = 'oauth_google' | 'oauth_linkedin_oidc' | 'oauth_x';
import { Linkedin, Mail, Twitter } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

/**
 * Custom sign-in / sign-up flow using Clerk v7's "future" API. The flow:
 *   1. User enters email. We try `signIn.emailCode.sendCode()`. If Clerk
 *      reports "no account", we fall through to `signUp.create() +
 *      sendEmailCode()` to enroll them.
 *   2. Inline 6-digit code entry. `verifyCode()` on whichever resource we
 *      started. `signIn.finalize()` or `signUp.finalize()` sets the session.
 *   3. Each OAuth button calls `signIn.sso()` with the strategy. Clerk
 *      redirects to the provider and returns to /auth/sso-callback which
 *      finishes the exchange.
 */

interface SignInFormProps {
  afterSignInUrl: string;
  serverError?: string;
}

export function SignInForm({ afterSignInUrl, serverError }: SignInFormProps) {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [status, setStatus] = useState<{ kind: 'idle' } | { kind: 'error'; message: string }>({
    kind: 'idle',
  });
  const [pending, start] = useTransition();

  async function oauth(strategy: OAuthStrategy) {
    if (!signIn) return;
    const redirectUrl = `${window.location.origin}/auth/sso-callback`;
    const { error } = await signIn.sso({
      strategy,
      redirectUrl,
      redirectCallbackUrl: redirectUrl,
    });
    if (error) setStatus({ kind: 'error', message: errorMessage(error) });
  }

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn || !signUp) return;
    setStatus({ kind: 'idle' });
    start(async () => {
      // Try sign-in first.
      const signInAttempt = await signIn.emailCode.sendCode({ emailAddress: email });
      if (!signInAttempt.error) {
        setMode('sign-in');
        setStage('code');
        return;
      }
      // If the account doesn't exist, fall through to sign-up.
      if (!isNoAccountError(signInAttempt.error)) {
        setStatus({ kind: 'error', message: errorMessage(signInAttempt.error) });
        return;
      }
      const create = await signUp.create({ emailAddress: email });
      if (create.error) {
        setStatus({ kind: 'error', message: errorMessage(create.error) });
        return;
      }
      const sendCode = await signUp.verifications.sendEmailCode();
      if (sendCode.error) {
        setStatus({ kind: 'error', message: errorMessage(sendCode.error) });
        return;
      }
      setMode('sign-up');
      setStage('code');
    });
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn || !signUp) return;
    setStatus({ kind: 'idle' });
    start(async () => {
      if (mode === 'sign-in') {
        const verify = await signIn.emailCode.verifyCode({ code });
        if (verify.error) {
          setStatus({ kind: 'error', message: errorMessage(verify.error) });
          return;
        }
        const finalized = await signIn.finalize({
          navigate: async () => {
            router.push(afterSignInUrl);
          },
        });
        if (finalized.error) {
          setStatus({ kind: 'error', message: errorMessage(finalized.error) });
        }
      } else {
        const verify = await signUp.verifications.verifyEmailCode({ code });
        if (verify.error) {
          setStatus({ kind: 'error', message: errorMessage(verify.error) });
          return;
        }
        const finalized = await signUp.finalize({
          navigate: async () => {
            router.push(afterSignInUrl);
          },
        });
        if (finalized.error) {
          setStatus({ kind: 'error', message: errorMessage(finalized.error) });
        }
      }
    });
  }

  return (
    <div className="space-y-4">
      {serverError ? (
        <Alert variant="destructive">
          <AlertTitle>Sign-in failed</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}
      {status.kind === 'error' ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t sign in</AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      ) : null}

      {stage === 'email' ? (
        <>
          <div className="grid gap-2">
            <Button variant="outline" size="lg" onClick={() => oauth('oauth_google')}>
              <GoogleMark className="size-4" />
              Continue with Google
            </Button>
            <Button variant="outline" size="lg" onClick={() => oauth('oauth_linkedin_oidc')}>
              <Linkedin className="size-4" />
              Continue with LinkedIn
            </Button>
            <Button variant="outline" size="lg" onClick={() => oauth('oauth_x')}>
              <Twitter className="size-4" />
              Continue with X
            </Button>
          </div>

          <div className="flex items-center gap-3 py-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
            <Separator className="flex-1" />
            or
            <Separator className="flex-1" />
          </div>

          <form onSubmit={requestCode} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Button type="submit" size="lg" disabled={pending || !signIn} className="w-full">
              {pending ? 'Sending…' : 'Email me a sign-in code'}
            </Button>
          </form>
        </>
      ) : (
        <form onSubmit={submitCode} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to <b>{email}</b>.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="123456"
              required
              value={code}
              onChange={(ev) => setCode(ev.target.value.replace(/\D/g, ''))}
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" disabled={pending || code.length < 6} className="w-full">
            {pending ? 'Verifying…' : 'Sign in'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setStage('email');
              setCode('');
            }}
            className="w-full"
          >
            Use a different email
          </Button>
        </form>
      )}
    </div>
  );
}

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'errors' in err) {
    const first = (err as { errors?: Array<{ longMessage?: string; message?: string }> })
      .errors?.[0];
    return first?.longMessage ?? first?.message ?? 'Something went wrong.';
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}

function isNoAccountError(err: unknown): boolean {
  const msg = errorMessage(err).toLowerCase();
  return (
    msg.includes("couldn't find your account") ||
    msg.includes('no account') ||
    msg.includes('identifier')
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.49-1.12 2.75-2.37 3.6v3h3.83c2.24-2.06 3.59-5.1 3.59-8.84z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.83-3c-1.07.72-2.44 1.15-4.11 1.15-3.17 0-5.85-2.14-6.81-5.02H1.24v3.15C3.22 21.3 7.32 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.19 14.22A7.2 7.2 0 014.8 12c0-.77.13-1.52.39-2.22V6.63H1.24A12 12 0 000 12c0 1.93.46 3.76 1.24 5.37l3.95-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.4-3.4C17.95 1.17 15.23 0 12 0 7.32 0 3.22 2.7 1.24 6.63l3.95 3.15C6.15 6.89 8.83 4.75 12 4.75z"
      />
    </svg>
  );
}
