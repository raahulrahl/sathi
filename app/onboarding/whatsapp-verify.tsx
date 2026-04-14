'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Phase = 'idle' | 'sent' | 'verified' | 'error';

export function WhatsAppVerify({ alreadyVerified }: { alreadyVerified: boolean }) {
  const [phase, setPhase] = useState<Phase>(alreadyVerified ? 'verified' : 'idle');
  const [phone, setPhone] = useState('+');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function sendCode() {
    setMessage(null);
    start(async () => {
      const res = await fetch('/api/verify/whatsapp/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setMessage(json.error ?? 'Failed to send WhatsApp code.');
        setPhase('error');
      } else {
        setPhase('sent');
      }
    });
  }

  async function checkCode() {
    setMessage(null);
    start(async () => {
      const res = await fetch('/api/verify/whatsapp/check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setPhase('verified');
      } else {
        setMessage(json.error ?? 'That code did not match.');
        setPhase('sent');
      }
    });
  }

  if (phase === 'verified') {
    return <p className="text-sm text-emerald-700">WhatsApp linked.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor="wa-phone">WhatsApp number</Label>
        <Input
          id="wa-phone"
          inputMode="tel"
          placeholder="+91 98xx…"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      {phase === 'sent' ? (
        <div className="space-y-1">
          <Label htmlFor="wa-code">6-digit code</Label>
          <Input
            id="wa-code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
        </div>
      ) : null}
      <div className="flex gap-2">
        {phase !== 'sent' ? (
          <Button size="sm" onClick={sendCode} disabled={pending || phone.length < 8}>
            {pending ? 'Sending…' : 'Send code'}
          </Button>
        ) : (
          <>
            <Button size="sm" onClick={checkCode} disabled={pending || code.length < 4}>
              {pending ? 'Checking…' : 'Verify'}
            </Button>
            <Button size="sm" variant="ghost" onClick={sendCode} disabled={pending}>
              Resend
            </Button>
          </>
        )}
      </div>
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
    </div>
  );
}
