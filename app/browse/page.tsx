import { redirect } from 'next/navigation';

/**
 * Legacy redirect — /browse merged into the home page.
 * The home page now accepts the same query params (?from=&to=&date=&fn=)
 * and renders results when they're valid. Any bookmarks or shared links
 * that used /browse still land on the right state.
 */
interface Props {
  searchParams: Promise<Record<string, string>>;
}

export default async function LegacyBrowseRedirect({ searchParams }: Props) {
  const params = await searchParams;
  const qs = new URLSearchParams(params).toString();
  redirect(qs ? `/?${qs}` : '/');
}
