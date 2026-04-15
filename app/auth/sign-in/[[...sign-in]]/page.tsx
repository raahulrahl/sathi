import type { Metadata } from 'next';
import { SignIn } from '@clerk/nextjs';

export const metadata: Metadata = { title: 'Sign in' };

/**
 * Sign-in route. Uses Clerk's <SignIn /> component rather than a custom form.
 *
 * Why the swap from the earlier custom SignInForm:
 *   - That form used Clerk's experimental "future" API (signIn.emailCode.sendCode
 *     etc.), which kept moving between Clerk versions and broke outright on v7.1.
 *   - Clerk's own <SignIn /> handles email codes, OAuth (LinkedIn + X), MFA,
 *     step-up reverification, error states, and loading states for us — all
 *     the edge cases we'd otherwise reinvent.
 *   - The catch-all folder name ([[...sign-in]]) is mandatory: Clerk uses
 *     sub-paths like /auth/sign-in/factor-one for multi-step flows. Without
 *     the catch-all, a user mid-flow hits a 404 and gets kicked out.
 *
 * The sso-callback route is also gone — Clerk handles the OAuth redirect
 * inline at this same URL when it's set up as a catch-all.
 *
 * Theming: <SignIn /> inherits most of its look from the dashboard's
 * Customization settings. We only override a handful of classes to make the
 * card feel consistent with the Clay/marigold theme.
 */
export default function SignInPage() {
  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-14">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">
            Sign in to <span className="text-marigold-700">Saathi</span>
          </h1>
          <p className="text-sm text-warm-charcoal">
            Use whichever is easiest — you can link more later to strengthen your profile.
          </p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full mx-auto',
              card: 'shadow-none border border-oat bg-white rounded-2xl',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              formButtonPrimary:
                'bg-foreground hover:bg-foreground/90 text-background rounded-full',
              socialButtonsBlockButton: 'border-oat rounded-full',
              footerActionLink: 'text-marigold-700',
            },
            variables: {
              colorPrimary: '#2e241c',
              colorText: '#2e241c',
              colorTextSecondary: '#4a3d32',
              colorBackground: '#ffffff',
              borderRadius: '0.75rem',
            },
          }}
          forceRedirectUrl="/onboarding"
          signUpForceRedirectUrl="/onboarding"
        />

        <p className="text-center text-xs text-warm-silver">
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
