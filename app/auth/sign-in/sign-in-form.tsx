'use client';

import { useState, useTransition } from 'react';
import { Linkedin, Mail, Twitter } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type OAuthProvider = 'google' | 'linkedin_oidc' | 'twitter';

function providerLabel(p: OAuthProvider): string {
  return p === 'google' ? 'Google' : p === 'linkedin_oidc' ? 'LinkedIn' : 'X';
}

export function SignInForm({ nextPath, serverError }: { nextPath: string; serverError?: string }) {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    { kind: 'idle' } | { kind: 'sent' } | { kind: 'error'; message: string }
  >({ kind: 'idle' });
  const [pending, start] = useTransition();

  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
      : undefined;

  async function signInWithOAuth(provider: OAuthProvider) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      ...(redirectTo ? { options: { redirectTo } } : {}),
    });
    if (error) setStatus({ kind: 'error', message: error.message });
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: 'idle' });
    start(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        ...(redirectTo ? { options: { emailRedirectTo: redirectTo } } : {}),
      });
      if (error) setStatus({ kind: 'error', message: error.message });
      else setStatus({ kind: 'sent' });
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
          <AlertTitle>Couldn't sign in</AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Button variant="outline" size="lg" onClick={() => signInWithOAuth('google')}>
          <GoogleMark className="size-4" />
          Continue with Google
        </Button>
        <Button variant="outline" size="lg" onClick={() => signInWithOAuth('linkedin_oidc')}>
          <Linkedin className="size-4" />
          Continue with LinkedIn
        </Button>
        <Button variant="outline" size="lg" onClick={() => signInWithOAuth('twitter')}>
          <Twitter className="size-4" />
          Continue with {providerLabel('twitter')}
        </Button>
      </div>

      <div className="flex items-center gap-3 py-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
        <Separator className="flex-1" />
        or
        <Separator className="flex-1" />
      </div>

      <form onSubmit={sendMagicLink} className="space-y-3">
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
        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending ? 'Sending…' : 'Send me a magic link'}
        </Button>
        {status.kind === 'sent' ? (
          <p className="text-sm text-emerald-700">Check your inbox — click the link to finish.</p>
        ) : null}
      </form>
    </div>
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
