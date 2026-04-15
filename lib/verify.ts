/**
 * Twilio Verify wrapper for WhatsApp OTP. See Product Spec §8.
 *
 * We use Verify directly (not Supabase phone auth) so the OTP lands in
 * WhatsApp, not SMS — Indian parents overwhelmingly expect WhatsApp.
 *
 * Runtime dependency: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 * TWILIO_VERIFY_SERVICE_SID. In dev without creds, both functions no-op with a
 * clear error so the UI can show a stub banner.
 */

const TWILIO_BASE = 'https://verify.twilio.com/v2';

function creds() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!sid || !token || !serviceSid) {
    throw new Error('Twilio Verify is not configured. Set TWILIO_* env vars.');
  }
  return { sid, token, serviceSid };
}

function auth(sid: string, token: string) {
  // Web-standard btoa works in Edge + Node 20.
  return `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`;
}

/** Kick off a verification — Twilio sends an OTP to the WhatsApp number. */
export async function startWhatsAppVerification(toE164: string) {
  const { sid, token, serviceSid } = creds();
  const res = await fetch(`${TWILIO_BASE}/Services/${serviceSid}/Verifications`, {
    method: 'POST',
    headers: {
      Authorization: auth(sid, token),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: toE164, Channel: 'whatsapp' }),
  });
  if (!res.ok) {
    throw new Error(`Twilio Verify start failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as { sid: string; status: string };
}

/** Check a code submitted by the user. Returns true iff Twilio says "approved". */
export async function checkWhatsAppVerification(toE164: string, code: string): Promise<boolean> {
  const { sid, token, serviceSid } = creds();
  const res = await fetch(`${TWILIO_BASE}/Services/${serviceSid}/VerificationCheck`, {
    method: 'POST',
    headers: {
      Authorization: auth(sid, token),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: toE164, Code: code }),
  });
  if (!res.ok) return false;
  const body = (await res.json()) as { status?: string };
  return body.status === 'approved';
}

/** Very simple E.164 check. Good enough for the form; Twilio rejects the rest. */
export function isPlausibleE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

/**
 * Twilio Lookup v2 — verifies the number is real, assigned to a carrier,
 * and returns its canonical international format. Used at onboarding to
 * catch typos and fake numbers before they land in the profiles table.
 *
 * Returns:
 *   { valid: true,  e164 } — Twilio says this is a live, callable number
 *   { valid: false, error } — invalid format, unassigned, or Twilio
 *                              couldn't resolve it
 *   { valid: null,  warning } — Lookup isn't configured (no Twilio creds);
 *                               caller should fall through to whatever
 *                               libphonenumber-js said and accept the
 *                               number. Shipped pre-launch so local dev
 *                               and preview deploys without Twilio keys
 *                               still work — we don't block signups just
 *                               because a third-party is down or unwired.
 *
 * Cost: Lookup v2 basic (what we use here) is free for the first few
 * thousand requests/month on new Twilio accounts and cheap after. If we
 * outgrow the free tier, cache by phone number for 30 days since real
 * numbers rarely change carrier status that fast.
 */
export async function lookupPhoneNumber(
  phone: string,
): Promise<
  { valid: true; e164: string } | { valid: false; error: string } | { valid: null; warning: string }
> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    return { valid: null, warning: 'Twilio Lookup not configured — skipping live validation.' };
  }

  try {
    const url = `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(phone)}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      },
    });

    if (!res.ok) {
      // 404 here = Twilio couldn't parse the number at all. Treat as invalid
      // rather than propagating a cryptic HTTP error to the user.
      if (res.status === 404) {
        return { valid: false, error: "That number didn't look valid — double-check the digits." };
      }
      // Other statuses (401 = bad creds, 429 = rate limit, 5xx = Twilio down)
      // aren't the user's fault. Fall through with a warning so we don't
      // block signups on an operational hiccup.
      return {
        valid: null,
        warning: `Twilio Lookup returned ${res.status} — accepting the number without live check.`,
      };
    }

    const data = (await res.json()) as {
      valid?: boolean;
      phone_number?: string;
      validation_errors?: string[];
    };

    if (data.valid === false) {
      const reason = data.validation_errors?.[0];
      return {
        valid: false,
        error: reason
          ? `Twilio says: ${reason.replace(/_/g, ' ').toLowerCase()}.`
          : "That number isn't a live phone number. Check the country code and digits.",
      };
    }

    return {
      valid: true,
      e164: data.phone_number ?? phone,
    };
  } catch (err) {
    // Network error, DNS, firewall, whatever — don't block the user on
    // infrastructure problems outside their control.
    return {
      valid: null,
      warning: `Twilio Lookup threw: ${err instanceof Error ? err.message : 'unknown error'}`,
    };
  }
}
