'use client';

import { usePathname } from 'next/navigation';

/**
 * Renders children only when the current pathname does NOT match any of
 * the provided path prefixes. Used in the root layout to hide the site
 * header + footer on focused flows like /onboarding — the first-time
 * user shouldn't see "Browse / Dashboard / Post a trip" links before
 * they've even filled their profile.
 *
 * Matching is prefix-based (startsWith), so passing ['/onboarding']
 * also hides on /onboarding/anything-below. Pass exact paths for
 * stricter control.
 */
export function HideOnRoute({
  paths,
  children,
}: {
  paths: readonly string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hide = paths.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (hide) return null;
  return <>{children}</>;
}
