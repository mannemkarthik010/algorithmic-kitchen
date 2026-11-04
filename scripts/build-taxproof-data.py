#!/usr/bin/env python3
"""Build app/data/taxproof-case.json for the TaxProof case study.

Reads the supplied (fictional) Okafor-Lindqvist packet from the TaxGraph repo at a PINNED commit and
extracts three lineages through the supplied v3 return:

  * mileage       : D23 page totals -> SchC.44a -> ... -> F1040.37 (amount you owe)
  * gross receipts: books + 1099-K + 1099-NEC -> SchC.1 -> ... -> F1040.37
  * wages         : W-2 box 1 values -> F1040.1a -> ... -> F1040.37

Everything in a node comes from the packet (values, rules, sources, inputs, page text as read) and is
asserted against the numbers the repo's own docs state. Nothing sensitive is copied: no SSNs, addresses,
bank or account numbers, and no full document text. Corrected values (8,100 miles, 151,300) are
arithmetic on packet values; the tax-effect estimates are copied from the repo's iteration log and
labelled as such in the UI.

Stdlib only. Run:  python3 -I scripts/build-taxproof-data.py
"""
import hashlib
import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

REPO = "mannemkarthik010/TaxGraph"
SHA = "773e4ea53dcd457dc79a8930e38e5f700830a279"
RAW = f"https://raw.githubusercontent.com/{REPO}/{SHA}/"
PACKET_FILE = "okafor_lindqvist_2025_packet.json"
OUT = Path(__file__).resolve().parent.parent / "app" / "data" / "taxproof-case.json"
FIN = "F1040.37"  # amount you owe


