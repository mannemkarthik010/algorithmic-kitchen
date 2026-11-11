"use client";

import { createContext, useContext, useRef, ReactNode, MutableRefObject } from "react";

interface SoundContextType {
  /** Always true: the site has no background sound and no control that switches sound on. */
  muted: boolean;
  /** Shared audio element cache used by useSoundFx. */
  registry: MutableRefObject<Map<string, HTMLAudioElement>>;
}

const noopRegistry = { current: new Map<string, HTMLAudioElement>() };

const SoundContext = createContext<SoundContextType>({
  muted: true,
  registry: noopRegistry,
});

/**
 * The ambient background loop and its Sound button were removed. Nothing starts audio on its own and nothing
 * can unmute, so the interface click sounds that still call useSoundFx stay silent. (The game at /play has its
 * own optional synthesized effects, switched in its own settings, which do not use this context.)
 */
export function SoundProvider({ children }: { children: ReactNode }) {
  const registry = useRef<Map<string, HTMLAudioElement>>(new Map());
  return (
    <SoundContext.Provider value={{ muted: true, registry }}>
      {children}
    </SoundContext.Provider>
  );
}

export const useSound = () => useContext(SoundContext);
