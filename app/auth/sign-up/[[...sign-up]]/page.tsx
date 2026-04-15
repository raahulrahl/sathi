import type { Metadata } from 'next';
import { SignUp } from '@clerk/nextjs';

export const metadata: Metadata = { title: 'Create your Saathi account' };

/**
 * Sign-up route. Mirror of sign-in — same catch-all pattern, same reason.
 * The route was referenced by NEXT_PUBLIC_CLERK_SIGN_UP_URL in the env but
 * didn't exist on disk; anyone clicking "Sign up" from the Clerk widget got
 * a 404. Creating it now closes that gap.
 */
export default function SignUpPage() {
  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-14">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">
            Create your <span className="text-marigold-700">Saathi</span> account
          </h1>
          <p className="text-sm text-warm-charcoal">
            Takes a minute. You can link more accounts later to strengthen trust.
          </p>
        </div>

        <SignUp
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
          signInForceRedirectUrl="/onboarding"
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
