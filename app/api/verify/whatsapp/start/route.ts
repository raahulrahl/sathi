import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isPlausibleE164, startWhatsAppVerification } from '@/lib/verify';

const Body = z.object({ phone: z.string().trim() });

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: userResp } = await supabase.auth.getUser();
  if (!userResp.user) {
    return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success || !isPlausibleE164(parsed.data.phone)) {
    return NextResponse.json(
      { ok: false, error: 'Enter a WhatsApp number in international format, e.g. +91…' },
      { status: 400 },
    );
  }

  try {
    await startWhatsAppVerification(parsed.data.phone);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to start verification';
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
