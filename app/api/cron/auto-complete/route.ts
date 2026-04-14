import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

/**
 * Auto-complete matches 48h after the travel date if neither party disputed.
 * Intended to be hit on a daily Vercel Cron. Secured with CRON_SECRET in the
 * Authorization header. See Product Spec §6.1 — pg_cron is also an option,
 * but this lives next to the app for easy iteration in v1.
 */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const header = request.headers.get('authorization');
    if (header !== `Bearer ${expected}`) {
      return NextResponse.json({ ok: false, error: 'unauthorised' }, { status: 401 });
    }
  }

  const supabase = createSupabaseServiceClient();
  const now = new Date();
  const cutoff = new Date(now.getTime() - 48 * 3600 * 1000).toISOString().slice(0, 10);

  // Find active matches where travel_date is older than cutoff.
  const { data: candidates, error } = await supabase
    .from('matches')
    .select('id, trip:trips!inner(travel_date)')
    .eq('status', 'active')
    .lte('trip.travel_date', cutoff);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let updated = 0;
  for (const row of candidates ?? []) {
    const { error: e } = await supabase
      .from('matches')
      .update({
        poster_marked_complete: true,
        requester_marked_complete: true,
      })
      .eq('id', row.id);
    if (!e) updated += 1;
  }

  return NextResponse.json({ ok: true, updated });
}
