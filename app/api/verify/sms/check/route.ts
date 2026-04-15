/**
 * POST /api/verify/sms/check
 *
 * Validates the OTP the user typed back after receiving it via SMS.
 * On success, stamps whatsapp_number + whatsapp_validated_at on the
 * user's profile — same outcome as /api/verify/whatsapp/check.
 *
 * The OTP hash is phone-scoped, not channel-scoped, so checkSmsVerification
 * delegates directly to checkWhatsAppVerification — the DB read, expiry
 * check, constant-time compare, and profile stamp logic are identical.
 *
 * Responses:
 *   200 { ok: true }                 — code matched, profile stamped
 *   400 { ok: false, error: string } — bad input OR wrong/expired code
 *   401 { ok: false, error: string } — not signed in
 *   429 { ok: false, error: string } — rate limited
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { isPlausibleE164 } from '@/lib/verify';
import { checkSmsVerification } from '@/lib/sms-auth';

const Body = z.object({
  phone: z.string().trim(),
  code: z.string().regex(/^\d{4,10}$/),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  }

  const ip = clientIp(request.headers);
  const [userCheck, ipCheck] = await Promise.all([
    checkRateLimit(`sms-check:user:${userId}`),
    checkRateLimit(`sms-check:ip:${ip}`),
  ]);
  if (!userCheck.success || !ipCheck.success) {
    const failing = !userCheck.success ? userCheck : ipCheck;
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Try again in a minute.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, Math.ceil((failing.reset - Date.now()) / 1000))),
        },
      },
    );
  }

  const raw = await request.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success || !isPlausibleE164(parsed.data.phone)) {
    return NextResponse.json({ ok: false, error: 'Invalid phone or code' }, { status: 400 });
  }

  const approved = await checkSmsVerification(userId, parsed.data.phone, parsed.data.code).catch(
    () => false,
  );

  if (!approved) {
    return NextResponse.json({ ok: false, error: 'Code did not match' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
