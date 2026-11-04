"use client";
import { useEffect, useState } from "react";
import { taxproof, type ChainEvent } from "./taxproof-data";

const GENESIS = "0".repeat(64);

/** Same canonical form as backend/app/services/audit.py: sorted keys, compact separators. */
function canon(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canon).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${canon(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(v);
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

const hashOf = (e: ChainEvent, prev: string) =>
  sha256(canon({ engagement_id: e.engagement, at: e.at, actor_id: e.actor, actor_role: e.role, action: e.action, target_ref: e.target, payload: e.payload, prev_hash: prev }));

type Mode = "intact" | "edited" | "covered";
type Row = { ev: ChainEvent; expected: string; ok: boolean; why?: string };

const short = (h: string) => `${h.slice(0, 8)}…${h.slice(-4)}`;
const EDIT_INDEX = 2;

/** Verifies a list of stored events exactly as verify_chain does: link to the previous stored hash, then recompute. */
async function verify(events: ChainEvent[]): Promise<{ rows: Row[]; brokenAt: number | null }> {
  let prev = GENESIS;
  let brokenAt: number | null = null;
  const rows: Row[] = [];
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const expected = await hashOf(ev, prev);
    const linkOk = ev.prev === prev;
    const hashOk = ev.hash === expected;
    const ok = brokenAt === null && linkOk && hashOk;
    if (brokenAt === null && !ok) brokenAt = i;
    rows.push({ ev, expected, ok, why: !linkOk ? "prev_hash does not match the event before it" : !hashOk ? "stored hash does not match the event's contents" : undefined });
    prev = ev.hash;
  }
  return { rows, brokenAt };
}

export default function HashChain() {
  const [mode, setMode] = useState<Mode>("intact");
  const [res, setRes] = useState<{ rows: Row[]; brokenAt: number | null } | null>(null);
  const [matchesPython, setMatchesPython] = useState<boolean | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const events = taxproof.chain.map((e) => ({ ...e, payload: { ...e.payload } }));
      if (mode !== "intact") {
        events[EDIT_INDEX] = { ...events[EDIT_INDEX], payload: { ...events[EDIT_INDEX].payload, to: 11800 } };
        if (mode === "covered") {
          // an attacker who can write the table recomputes the edited row's hash so that row looks fine
          events[EDIT_INDEX] = { ...events[EDIT_INDEX], hash: await hashOf(events[EDIT_INDEX], events[EDIT_INDEX].prev) };
        }
      }
      const out = await verify(events);
      if (live) setRes(out);
      if (mode === "intact") {
        const same = out.rows.every((r) => r.expected === r.ev.hash);
        if (live) setMatchesPython(same);
      }
    })();
    return () => { live = false; };
  }, [mode]);

  const broken = res?.brokenAt ?? null;
  return (
    <div className="tp-chain">
      <div className="tp-chain__ctl" role="group" aria-label="Tamper with the sample log">
        <button type="button" className={`cs-chip${mode === "intact" ? " is-on" : ""}`} onClick={() => setMode("intact")}>Untouched</button>
        <button type="button" className={`cs-chip${mode === "edited" ? " is-on" : ""}`} onClick={() => setMode("edited")}>Edit event 3 quietly</button>
        <button type="button" className={`cs-chip${mode === "covered" ? " is-on" : ""}`} onClick={() => setMode("covered")}>Edit it and re-hash that row</button>
      </div>

      <ol className="tp-chain__list">
        {(res?.rows ?? taxproof.chain.map((ev) => ({ ev, expected: ev.hash, ok: true } as Row))).map((r, i) => {
          const dead = broken !== null && i > broken;
          const bad = broken === i;
          const tampered = mode !== "intact" && i === EDIT_INDEX;
          return (
            <li key={r.ev.hash + i} className={`tp-ev${bad ? " is-bad" : dead ? " is-dead" : ""}`}>
              <div className="tp-ev__n">{String(i + 1).padStart(2, "0")}</div>
              <div className="tp-ev__body">
                <p className="tp-ev__a"><code>{r.ev.action}</code> on <code>{r.ev.target}</code> by {r.ev.role}</p>
                <p className={`tp-ev__p${tampered ? " is-edit" : ""}`}>{canon(tampered ? { ...r.ev.payload, to: 11800 } : r.ev.payload)}</p>
                <p className="tp-ev__h"><span>prev</span> {short(r.ev.prev)} <span>hash</span> {short(r.ev.hash)}</p>
              </div>
              <div className="tp-ev__s" role="status">
                {bad ? <b>Broken here</b> : dead ? <span>Unverified after the break</span> : <span className="is-ok">Verified</span>}
                {bad && <small>{r.why}</small>}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="tp-chain__read" role="status">
        {mode === "intact" && (matchesPython === null ? "Recomputing…" : matchesPython ? "All four hashes were recomputed in your browser with SHA-256 and match the ones the Python implementation produced for this sample." : "The browser recomputation does not match the Python output.")}
        {mode === "edited" && "Event 3's contents changed but its stored hash did not, so verification fails at event 3."}
        {mode === "covered" && "Event 3 now looks consistent, because its hash was rewritten. But event 4 still points at the old hash, so the break moves to event 4. Hiding an edit means rewriting every later row."}
      </p>
      <p className="cs-small">A sample log in the same canonical form as <code>backend/app/services/audit.py</code>. Illustrative events, not the audit trail of the packet or a live engagement.</p>
    </div>
  );
}
