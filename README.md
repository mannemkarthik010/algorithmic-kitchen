# 🍳 The Algorithmic Kitchen

> *Cooking intelligent systems with machine learning, creativity, and curiosity.*

A Michelin-star futuristic AI portfolio for **Karthik Mannem** — ML Engineer & AI Systems Architect. Built with Next.js (App Router), TypeScript, and an OpenAI-powered chatbot ("ChefGPT").

## ✨ Sections

| Section | Theme |
|---|---|
| Hero | Animated intro with typewriter tagline & particle field |
| About | Chef's Story — timeline, education, certifications |
| Projects | Signature Recipes — 5 projects with ingredients & process |
| Skills | Ingredients Shelf — categorized tech stack |
| Experience | Kitchen Experience — roles with bullet points |
| Live Kitchen | Real-time status board |
| Reading Room | Bookshelf with favorites & philosophy |
| Contact | Reserve a Table — form + ChefGPT AI chatbot |
| Terminal | Hidden dev terminal (`Ctrl+\``) with `help`, `inspect <slug>`, etc. |

## 🚀 Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Fill in the values in `.env.local` — see [Environment Variables](#-environment-variables) below.

## ✅ Pre-deploy Checks

Run these before every deploy — all four must pass cleanly:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## 🔐 Environment Variables

