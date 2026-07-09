"use client";

import { useSound } from "./SoundContext";

/**
 * useSoundFx — lightweight browser Audio API wrapper.
 *
 * - Lazy-loads audio files on first play (no autoplay on mount)
 * - Shares one audio-element registry (via SoundContext) across every component,
 *   so muting stops all sounds immediately — including a loop started elsewhere
 * - Silently catches all play() rejections (browser autoplay policy, missing files)
 * - Never touches the DOM Audio API during SSR — all usage is guarded by
 *   typeof window checks
 */
export function useSoundFx() {
  const { muted, registry } = useSound();

  const getAudio = (src: string): HTMLAudioElement | null => {
    if (typeof window === "undefined") return null;
    let audio = registry.current.get(src);
    if (!audio) {
      audio = new Audio(src);
      audio.preload = "auto";
      // A missing/corrupt file should never surface as an unhandled error.
      audio.addEventListener("error", () => {});
      registry.current.set(src, audio);
    }
    return audio;
  };

  const play = (src: string, volume = 0.35) => {
    if (typeof window === "undefined" || muted) return;
    const audio = getAudio(src);
    if (!audio) return;
    audio.loop = false;
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Browser policy blocked playback — fail silently
    });
  };

  const stop = (src: string) => {
    const audio = registry.current.get(src);
    if (audio) { audio.pause(); audio.currentTime = 0; }
  };

  const loop = (src: string, volume = 0.08) => {
    if (typeof window === "undefined" || muted) return;
    const audio = getAudio(src);
    if (!audio) return;
    audio.loop = true;
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch(() => {
      // Browser policy blocked — fail silently
    });
  };

  const stopAll = () => {
    registry.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  return { play, stop, loop, stopAll };
}
