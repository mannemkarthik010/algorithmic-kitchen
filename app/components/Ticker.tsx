"use client";

const ROWS: { words: string[]; reverse?: boolean; outline?: boolean }[] = [
  { words: ["DATA.", "MODEL.", "SHIP."] },
  { words: ["RETRIEVE.", "REASON.", "REPEAT."], reverse: true, outline: true },
];

/** Big, chunky, endlessly scrolling tagline bands. */
export default function Ticker() {
  return (
    <div className="ticker" aria-hidden="true">
      {ROWS.map((row, r) => (
        <div key={r} className={`ticker__row${row.reverse ? " is-reverse" : ""}${row.outline ? " is-outline" : ""}`}>
          {[0, 1].map((copy) => (
            <div key={copy} className="ticker__track">
              {Array.from({ length: 4 }).flatMap((_, k) =>
                row.words.map((w, i) => (
                  <span key={`${k}-${i}`} className={`ticker__word ticker__word--${i}`}>{w}</span>
                ))
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