def fetch(path: str) -> bytes:
    req = urllib.request.Request(RAW + path, headers={"User-Agent": "portfolio-build-script"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main() -> None:
    raw = fetch(PACKET_FILE)
    packet_sha = hashlib.sha256(raw).hexdigest()
    P = json.loads(raw)

    docs = {d["id"]: d for d in P["documents"]}
    EV = {e["id"]: e for e in P["extracted_values"]}
    rv = P["return_versions"]
    v3 = rv[-1]
    assert v3["version"] == "v3", v3["version"]
    L = {l["key"]: l for l in v3["lines"]}
    RULES = P["engine_reference"]["rules"]
    params = P["engine_reference"]["parameters"]

    consumers: dict[str, list[str]] = {}
    for k, l in L.items():
        for i in l["inputs"]:
            consumers.setdefault(i, []).append(k)

    def shortest_to_final(start: str) -> list[str]:
        """Shortest consumer path from `start` to the amount-you-owe line (breadth-first)."""
        q = [[start]]
        seen = {start}
        while q:
            path = q.pop(0)
            if path[-1] == FIN:
                return path
            for c in consumers.get(path[-1], []):
                if c not in seen:
                    seen.add(c)
                    q.append(path + [c])
        raise SystemExit(f"no path from {start} to {FIN}")

    def money(v):
        return None if v is None else v

    def line_node(key: str, *, core: bool) -> dict:
        l = L[key]
        return {
            "id": key,
            "kind": "line",
            "label": l["label"],
            "form": l["form"],
            "value": l["value"],
            "unit": "mi" if key == "SchC.44a" else "usd",
            "rule": l["rule"],
            "ruleText": RULES.get(l["rule"], ""),
            "inputs": l["inputs"],
            "sources": l["sources"],
            "note": l.get("note"),
            "core": core,
        }

    def ev_node(eid: str, *, label_override: str | None = None) -> dict:
        e = EV[eid]
        d = docs[e["document_id"]]
        return {
            "id": eid,
            "kind": "evidence",
            "label": label_override or e["label"],
            "field": e["field"],
            "value": e["value"],
            "unit": "mi" if e["field"] == "page_total" else "usd",
            "doc": e["document_id"],
            "page": e["page"],
            "docTitle": d["title"],
            "textAsRead": e["text_as_read"],
            "confidence": e["confidence"],
        }

    def doc_node(did: str, page: int | None, heading: str | None = None) -> dict:
        d = docs[did]
        return {
            "id": f"{did}#{page}" if page else did,
            "kind": "doc",
            "label": d["title"],
            "doc": did,
            "page": page,
            "docType": d["document_type"],
            "pageCount": d["page_count"],
            "fileName": d["file_name"],
            "received": d["received_at"][:10],
            "heading": heading,
        }

    # ------------------------------------------------------------------ mileage
    d23 = docs["D23"]
    pt = {}  # page -> ev id of page_total
    for e in P["extracted_values"]:
        if e["document_id"] == "D23" and e["field"] == "page_total":
            pt[e["page"]] = e["id"]
    assert sorted(pt) == [1, 2, 3, 4], pt
    assert [EV[pt[p]]["value"] for p in (1, 2, 3, 4)] == [2600, 3700, 3700, 1800]
    assert sorted(L["SchC.44a"]["sources"]) == sorted(pt.values()), "SchC.44a sources changed"
    assert L["SchC.44a"]["value"] == 11800 and L["SchC.9"]["value"] == 8260
    rate = params["mileage_rate"]
    assert round(11800 * rate) == 8260, rate
    pages = {p["page"]: p["printed_content"] for p in d23["pages"]}
    assert "Second scan of the May-Aug sheet" in pages[3]

    def heading(page: int) -> str:
        txt = pages[page]
        start = txt.find("Mileage log")
        end = txt.find(" Vehicle", start)
        return txt[start:end].rstrip(".")

    mileage_path = shortest_to_final("SchC.44a")
    assert mileage_path[:2] == ["SchC.44a", "SchC.9"] and mileage_path[-1] == FIN
    mileage_core = {"SchC.44a", "SchC.9", "SchC.31", "SchSE.12", "F1040.24", FIN}
    assert mileage_core <= set(mileage_path)
    miles_ok = 2600 + 3700 + 1800

    mileage = {
        "id": "mileage",
        "tab": "Mileage deduction",
        "question": "Where does the 11,800 business miles come from, and what does it do to the tax due?",
        "summary": (
            "The engine sums four page totals from the scanned mileage log. Page 3 is a second scan of page 2, "
            "so 3,700 miles are counted twice. The error flows through the car expense, net profit and "
            "self-employment tax to the amount owed."
        ),
        "nodes": (
            [doc_node("D23", p, heading(p)) for p in (1, 2, 3, 4)]
            + [ev_node(pt[p]) for p in (1, 2, 3, 4)]
            + [line_node(k, core=k in mileage_core) for k in mileage_path]
        ),
        "edges": (
            [{"from": f"D23#{p}", "to": pt[p], "kind": "read"} for p in (1, 2, 3, 4)]
            + [{"from": pt[p], "to": "SchC.44a", "kind": "feeds"} for p in (1, 2, 3, 4)]
            + [{"from": a, "to": b, "kind": "feeds"} for a, b in zip(mileage_path, mileage_path[1:])]
            + [{"from": "D23#3", "to": "D23#2", "kind": "duplicate", "label": "same sheet scanned twice"}]
        ),
        "flags": {
            "D23#3": {
                "type": "duplicate",
                "title": "Duplicate page",
                "text": "The page itself says it is a second scan of the May to August sheet (same handwriting and coffee stain as page 2). Its 3,700-mile total is added again.",
            },
            pt[3]: {
                "type": "duplicate",
                "title": "Counted twice",
                "text": "Same total as page 2 (3,700). The rule sums every page total without checking for repeated sheets.",
            },
            "SchC.44a": {
                "type": "wrong",
                "title": "Overstated input",
                "text": "11,800 includes the repeated sheet. Without it the pages sum to 8,100.",
            },
        },
        "engine": {"label": "Business miles (SchC.44a)", "value": 11800, "unit": "mi"},
        "independent": {
            "label": "Without the repeated page",
            "value": miles_ok,
            "unit": "mi",
            "how": "2,600 + 3,700 + 1,800 (pages 1, 2 and 4)",
            "derived": True,
        },
        "effect": {
            "text": "Estimated tax effect of the correction: +$919 federal, +$80 California",
            "source": "TaxProof iteration log, adjustment for this finding (an estimate through the engine's own mileage ratio, flagged for reviewer approval)",
        },
        "carry": {
            "SchC.9": {"engine": 8260, "independent": round(miles_ok * rate), "how": f"{miles_ok:,} mi x ${rate:.2f} standard mileage rate"},
        },
    }
    assert round(miles_ok * rate) == 5670  # matches the repo's documented 8,260 -> 5,670

    # ------------------------------------------------------------------ gross receipts
    gr = L["SchC.1"]
    assert gr["value"] == 163700
    ev_books, ev_1099k = "ev-0103", "ev-0127"
    nec = [s for s in gr["sources"] if s not in (ev_books, ev_1099k)]
    assert len(nec) == 5 and all(EV[s]["field"] == "box1" for s in nec)
    nec_total = sum(EV[s]["value"] for s in nec)
    assert nec_total == 142000, nec_total
    assert EV[ev_books]["value"] == 151300 and EV[ev_1099k]["value"] == 12400
    assert 151300 + 12400 == 163700
    gr_path = shortest_to_final("SchC.1")
    gr_core = {"SchC.1", "SchC.7", "SchC.31", "SchSE.12", "F1040.24", FIN}
    assert gr_core <= set(gr_path), gr_path
    nec_docs = sorted({EV[s]["document_id"] for s in nec})
    assert len(nec_docs) == 5
    nec_rng = f"{nec_docs[0]}-{nec_docs[-1][1:]}"  # e.g. D16-20
    gr_docs = [doc_node(EV[ev_books]["document_id"], EV[ev_books]["page"]), doc_node(EV[ev_1099k]["document_id"], EV[ev_1099k]["page"])]
    nec_doc = {
        "id": "NEC#1", "kind": "doc", "label": "Forms 1099-NEC from five clients", "doc": nec_rng, "page": 1,
        "docType": "1099-NEC", "pageCount": 5, "fileName": f"five files ({nec_docs[0]} to {nec_docs[-1]})",
        "received": min(docs[d]["received_at"][:10] for d in nec_docs), "heading": None,
    }
    nec_ev = {
        "id": "nec", "kind": "evidence", "label": "Form 1099-NEC box 1, five forms (sum)", "field": "box1",
        "value": nec_total, "unit": "usd", "doc": nec_rng, "page": 1, "docTitle": "Forms 1099-NEC from five clients",
        "textAsRead": " + ".join(EV[s]["text_as_read"] for s in nec), "confidence": min(EV[s]["confidence"] for s in nec),
        "members": [{"id": s, "doc": EV[s]["document_id"], "value": EV[s]["value"]} for s in nec],
    }

    receipts = {
        "id": "receipts",
        "tab": "Gross receipts",
        "question": "Why is Schedule C gross receipts 163,700 when the books show 151,300?",
        "summary": (
            "The rule adds a Form 1099-K amount on top of the books' total income. The books already equal the five "
            "1099-NEC forms plus 9,300 of other receipts, so the 12,400 card-processor amount may be money counted twice. "
            "TaxProof flags it as a failed check rather than deciding it."
        ),
        "nodes": (
            gr_docs + [nec_doc]
            + [ev_node(ev_books, label_override="Books total income"), ev_node(ev_1099k, label_override="Form 1099-K gross amount"), nec_ev]
            + [line_node(k, core=k in gr_core) for k in gr_path]
        ),
        "edges": (
            [{"from": f"{EV[s]['document_id']}#{EV[s]['page']}", "to": s, "kind": "read"} for s in [ev_books, ev_1099k]]
            + [{"from": "NEC#1", "to": "nec", "kind": "read"}]
            + [{"from": ev_books, "to": "SchC.1", "kind": "feeds"}, {"from": ev_1099k, "to": "SchC.1", "kind": "feeds"}]
            + [{"from": "nec", "to": "SchC.1", "kind": "corroborates"}]
            + [{"from": a, "to": b, "kind": "feeds"} for a, b in zip(gr_path, gr_path[1:])]
        ),
        "flags": {
            ev_1099k: {
                "type": "wrong",
                "title": "Possibly already in the books",
                "text": "The engine adds this amount because it could not match it to a books deposit. TaxProof's check finds the books already reconcile to the 1099-NEC forms without it.",
            },
            ev_books: {
                "type": "note",
                "title": "Reconciles without the 1099-K",
                "text": "151,300 equals the five 1099-NEC amounts (142,000) plus 9,300 of other receipts.",
            },
            "SchC.1": {
                "type": "wrong",
                "title": "Needs a CPA's judgment",
                "text": "163,700 is books plus the unmatched 1099-K. If the 1099-K is already inside the books, it is 151,300.",
            },
        },
        "engine": {"label": "Gross receipts (SchC.1)", "value": 163700, "unit": "usd"},
        "independent": {
            "label": "If the 1099-K is already in the books",
            "value": 151300,
            "unit": "usd",
            "how": "142,000 (five 1099-NEC) + 9,300 other = 151,300 books total",
            "derived": True,
        },
        "effect": {
            "text": "Estimated tax effect of the correction: -$4,402 federal, -$384 California",
            "source": "TaxProof iteration log, assurance results on v3 (an estimate, flagged for review)",
        },
        "carry": {},
    }

    # ------------------------------------------------------------------ wages
    w = L["F1040.1a"]
    assert w["value"] == 212400 and sorted(w["sources"]) == ["ev-0016", "ev-0035"]
    assert EV["ev-0016"]["value"] + EV["ev-0035"]["value"] == 212400
    d10_box1 = [e for e in P["extracted_values"] if e["document_id"] == "D10" and e["field"] == "box1"]
    assert len(d10_box1) == 1 and d10_box1[0]["value"] == EV["ev-0035"]["value"]
    d10_ev = d10_box1[0]["id"]
    w_path = shortest_to_final("F1040.1a")
    w_core = {"F1040.1a", "F1040.9", "F1040.11", "F1040.15", "F1040.24", FIN}
    assert w_core <= set(w_path), w_path

    wages = {
        "id": "wages",
        "tab": "Wages",
        "question": "How does a second photo of the same W-2 avoid being counted twice?",
        "summary": (
            "Two W-2s feed wages of 212,400. The client also uploaded a phone photo of the second W-2. "
            "Here the engine gets it right: it matches the images, counts the form once, and says so in the line's note."
        ),
        "nodes": (
            [doc_node("D08", 1), doc_node("D09", 1), doc_node("D10", 1)]
            + [ev_node("ev-0016"), ev_node("ev-0035"), ev_node(d10_ev)]
            + [line_node(k, core=k in w_core) for k in w_path]
        ),
        "edges": (
            [{"from": "D08#1", "to": "ev-0016", "kind": "read"}, {"from": "D09#1", "to": "ev-0035", "kind": "read"}, {"from": "D10#1", "to": d10_ev, "kind": "read"}]
            + [{"from": "ev-0016", "to": "F1040.1a", "kind": "feeds"}, {"from": "ev-0035", "to": "F1040.1a", "kind": "feeds"}]
            + [{"from": d10_ev, "to": "F1040.1a", "kind": "excluded", "label": "matched to D09, not added"}]
            + [{"from": "D10#1", "to": "D09#1", "kind": "duplicate", "label": "second image of the same W-2"}]
            + [{"from": a, "to": b, "kind": "feeds"} for a, b in zip(w_path, w_path[1:])]
        ),
        "flags": {
            "D10#1": {
                "type": "duplicate",
                "title": "Duplicate document",
                "text": "A phone photo of the Halvorsen W-2 (D09). Same box 1 reading, so it is the same form.",
            },
            d10_ev: {
                "type": "ok",
                "title": "Not an input",
                "text": "Reads 107,800, the same as D09. The wages rule matches the images and counts the form once.",
            },
            "F1040.1a": {
                "type": "ok",
                "title": "Engine and TaxProof agree",
                "text": "104,600 + 107,800 = 212,400. The line's own note records that D10 was counted once.",
            },
        },
        "engine": {"label": "Wages (F1040.1a)", "value": 212400, "unit": "usd"},
        "independent": {
            "label": "Sum of the two distinct W-2s",
            "value": 212400,
            "unit": "usd",
            "how": "104,600 + 107,800",
            "derived": True,
        },
        "effect": {"text": "No correction needed", "source": "Check passes in TaxProof's assurance run"},
        "carry": {},
    }

    # ------------------------------------------------------------------ meta
    counts = {
        "documents": len(P["documents"]),
        "extractedValues": len(P["extracted_values"]),
        "returnVersions": [{"version": v["version"], "lines": len(v["lines"]), "computedAt": v["computed_at"][:10]} for v in rv],
    }
    assert counts["documents"] == 74 and counts["extractedValues"] == 3012, counts
    sm = v3["summary"]["federal"]

    # Hash-chain illustration. Same canonical form as backend/app/services/audit.py, with sample events.
    def canonical(eid, at, actor, role, action, target, payload, prev):
        return json.dumps(
            {"engagement_id": eid, "at": at, "actor_id": actor, "actor_role": role, "action": action,
             "target_ref": target, "payload": payload, "prev_hash": prev},
            sort_keys=True, separators=(",", ":"),
        )

    events_in = [
        ("2026-06-23T09:02:11.000000+00:00", "st-02", "preparer", "verification.add", "ev-0226", {"method": "viewed_source", "note": "Page 1 total ties to the log"}),
        ("2026-06-23T09:14:40.000000+00:00", "st-02", "preparer", "finding.raise", "line:v3:SchC.44a", {"finding": "duplicate_page", "pages": [2, 3]}),
        ("2026-06-23T10:31:05.000000+00:00", "st-03", "reviewer", "adjustment.apply", "line:v3:SchC.44a", {"from": 11800, "to": 8100, "unit": "mi"}),
        ("2026-06-23T10:33:52.000000+00:00", "st-03", "reviewer", "judgment.record", "line:v3:SchC.1", {"decision": "keep_engine", "rationale": "Awaiting client confirmation"}),
    ]
    prev = "0" * 64
    chain = []
    for at, actor, role, action, target, payload in events_in:
        h = hashlib.sha256(canonical("sample", at, actor, role, action, target, payload, prev).encode()).hexdigest()
        chain.append({"engagement": "sample", "at": at, "actor": actor, "role": role, "action": action, "target": target, "payload": payload, "prev": prev, "hash": h})
        prev = h

    data = {
        "meta": {
            "repo": REPO,
            "repoUrl": f"https://github.com/{REPO}",
            "sha": SHA,
            "builtAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "packetSha256": packet_sha,
            "packetName": P["packet"]["name"],
            "packetVersion": P["packet"]["version"],
            "counts": counts,
            "v3": {
                "trigger": v3["trigger"],
                "federalBalanceDue": sm["balance_due"],
                "federalTotalTax": sm["total_tax"],
                "federalAgi": sm["agi"],
            },
        },
        "traces": [mileage, receipts, wages],
        "chain": chain,
    }
    assert sm["balance_due"] == 4220 == L[FIN]["value"]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=1, ensure_ascii=True) + "\n")
    print(f"wrote {OUT} ({OUT.stat().st_size / 1024:.1f} KB); packet sha256 {packet_sha[:12]}…")
    for t in data["traces"]:
        print(f"  {t['id']:9} {len(t['nodes']):2} nodes {len(t['edges']):2} edges")


if __name__ == "__main__":
    sys.exit(main())
