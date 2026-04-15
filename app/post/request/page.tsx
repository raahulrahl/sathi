import { redirect } from 'next/navigation';

/**
 * Legacy redirect — /post/request moved under /dashboard/new/request.
 */
interface Props {
  searchParams: Promise<Record<string, string>>;
}

export default async function LegacyRequestRedirect({ searchParams }: Props) {
  const params = await searchParams;
  const qs = new URLSearchParams(params).toString();
  redirect(qs ? `/dashboard/new/request?${qs}` : '/dashboard/new/request');
}
