import 'server-only';

import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { Redis } from '@upstash/redis';

/**
 * WhatsApp OTP verification via Twilio's Messages API direct, not their
 * Verify product.
 *
 * Why: Twilio Verify costs ~$0.05/verification and needs a separate
 * "Messaging Service attached to Verify" dance that kept failing for
 * us with error 68008. The Messages API (`api.twilio.com/.../Messages.json`)
 * uses the same sandbox sender we already have working, costs ~$0.005
 * per message (10× cheaper), and has no extra per-service setup.
 *
 * The trade-off is we own the OTP lifecycle ourselves:
 *
 *   1. Generate a cryptographically random 6-digit code (crypto.randomInt,
 *      never Math.random — uniform distribution matters for short codes).
 *
 *   2. Store its HASH (not plaintext) in Upstash Redis with a 10-minute TTL.
 *      Hashing means a Redis leak doesn't reveal live codes. Key is the
 *      phone number, so the same number can't have two concurrent codes.
 *
 *   3. Send the code via Twilio Messages API using a pre-approved
 *      Content Template that takes {{1}} = code. For the sandbox this
 *      is HX229f5a04fd0510ce1b071852155d3e75 ("*{{1}}* is your
 *      verification code...").
 *
 *   4. Check a submitted code using timingSafeEqual (constant time) and
 *      delete the Redis entry whether the check passes or fails. Success:
 *      prevents replay. Failure: prevents brute force — attacker has to
 *      request a new code, which re-triggers rate limits at the route.
 *
 * What this module does NOT own:
 *   - Rate limiting (lib/rate-limit.ts at the API route layer)
 *   - Clerk session auth (API route checks before calling us)
 *   - Twilio Sandbox recipient opt-in (user-side manual step)
 *
 * Env vars required:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_WHATSAPP_FROM          — e.g. "whatsapp:+14155238886" (sandbox)
 *   TWILIO_WHATSAPP_OTP_CONTENT_SID — e.g. "HX229f5a04fd0510ce1b071852155d3e75"
 *   UPSTASH_REDIS_REST_URL + _TOKEN — OTP storage
 *
 * Fail-closed by design: if Redis or Twilio are misconfigured we throw,
 * and the API route returns a 502. Better to see "try again" than to
 * receive an OTP we can't verify.
 */

// -----------------------------------------------------------------------------
// Internal: OTP generation, hashing, constant-time compare
// -----------------------------------------------------------------------------

/**
 * Return a new 6-digit OTP as a zero-padded string. Uses
 * crypto.randomInt for a uniform distribution — Math.random() is not
 * uniform enough for authentication codes.
 */
function generateOtp(): string {
  return String(randomInt(1_000_000)).padStart(6, '0');
}

/**
 * Hash an OTP for storage. SHA-256 is overkill for 6-digit codes but
 * cheap — we don't optimise away the defensive choice. Salt = phone
 * number so identical OTPs for different users don't hash to the same
 * value.
 */
function hashOtp(phone: string, code: string): string {
  return createHash('sha256').update(`${phone}:${code}`).digest('hex');
}

/**
 * Constant-time string comparison. Prevents response-timing brute force
 * against the stored hash. timingSafeEqual requires equal-length inputs
 * and throws otherwise, so we check length first.
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// -----------------------------------------------------------------------------
// Redis: OTP storage
// -----------------------------------------------------------------------------

const OTP_TTL_SECONDS = 10 * 60; // 10 min — long enough to find WhatsApp, short enough to not linger
const OTP_KEY_PREFIX = 'saathi_wa_otp:';

let cachedRedis: Redis | null | undefined;

function getRedis(): Redis {
  if (cachedRedis !== undefined && cachedRedis !== null) return cachedRedis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      'Upstash Redis not configured. WhatsApp OTP requires UPSTASH_REDIS_REST_URL + _TOKEN.',
    );
  }
  cachedRedis = new Redis({ url, token });
  return cachedRedis;
}

/** Key format: `saathi_wa_otp:{E.164 phone}`. */
function otpKey(phone: string): string {
  return `${OTP_KEY_PREFIX}${phone}`;
}

