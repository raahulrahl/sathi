import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import './globals.css';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const serif = Fraunces({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'Saathi — a companion on the flight home',
    template: '%s · Saathi',
  },
  description:
    'Saathi pairs elderly travellers with solo travellers already flying the same route, so no parent has to navigate an unfamiliar airport alone.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://saathi.travel'),
  openGraph: {
    type: 'website',
    siteName: 'Saathi',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: 'hsl(21 90% 48%)', // saffron-600 — matches our primary
          borderRadius: '0.75rem',
          fontFamily: 'var(--font-sans), system-ui, sans-serif',
        },
      }}
    >
      <html lang="en" className={`${sans.variable} ${serif.variable}`}>
        <body className="flex min-h-screen flex-col font-sans">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </body>
      </html>
    </ClerkProvider>
  );
}
