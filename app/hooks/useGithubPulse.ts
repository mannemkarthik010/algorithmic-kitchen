"use client";
import { useEffect, useState } from "react";

export interface GithubPulse {
  repos: number;
  pushes: number;
  /** pushes per day, oldest → newest, last 30 days */
  days: number[];
}

const USER = "mannemkarthik010";
const KEY = "ak:gh-pulse:v1";
const TTL = 30 * 60 * 1000;
const DAY = 86_400_000;

/** Live numbers from GitHub's public API. Cached per session; null if offline or rate-limited. */
export function useGithubPulse(): GithubPulse | null {
  const [pulse, setPulse] = useState<GithubPulse | null>(null);

  useEffect(() => {
    let alive = true;

    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const c = JSON.parse(raw) as { t: number; v: GithubPulse };
        if (Date.now() - c.t < TTL) {
          queueMicrotask(() => alive && setPulse(c.v));
          return () => { alive = false; };
        }
      }
    } catch { /* storage unavailable */ }

    (async () => {
      try {
        const [u, ev] = await Promise.all([
          fetch(`https://api.github.com/users/${USER}`),
          fetch(`https://api.github.com/users/${USER}/events/public?per_page=100`),
        ]);
        if (!u.ok || !ev.ok) return;
        const user = (await u.json()) as { public_repos: number };
        const events = (await ev.json()) as { type: string; created_at: string; payload?: { size?: number } }[];

        const now = Date.now();
        const days = Array<number>(30).fill(0);
        let pushes = 0;
        for (const e of events) {
          if (e.type !== "PushEvent") continue;
          const age = Math.floor((now - new Date(e.created_at).getTime()) / DAY);
          if (age < 0 || age > 29) continue;
          days[29 - age] += 1;
          pushes += 1;
        }
        const v: GithubPulse = { repos: user.public_repos, pushes, days };
        if (!alive) return;
        setPulse(v);
        try { sessionStorage.setItem(KEY, JSON.stringify({ t: now, v })); } catch { /* ignore */ }
      } catch { /* offline — the static stats still render */ }
    })();

    return () => { alive = false; };
  }, []);

  return pulse;
}
