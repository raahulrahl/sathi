# Saathi

> **साथी** — companion. A matchmaking platform that pairs elderly travellers
> from immigrant families with solo travellers on the same flight route, so no
> parent has to navigate an unfamiliar airport alone.

This repository is the initial build of Saathi. See the full product spec in
`docs/spec.md` (or wherever your org stores it) for the full rationale. The
high-level shape:

- **Public browse**, auth-gated posting. Families post requests, companions
  post offers. Search matches by **shared language first**, then by date
  proximity, then route exactness and verification depth.
- **Verification is social-graph based.** Users must link ≥2 of LinkedIn, X,
  email, WhatsApp before they can post or send a request. No passport uploads.
- **Saathi never touches money.** The thank-you (€10–20) is settled directly
  between family and companion.

## Stack

- Next.js 15 (App Router, Server Actions, Server Components)
- Supabase (Postgres with RLS, Auth, Storage, Realtime)
- shadcn/ui + Tailwind
- Vercel for hosting, PostHog for analytics, Sentry for errors
- pnpm + Vitest + ESLint + Prettier + Husky + commitlint

## Getting started

```bash
# 1. Use the pinned Node version
nvm use               # reads .nvmrc → 20.18.0

# 2. Install
corepack enable
pnpm install

# 3. Copy env and fill in at least the Supabase keys
cp .env.example .env.local

# 4. Run
pnpm dev              # http://localhost:3000
```

## Scripts

| Script              | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `pnpm dev`          | Next.js dev server                             |
| `pnpm build`        | Production build                               |
| `pnpm lint`         | ESLint (Next + Tailwind + unused-imports)      |
| `pnpm format`       | Prettier write                                 |
| `pnpm format:check` | Prettier check (CI)                            |
| `pnpm typecheck`    | `tsc --noEmit`                                 |
| `pnpm test`         | Vitest run (watch: `pnpm test:watch`)          |
| `pnpm db:types`     | Regenerate `types/db.ts` from a linked project |
| `pnpm db:reset`     | Supabase local: reset + re-apply migrations    |
| `pnpm db:push`      | Supabase local: push migrations to remote      |

## Database

SQL lives under `supabase/migrations/`:

- `0001_init.sql` — schema (profiles, verifications, trips, match_requests,
  matches, messages, reviews, trip_photos, reports, blocks)
- `0002_rls.sql` — row-level security policies
- `0003_triggers.sql` — on-signup profile creation, match acceptance flow,
  identity → verification mirroring, completion flip
- `0004_views.sql` — PII-redacted `public_trips`, `public_profiles`,
  `public_verifications`, aggregate `profile_review_stats`

`types/db.ts` is a hand-authored stub of the schema types. When a real Supabase
project is linked, regenerate with `pnpm db:types`.

## Repo layout

```
app/
  (marketing)/             landing, about, trust, faq
  search/                  public browse + rank
  trip/[id]/               public trip detail + request form
  profile/[id]/            public profile
  post/{request,offer}/    auth-gated wizards
  onboarding/              ≥2 verification channels + profile basics
  dashboard/               my trips + incoming/sent + matches
  match/[id]/              match thread (chat/reviews stubbed)
  auth/                    sign-in, callback, sign-out
  api/
    verify/whatsapp/       Twilio Verify start + check
    cron/auto-complete/    48h auto-complete job
components/
  ui/                      shadcn primitives
  trip-card, route-line, language-chip, verified-badge, …
lib/
  matching.ts              ranking function + tests
  iata.ts                  embedded airport data (swap for `airport-codes` pkg)
  languages.ts             languages + help categories
  supabase/                server / client / middleware helpers
  verify.ts                Twilio Verify wrapper
  moderation.ts            OpenAI moderation wrapper
  utils.ts                 cn()
supabase/migrations/       schema + RLS + triggers + views
types/db.ts                hand-authored until `pnpm db:types`
```

## What's stubbed in v1

Per spec §11, the following are intentionally not fleshed out yet:

- In-app chat (match thread shows contact info only; realtime comes next sprint)
- Reviews UI (table + RLS are live; form ships alongside chat)
- Trip photo uploads + consent flow
- Admin panel (reports table exists, no UI yet)
- `/terms`, `/privacy`, `/report` pages

## Commit style

[Conventional Commits](https://www.conventionalcommits.org/). `commitlint`
enforces this via a Husky `commit-msg` hook.
