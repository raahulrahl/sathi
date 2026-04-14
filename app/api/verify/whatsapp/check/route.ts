import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkWhatsAppVerification, isPlausibleE164 } from '@/lib/verify';

const Body = z.object({
  phone: z.string().trim(),
  code: z.string().regex(/^\d{4,10}$/),
});

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success || !isPlausibleE164(parsed.data.phone)) {
    return NextResponse.json({ ok: false, error: 'Invalid phone or code' }, { status: 400 });
  }

  const approved = await checkWhatsAppVerification(parsed.data.phone, parsed.data.code).catch(
    () => false,
  );
  if (!approved) {
    return NextResponse.json({ ok: false, error: 'Code did not match' }, { status: 400 });
  }

  // Mirror the verification into the DB — matches the trigger behavior for
  // OAuth identities, but for WhatsApp we do it from the API route.
  const { error } = await supabase.from('verifications').upsert(
    {
      user_id: userId,
      channel: 'whatsapp',
      handle: parsed.data.phone,
      verified_at: new Date().toISOString(),
      proof: { channel: 'whatsapp', via: 'twilio_verify' },
    },
    { onConflict: 'user_id,channel' },
  );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
