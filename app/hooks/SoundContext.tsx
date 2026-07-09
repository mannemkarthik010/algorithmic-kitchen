"use client";

import { createContext, useContext, useState, useRef, useCallback, ReactNode, MutableRefObject } from "react";

interface SoundContextType {
  muted: boolean;
  toggle: () => void;
  /** Shared audio element cache — lets toggle() stop every sound immediately on mute. */
  registry: MutableRefObject<Map<string, HTMLAudioElement>>;
}

const noopRegistry = { current: new Map<string, HTMLAudioElement>() };

const SoundContext = createContext<SoundContextType>({
  muted: false,
  toggle: () => {},
  registry: noopRegistry,
});

export function SoundProvider({ children }: { children: ReactNode }) {
  // Lazy initialiser — reads localStorage once on mount, avoids setState-in-effect
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("ak_muted") === "true";
  });
  const registry = useRef<Map<string, HTMLAudioElement>>(new Map());

  const toggle = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("ak_muted", String(next));
      }
      if (next) {
        // Muting: stop every currently playing sound immediately, including any ambient loop.
        registry.current.forEach((audio) => {
          audio.pause();
          audio.currentTime = 0;
        });
      }
      return next;
    });
  }, []);

  return (
    <SoundContext.Provider value={{ muted, toggle, registry }}>
      {children}
    </SoundContext.Provider>
  );
}

export const useSound = () => useContext(SoundContext);