// -----------------------------------------------------------------------------
// Twilio Messages API
// -----------------------------------------------------------------------------

interface TwilioSendResult {
  ok: boolean;
  /** Twilio's message SID when ok; error string otherwise. */
  detail: string;
}

/**
 * POST to Twilio's Messages API with the OTP-carrying content template.
 * Handles the `whatsapp:` prefix so callers can pass plain E.164 in.
 * Redacts the code from any error detail returned to avoid leaking live
 * codes via server logs.
 */
async function sendOtpMessage(phone: string, code: string): Promise<TwilioSendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const contentSid = process.env.TWILIO_WHATSAPP_OTP_CONTENT_SID;

  if (!sid || !token || !from || !contentSid) {
    return {
      ok: false,
      detail:
        'Twilio WhatsApp not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, and TWILIO_WHATSAPP_OTP_CONTENT_SID.',
    };
  }

  const to = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
  const body = new URLSearchParams({
    To: to,
    From: from,
    ContentSid: contentSid,
    ContentVariables: JSON.stringify({ '1': code }),
  });

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return {
      ok: false,
      detail: `Twilio Messages ${res.status}: ${text.replace(code, '***')}`,
    };
  }

  // Twilio returns 201 with a payload that may include error_code even
  // on the 2xx path (queued-but-rejected cases). Surface those too.
  const json = (await res.json().catch(() => ({}))) as {
    sid?: string;
    status?: string;
    error_code?: number | null;
    error_message?: string | null;
  };
  if (json.error_code) {
    return {
      ok: false,
      detail: `Twilio error ${json.error_code}: ${json.error_message ?? 'unknown'}`,
    };
  }
  return { ok: true, detail: json.sid ?? 'sent' };
}

// -----------------------------------------------------------------------------
// Public API — called from app/api/verify/whatsapp/*
// -----------------------------------------------------------------------------

/**
 * Start a WhatsApp OTP verification for `toE164`. Generates a code,
 * stores its hash in Redis with a 10-minute TTL, and sends the code
 * on WhatsApp via Twilio's Messages API.
 *
 * Throws on configuration errors (Redis / Twilio env missing) or on
 * Twilio send errors (e.g. 63016 = recipient outside sandbox window).
 * Returns the Twilio message SID for server-side logging.
 */
export async function startWhatsAppVerification(toE164: string): Promise<string> {
  const code = generateOtp();
  const hashed = hashOtp(toE164, code);

  const redis = getRedis();
  await redis.set(otpKey(toE164), hashed, { ex: OTP_TTL_SECONDS });

  const sent = await sendOtpMessage(toE164, code);
  if (!sent.ok) {
    // Clean up — user will never get this code, so don't leave the
    // hash orphaned in Redis blocking retries.
    await redis.del(otpKey(toE164)).catch(() => undefined);
    throw new Error(sent.detail);
  }
  return sent.detail;
}

/**
 * Check a submitted `code` against the hash stored for `toE164`.
 * Returns true iff the code matches AND hasn't expired. Deletes the
 * Redis entry either way — success prevents replay, failure prevents
 * brute force.
 */
export async function checkWhatsAppVerification(toE164: string, code: string): Promise<boolean> {
  const cleanCode = code.trim().replace(/\D/g, '');
  if (cleanCode.length < 4 || cleanCode.length > 10) return false;

  const redis = getRedis();
  const key = otpKey(toE164);
  const stored = await redis.get<string>(key);
  if (!stored) return false; // expired or never existed

  const submittedHash = hashOtp(toE164, cleanCode);
  const ok = constantTimeEquals(submittedHash, stored);

  // Single-use regardless of outcome.
  await redis.del(key).catch(() => undefined);
  return ok;
}
