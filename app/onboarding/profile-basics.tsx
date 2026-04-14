'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { LANGUAGES } from '@/lib/languages';
import type { Role } from '@/types/db';
import { updateOwnProfileAction } from './actions';

interface ProfileBasicsProps {
  initial: {
    role: Role;
    display_name: string;
    full_name: string;
    bio: string;
    languages: string[];
    primary_language: string;
    gender: string;
    photo_url: string;
  };
}

export function ProfileBasics({ initial }: ProfileBasicsProps) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggleLanguage(l: string) {
    setState((s) => {
      const has = s.languages.includes(l);
      const next = has ? s.languages.filter((x) => x !== l) : [...s.languages, l];
      const primary = next.includes(s.primary_language) ? s.primary_language : (next[0] ?? l);
      return { ...s, languages: next, primary_language: primary };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    start(async () => {
      const result = await updateOwnProfileAction(state);
      if (result.ok) {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="role">I'm using Sathi as a…</Label>
          <select
            id="role"
            value={state.role}
            onChange={(e) => setState({ ...state, role: e.target.value as Role })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="family">Family member (posting on behalf of a parent)</option>
            <option value="companion">
              Companion (offering help on flights I'm already taking)
            </option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="display_name">Display name</Label>
          <Input
            id="display_name"
            value={state.display_name}
            onChange={(e) => setState({ ...state, display_name: e.target.value })}
            placeholder="Priya R."
            maxLength={60}
            required
          />
          <p className="text-xs text-muted-foreground">
            Shown publicly. Use first name + last initial.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            value={state.full_name}
            onChange={(e) => setState({ ...state, full_name: e.target.value })}
            placeholder="Priya Roy"
          />
          <p className="text-xs text-muted-foreground">Shown only after a match is accepted.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="photo_url">Photo URL</Label>
          <Input
            id="photo_url"
            type="url"
            value={state.photo_url}
            onChange={(e) => setState({ ...state, photo_url: e.target.value })}
            placeholder="https://…"
          />
          <p className="text-xs text-muted-foreground">
            Paste a square avatar for now — upload comes next sprint.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Short bio</Label>
        <Textarea
          id="bio"
          value={state.bio}
          onChange={(e) => setState({ ...state, bio: e.target.value })}
          rows={3}
          maxLength={500}
          placeholder="Berlin-based designer. Fly BER → BOM every winter."
        />
      </div>

      <div className="space-y-2">
        <Label>Languages you speak</Label>
        <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
          {LANGUAGES.map((l) => (
            <label key={l} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={state.languages.includes(l)}
                onCheckedChange={() => toggleLanguage(l)}
              />
              {l}
            </label>
          ))}
        </div>
      </div>

      {state.languages.length > 0 ? (
        <div className="space-y-1.5">
          <Label htmlFor="primary_language">Primary language</Label>
          <select
            id="primary_language"
            value={state.primary_language}
            onChange={(e) => setState({ ...state, primary_language: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {state.languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            The one you're most fluent in. Drives ranking — please be honest.
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          {saved ? 'Saved.' : 'Changes save when you hit update.'}
        </p>
        <Button type="submit" disabled={pending || state.languages.length === 0}>
          {pending ? 'Saving…' : 'Update profile'}
        </Button>
      </div>
    </form>
  );
}