All secrets are read **server-side only**, inside API routes (`app/api/chat/route.ts`, `app/api/contact/route.ts`). None are prefixed `NEXT_PUBLIC_`, so none are ever bundled into client-side JavaScript.

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | For ChefGPT chat | OpenAI API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `OPENAI_MODEL` | No | Model id for `/api/chat`. Defaults to `gpt-4o-mini` if unset (cheap, fast, good quality) |
| `RESEND_API_KEY` | For contact-form email | From [resend.com](https://resend.com) (free tier: 100 emails/day) |
| `CONTACT_EMAIL` | No | Where reservation/contact submissions are delivered |

Local setup:

```bash
cp .env.example .env.local
# then fill in real values in .env.local
```

`.env.local` is git-ignored (see `.gitignore`) and must never be committed. `.env.example` contains placeholders only and is safe to commit.

**Behavior when keys are missing:**
- No `OPENAI_API_KEY` → `/api/chat` returns a `503` with a clean JSON error (`{"error": "Chat is not configured yet…"}`); it never crashes and never leaks the key.
- No `RESEND_API_KEY` → `/api/contact` logs the submission to the server console and still returns `{"ok": true}` so the UI works in local dev without a Resend account.

## 🔊 Audio Setup

Sound files live in `public/sounds/`. The sound system (`app/hooks/SoundContext.tsx` + `app/hooks/useSoundFx.ts`) is centralized: one shared audio registry per page load, so toggling mute (the "Sound on/off" button) **immediately stops every currently playing sound**, including the looping ambience — not just future sounds.

| File | Duration | Used for |
|---|---|---|
| `public/sounds/click.mp3` | ~0.3s | UI taps: card flips, modal close, book navigation, "Cook an AI" start |
| `public/sounds/success.mp3` | ~1.6s | Hero "open the kitchen" reveal, "Cook an AI" result ready |
| `public/sounds/error.mp3` | ~1.3s | Contact form send failure, ChefGPT chat error |
| `public/sounds/notification.mp3` | ~1.3s | Contact form sent, ChefGPT chat reply received |
| `public/sounds/timer.mp3` | ~1.3s | Reserved — not wired to a feature yet (no timer UI in this portfolio) |
| `public/sounds/ambient-kitchen.mp3` | ~62s loop | Background ambience after the hero reveal |

These ship as real, licensed MP3s from [Mixkit's free sound-effects library](https://mixkit.co/free-sound-effects/) (free for commercial use, no attribution required) — not empty placeholder files, not synthesized audio. To replace them with your own:

1. Go to `public/sounds/`.
2. Add real `.mp3` files using these **exact filenames**: `click.mp3`, `success.mp3`, `error.mp3`, `notification.mp3`, `timer.mp3`, `ambient-kitchen.mp3`.
3. Confirm they aren't empty:
   ```bash
   ls -lh public/sounds
   ```
   Bad: `click.mp3   0B` — Good: `click.mp3   7.0K`
4. Restart `npm run dev` and click around: card taps, the hero "open kitchen" moment, a contact-form submit, and toggle mute to confirm it stops the ambience instantly.

If your source file is `.wav`, convert it:

```bash
brew install ffmpeg   # macOS, one-time
ffmpeg -i input.wav public/sounds/click.mp3
```

Audio never plays during server-side rendering (all `Audio` usage is guarded by `typeof window !== "undefined"`), never autoplays before user interaction, and fails silently (no console errors) if a file is missing or blocked by the browser's autoplay policy.

## 🌐 Deploying to Vercel

### Via GitHub (recommended)

1. Push the project to GitHub.
2. Open [vercel.com](https://vercel.com).
3. Click **Add New Project**.
4. Import the GitHub repository.
5. Add the environment variables from the table above under **Settings → Environment Variables**.
6. Click **Deploy**.

### Via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel          # preview deploy
vercel --prod   # production deploy
```

Vercel auto-detects Next.js — `vercel.json` only sets cache headers for `/sounds/*` and `/images/*` and intentionally contains no secrets or build overrides.

### Avoiding local storage issues

This repo itself is small (under 1 MB of source); almost all local disk usage comes from generated folders that are safe to delete anytime — they regenerate automatically:

| Folder | Regenerated by | Typical size |
|---|---|---|
| `.next/` | `npm run dev` or `npm run build` | ~10-150 MB |
| `node_modules/` | `npm install` | ~500 MB |

```bash
rm -rf .next          # always safe, instant to rebuild
rm -rf node_modules   # safe, but requires npm install again before dev/build/lint/tsc will work
```

Never delete `app/`, `public/`, `package.json`, `package-lock.json`, or any config file (`next.config.ts`, `tsconfig.json`, etc.) — those are source, not generated output.

## 🤖 ChefGPT Chatbot

The chat widget in the Contact section calls `/api/chat`, a Next.js API route that proxies to the OpenAI Chat Completions API server-side. The browser never sees `OPENAI_API_KEY`. The model is chosen server-side from `OPENAI_MODEL` (falls back to `gpt-4o-mini`) — the client cannot override it.

## 🎨 Customization

All personal data lives in **one file**: `app/data/resume.ts`. Update that file to change any content across the entire site.

Color palette (in `app/globals.css`):
```css
--gold: #C8913A;
--orange: #D45D20;
--cream: #F0E6CE;
--bg-base: #060402;
```

## 📁 Structure

```
app/
├── api/
│   ├── chat/route.ts     # OpenAI proxy — server-only key, safe errors
│   └── contact/route.ts  # Resend email proxy — validates input, safe errors
├── components/
│   ├── Nav.tsx            # Sticky navigation
│   ├── Hero.tsx            # Landing with particle field
│   ├── About.tsx            # Chef's story + timeline
│   ├── Projects.tsx          # Signature recipes (expandable)
│   ├── Skills.tsx              # Ingredients shelf
│   ├── Experience.tsx           # Kitchen experience
│   ├── LiveKitchen.tsx           # Status board
│   ├── ReadingRoom.tsx            # Bookshelf
│   ├── Terminal.tsx                # Hidden dev terminal (Ctrl+`)
│   ├── Contact.tsx                  # Form + ChefGPT chatbot
│   └── Footer.tsx                    # Footer
├── data/
│   └── resume.ts          # ← Edit all personal data here
├── hooks/
│   ├── SoundContext.tsx   # Global mute state + shared audio registry
│   └── useSoundFx.ts      # play/loop/stop helpers
├── globals.css            # Theme variables & utilities
├── layout.tsx              # Root layout + SEO metadata
└── page.tsx                 # Page composition
```

## 🛠️ Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **OpenAI API** (ChefGPT chatbot, server-side proxy)
- **Resend** (contact form email)

## 🧪 Testing Locally

1. `npm run dev`, open `http://localhost:3000`.
2. Click through Nav links — sections scroll into view.
3. Open the Contact section, type a message into ChefGPT — with a valid `OPENAI_API_KEY` you get a real reply; without one you get a clear "not configured" message instead of a crash.
4. Submit the reservation form — with `RESEND_API_KEY` set you get a real email; without it, check the terminal running `npm run dev` for the logged submission and a success response in the UI.
5. Click the "Sound on/off" button (bottom right) — toggling off should immediately silence any playing sound, including the ambient loop after opening the hero.
6. Open the browser console — no errors should appear from audio or API calls.

## 🩺 Troubleshooting

| Symptom | Fix |
|---|---|
| `npm run build` fails on `OPENAI_API_KEY` / secret errors | Make sure `vercel.json` has no `env` block referencing `@secret-name` — set real values in the Vercel dashboard instead. |
| ChefGPT always replies "temporarily unavailable" | Check `OPENAI_API_KEY` is set in `.env.local` (dev) or Vercel env vars (prod), and that it's a valid, active key with billing enabled. |
| Contact form always "logs to console only" | Set `RESEND_API_KEY` — until then this is expected dev-mode behavior, not a bug. |
| No sound plays at all | Check the mute toggle isn't on, and that `public/sounds/*.mp3` aren't 0-byte files (`ls -lh public/sounds`). |
| TypeScript errors on a fresh clone | Run `npm install` again — `next-env.d.ts` and `.next/` are regenerated, don't hand-edit them. |
| Deploying and env vars "aren't picked up" | Redeploy after adding/changing env vars in Vercel — existing deployments don't retroactively pick up new values. |

## 🔮 Ideas for Later

- 3D kitchen scene with Three.js / React Three Fiber
- GSAP scroll storytelling / Lenis smooth scroll
- Real headshot at `public/images/karthik.jpg` (currently falls back gracefully if missing — see `public/images/PHOTO_PLACEHOLDER.txt`)

Already live: time-of-day theming (`app/hooks/useTimeTheme.ts` shifts the palette by morning/afternoon/evening/night/late-night), the hidden dev terminal (`Ctrl+\``), and sound design.

---

*Built with ❤️ and a dash of AI · Los Angeles, CA*
