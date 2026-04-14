import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SignInForm } from './sign-in-form';

export const metadata: Metadata = { title: 'Sign in' };

interface SignInPageProps {
  searchParams: Promise<{ redirect_url?: string; error?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { redirect_url, error } = await searchParams;
  return (
    <div className="container flex min-h-[70vh] items-center py-14">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-serif text-3xl">Sign in to Saathi</h1>
          <p className="text-sm text-muted-foreground">
            Use whichever is easiest — you can link the rest later to strengthen your profile.
          </p>
        </div>
        <Suspense>
          <SignInForm
            afterSignInUrl={redirect_url ?? '/onboarding'}
            {...(error ? { serverError: error } : {})}
          />
        </Suspense>
        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to Saathi&apos;s{' '}
          <a href="/terms" className="underline">
            Terms
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline">
            Privacy
          </a>
          . We verify your social graph — never your passport.
        </p>
      </div>
    </div>
  );
}
