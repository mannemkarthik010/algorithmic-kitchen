"use client";
import DunkGame from "./DunkGame";
import DosaIllusion from "./DosaIllusion";

const FOODS = ["🫓", "🍛", "🥥", "🌶️", "☕", "🍚", "🍌", "🥘"];

/** Footer playground: a tiffin-dunking game and a dosa spiral illusion, with a rolling emoji band between. */
export default function FooterPlay() {
  return (
    <section className="fplay" aria-label="Footer games">
      <div className="container">
        <p className="fplay__kicker">✦ &nbsp;TIFFIN BREAK&nbsp; ✦</p>
        <h3 className="fplay__title">DUNK IT LOW… <span>WATCH IT SOAK!</span></h3>
        <DunkGame />
      </div>

      <div className="fplay__band" aria-hidden="true">
        <div className="fplay__belt">
          {[0, 1].map((c) => (
            <div key={c} className="fplay__lane">
              {Array.from({ length: 3 }).flatMap((_, k) => FOODS.map((f, i) => <span key={`${k}-${i}`}>{f}</span>))}
            </div>
          ))}
        </div>
      </div>

      <div className="container">
        <p className="fplay__kicker">✦ &nbsp;MIND TRICK&nbsp; ✦</p>
        <h3 className="fplay__title">STARE AT <span>THE DOSA</span></h3>
        <DosaIllusion />
      </div>
    </section>
  );
}
