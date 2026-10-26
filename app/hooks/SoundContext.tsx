"use client";

import { createContext, useContext, useState, useRef, useCallback, ReactNode, MutableRefObject } from "react";

interface SoundContextType {
  muted: boolean;
  toggle: () => void;
  /** Shared audio element cache — lets toggle() stop every sound immediately on mute. */
  registry: MutableRefObject<Map<string, HTMLAudioElement>>;
}

const AMBIENT = "/sounds/ambient-kitchen.mp3";
const noopRegistry = { current: new Map<string, HTMLAudioElement>() };

const SoundContext = createContext<SoundContextType>({
  muted: true,
  toggle: () => {},
  registry: noopRegistry,
});

export function SoundProvider({ children }: { children: ReactNode }) {
  // Sound is opt-in: browsers block autoplay anyway, so the site starts silent
  // and the toggle starts the ambient loop on the visitor's first click.
  const [muted, setMuted] = useState(true);
  const registry = useRef<Map<string, HTMLAudioElement>>(new Map());

  const toggle = useCallback(() => {
    const next = !muted;
    setMuted(next);
    if (next) {
      // Muting: stop every currently playing sound immediately, including any ambient loop.
      registry.current.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      return;
    }
    let ambient = registry.current.get(AMBIENT);
    if (!ambient) {
      ambient = new Audio(AMBIENT);
      ambient.addEventListener("error", () => {});
      registry.current.set(AMBIENT, ambient);
    }
    ambient.loop = true;
    ambient.volume = 0.06;
    ambient.play().catch(() => {});
  }, [muted]);

  return (
    <SoundContext.Provider value={{ muted, toggle, registry }}>
      {children}
    </SoundContext.Provider>
  );
}

export const useSound = () => useContext(SoundContext);
