import { redirect } from 'next/navigation';

/**
 * Legacy redirect — /search moved to /browse because "browse" is the
 * actual verb on this page (scanning who's on your flight), and the
 * header nav already calls it that. Kept so bookmarks and shared
 * search URLs don't dead-end. Forwards query params untouched.
 */
interface Props {
  searchParams: Promise<Record<string, string>>;
}

export default async function LegacySearchRedirect({ searchParams }: Props) {
  const params = await searchParams;
  const qs = new URLSearchParams(params).toString();
  redirect(qs ? `/browse?${qs}` : '/browse');
}
