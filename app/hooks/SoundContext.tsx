"use client";

import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode, MutableRefObject } from "react";

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
  // Always starts false so the server-rendered HTML and the client's first
  // render match exactly; the real saved preference is applied right after
  // mount, once localStorage is actually available (avoids a hydration
  // mismatch for anyone who previously muted the site).
  const [muted, setMuted] = useState(false);
  const registry = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    // Intentional: localStorage only exists client-side, so this can't be read
    // during the initial render without causing a hydration mismatch. Syncing
    // here, once, after mount is the correct pattern for this case.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem("ak_muted") === "true") setMuted(true);
  }, []);

  const toggle = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem("ak_muted", String(next));
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
