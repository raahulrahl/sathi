import { redirect } from 'next/navigation';

/**
 * Legacy redirect — /post/offer moved under /dashboard/new/offer.
 * Kept so any external bookmarks, shared links, or search-engine
 * results don't dead-end. Forwards query params untouched.
 */
interface Props {
  searchParams: Promise<Record<string, string>>;
}

export default async function LegacyOfferRedirect({ searchParams }: Props) {
  const params = await searchParams;
  const qs = new URLSearchParams(params).toString();
  redirect(qs ? `/dashboard/new/offer?${qs}` : '/dashboard/new/offer');
}
