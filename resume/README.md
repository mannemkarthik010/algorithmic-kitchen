# Resume source

`resume.tex` is the single source of truth for the downloadable resume PDF.

## How it updates the site

1. Edit `resume.tex` (locally, in any text editor — no LaTeX install needed).
2. `git add resume/resume.tex && git commit -m "Update resume" && git push`
3. A GitHub Action (`.github/workflows/build-resume.yml`) automatically compiles
   it to PDF in the cloud and commits the result to `public/Karthik_Mannem_Resume.pdf`.
4. That commit triggers a Vercel redeploy (once the Vercel project is connected
   to this GitHub repo — see main README) so the live "Résumé ↗" link always
   serves the latest PDF.

## What does NOT auto-update

The on-page content in the About / Experience / Projects sections comes from
`app/data/resume.ts`, not from this LaTeX file. If a `.tex` edit should also
change what's shown on the page itself (not just the downloadable PDF), update
`app/data/resume.ts` to match — this is a manual step, since reliably parsing
arbitrary LaTeX into structured page data isn't feasible.

## Checking the build

If the PDF doesn't update after a push, check the Actions tab on GitHub for
the "Build Resume PDF" workflow run — it'll show the LaTeX compile log if
something fails (e.g. a missing package or a syntax error in the `.tex` file).
