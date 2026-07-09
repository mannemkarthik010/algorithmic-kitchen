# Sound Files

These are real, licensed MP3s sourced from [Mixkit's free sound-effects
library](https://mixkit.co/free-sound-effects/) (free for commercial use,
no attribution required) — not empty placeholders and not synthesized audio.

| File | Duration | Size | Used for |
|---|---|---|---|
| `click.mp3` | ~0.3s | ~7 KB | UI taps: card flips, project cards, modal close, book navigation, "Cook an AI" start |
| `success.mp3` | ~1.6s | ~52 KB | Big reveal moments: hero "open the kitchen", "Cook an AI" result ready |
| `error.mp3` | ~1.3s | ~41 KB | Contact form send failure, ChefGPT chat error |
| `notification.mp3` | ~1.3s | ~43 KB | Contact form sent successfully, ChefGPT chat reply received |
| `timer.mp3` | ~1.3s | ~43 KB | Reserved — not wired to any feature yet (no timer UI exists in this portfolio). Safe to use if you add one. |
| `ambient-kitchen.mp3` | ~62s loop | ~1.8 MB | Background ambience loop after the hero reveal |

## Replacing these files

Drop in your own royalty-free `.mp3` using the exact filenames above —
the sound system (`app/hooks/useSoundFx.ts` + `app/hooks/SoundContext.tsx`)
picks them up automatically, no code changes needed. Good free sources:

- https://mixkit.co/free-sound-effects/ (no login needed for downloads)
- https://freesound.org (requires free account)
- https://pixabay.com/sound-effects/

If you download a `.wav`, convert it with ffmpeg:

```bash
ffmpeg -i input.wav public/sounds/click.mp3
```

Keep UI sound effects short (under ~2s) and the ambience loop under a few
MB — see the main [README](../../README.md#audio-setup) for details.
