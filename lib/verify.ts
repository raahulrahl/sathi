/**
 * Twilio Lookup wrapper + shared E.164 check.
 *
 * OTP verification used to live here too (Twilio Verify), but we migrated
 * the OTP flow to `lib/whatsapp-auth.ts` — it uses the Messages API
 * directly, which is 10× cheaper and side-steps the multi-layered
 * Messaging-Service-attached-to-Verify-Service setup that kept erroring
 * with 68008. This file now only handles Lookup ("is this phone number
 * real?") used at onboarding save time.
 */

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
