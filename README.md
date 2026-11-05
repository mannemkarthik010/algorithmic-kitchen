# karthikmannem.com

Portfolio of Karthik Mannem, machine learning and AI engineer. Next.js (App Router), React 19, TypeScript.

Live: https://karthikmannem.com

## What is on the site

| Route | What it is |
|---|---|
| `/` | Hero, selected work (three flagship projects), open-source "code evolution" viewer, experience, engineering expertise with a project atlas, about, contact |
| `/work/taxproof` | Case study with an interactive evidence-graph explorer and a hash-chain demo |
| `/work/retail-demand-intelligence` | Case study with a forecasting explorer on the repository's real output (synthetic sales) |
| `/work/preventive-care` | Case study with a stage walkthrough, agent lanes and a revision-loop simulator (educational prototype) |
| `/lab` | Games, the library and other experiments |

Every figure on a case-study page is read from its repository at a pinned commit by a script in `scripts/`, which asserts it against the source. Generated model output is never shown unless it was captured from a run.

## Run it

```bash
npm install
cp .env.example .env.local   # optional: only the contact form and assistant need keys
npm run dev                  # http://localhost:3000
```

Checks to run before any release:

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run sync:check           # résumé and site data agree
```

## Libraries and where they are used

| Library | Used for |
|---|---|
| `motion` | All interface animation: reveals, layout and shared-element transitions, scroll-linked hero |
| `animejs` | Evidence-graph sequencing on the TaxProof case study (timelines, drawable SVG paths) |
| shadcn/ui (Radix, cmdk, vaul) | Navigation menu, mobile sheet, command palette, tabs, sliders, dialogs, collapsibles, hover cards |
| Bklit charts (MIT, via the shadcn registry) | Retail forecasting studio: line, band, projection line, reference areas |
| Kokonut UI (MIT, public registry) | Agent Lanes (customised) on Preventive Care, Scroll Index, slide-text button |

Vendored third-party sources live in `components/charts`, `components/kokonutui` and `app/components/ui`, and are excluded from linting. See `docs/COMPONENT_INTEGRATION.md` for what was integrated, what was only referenced, and why.

## Data scripts

Python 3, standard library only.

```bash
python3 -I scripts/build-retail-data.py
python3 -I scripts/build-taxproof-data.py
python3 -I scripts/build-preventive-data.py
python3 -I scripts/build-contributions-data.py   # live GitHub status, reviews and diffs
```

## Environment variables

Read server-side only, in `app/api/*`. None is exposed to the browser.

| Variable | Needed for |
|---|---|
| `OPENAI_API_KEY`, `OPENAI_MODEL` | The optional "Ask about my work" assistant (`/api/chat`). Without a key it returns a clean 503 |
| `RESEND_API_KEY`, `CONTACT_EMAIL` | Contact form delivery. Without a key the submission is logged to the server console |

`.env.local` is git-ignored. `.env.example` holds placeholders only.

## Résumé

`resume/resume.tex` is the source of truth. A GitHub Action compiles it and writes `public/Karthik_Mannem_Resume.pdf` when it changes on `main`. `npm run sync:check` compares its experience and education with `app/data/resume.ts`.

## Docs

`docs/DESIGN_RESEARCH.md`, `docs/DESIGN_SYSTEM.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/QA_REPORT.md`, `docs/COMPONENT_INTEGRATION.md`.

## If the dev server shows stale styles

Stop it, then `rm -rf .next` and start again. `.next` is generated output and always safe to delete.
