#!/usr/bin/env python3
"""Build app/data/preventive-case.json for the Preventive Care case study.

Reads the Preventive-Care-Recommendation repo at a PINNED commit and extracts only things that can be
reproduced or read verbatim:

  * the risk function (utils.py) is executed on three FICTIONAL sample patients, and on its documented
    worked example, so the risk numbers on the page are real outputs of the repo's code;
  * the retrieval query is the repo's f-string template filled with each patient's values;
  * the critique rubric, schemas and router parameters are asserted to appear in the repo's source;
  * the 12 mock guideline PDFs are read with the stdlib (zlib) and shown as they are.

It does NOT run retrieval (needs MiniLM + Chroma), the LLM, or the critic. The page never shows or
invents their output.

Run:  python3 -I scripts/build-preventive-data.py
"""
import hashlib
import json
import re
import sys
import urllib.request
import zlib
from datetime import datetime, timezone
from pathlib import Path

REPO = "mannemkarthik010/Preventive-Care-Recommendation"
SHA = "be17eae67e11e381eb98f6db19d28c234ed84b45"
RAW = f"https://raw.githubusercontent.com/{REPO}/{SHA}/"
OUT = Path(__file__).resolve().parent.parent / "app" / "data" / "preventive-case.json"
DOCS = ["AHA_2023_Prevention_Guidelines", "ESC_2021_Cardiovascular_Risk_Guidelines"] + [f"Additional_Guideline_{i}" for i in range(1, 11)]


def fetch(path: str) -> bytes:
    req = urllib.request.Request(RAW + path, headers={"User-Agent": "portfolio-build-script"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def pdf_text(b: bytes) -> tuple[str, int]:
    out = []
    for m in re.finditer(rb"stream\r?\n(.*?)endstream", b, re.S):
        raw = m.group(1)
        try:
            t = zlib.decompress(raw)
        except Exception:
            t = raw
        out += [s.decode("latin1").replace("\\(", "(").replace("\\)", ")") for s in re.findall(rb"\((.*?)\)\s*Tj", t, re.S)]
    return " ".join(out), len(re.findall(rb"/Type /Page\b", b))


def main() -> None:
    utils_src = fetch("utils.py").decode()
    agent_src = fetch("agent.py").decode()
    schemas_src = fetch("schemas.py").decode()
    rag_src = fetch("rag.py").decode()
    app_src = fetch("app.py").decode()

    # utils.py imports only `math`; run it in an isolated namespace
    ns: dict = {}
    exec(compile(utils_src, "utils.py", "exec"), ns)
    risk = ns["calculate_ascvd_10yr_risk"]

    # documented worked example: 55 y, TC 213, HDL 50, SBP 120 untreated, non-smoker, no diabetes
    worked = []
    for sex, race, expect in [("female", "white", 2.1), ("female", "black", 3.0), ("male", "white", 5.4), ("male", "black", 6.1)]:
        got = risk(55, sex, 213, 50, 120, False, False, False, race=race)["risk_percentage"]
        assert got == expect, (sex, race, got, expect)
        worked.append({"sex": sex, "race": race, "risk": got})

    # source assertions: everything the page states about the pipeline must still be in the repo
    for needle in ["MAX_REVISIONS = 2", "k=5", 'if state.get("revision_count", 0) > MAX_REVISIONS', "temperature=0",
                   "grounded ONLY in the guideline", "Contains no contraindicated suggestions", "Is tailored to the patient's"]:
        assert needle in agent_src, needle
    assert "chunk_size=512" in rag_src and "chunk_overlap=64" in rag_src and "all-MiniLM-L6-v2" in rag_src
    assert "RecursiveCharacterTextSplitter" in rag_src and "length_function" not in rag_src  # default len() = characters
    for needle in ["class PatientProfile", "class RiskAssessment", "class CarePlan", "class CritiqueResult"]:
        assert needle in schemas_src, needle
    assert "Guideline sources" in app_src and "showing best draft" in app_src

    # fictional sample patients (no real people). Risk is computed by the repo's own function.
    samples = [
        dict(id="p1", label="Sample patient 1", age=45, sex="female", race="white", total_cholesterol=185, hdl_cholesterol=62, systolic_bp=114, smoker=False, diabetes=False, bp_meds=False),
        dict(id="p2", label="Sample patient 2", age=60, sex="male", race="white", total_cholesterol=205, hdl_cholesterol=52, systolic_bp=126, smoker=False, diabetes=False, bp_meds=False),
        dict(id="p3", label="Sample patient 3", age=58, sex="male", race="white", total_cholesterol=232, hdl_cholesterol=41, systolic_bp=138, smoker=True, diabetes=False, bp_meds=True),
    ]
    patients = []
    for s in samples:
        r = risk(s["age"], s["sex"], s["total_cholesterol"], s["hdl_cholesterol"], s["systolic_bp"], s["smoker"], s["diabetes"], s["bp_meds"], race=s["race"])
        # the repo's retrieval query template (agent.retrieve_guidelines), filled verbatim
        query = (
            f"Preventive cardiovascular care for a {s['age']}-year-old {s['sex']} with "
            f"{r['risk_tier'].lower()} 10-year ASCVD risk ({r['risk_percentage']}%), "
            f"smoker={s['smoker']}, diabetes={s['diabetes']}, on BP medication={s['bp_meds']}."
        )
        assert "Preventive cardiovascular care for a {p.age}-year-old {p.sex} with" in agent_src
        patients.append({**s, "risk": r, "query": query})
    assert [p["risk"]["risk_tier"] for p in patients] == ["Low", "Intermediate", "High"], [p["risk"] for p in patients]

    # the mock corpus, as shipped
    corpus = []
    boiler_set = set()
    for name in DOCS:
        text, pages = pdf_text(fetch(f"data/{name}.pdf"))
        m = re.search(r"(Patients should adhere to best clinical practices.*)$", text)
        if m:
            boiler_set.add(m.group(1))
        corpus.append({"file": f"{name}.pdf", "pages": pages, "chars": len(text), "text": text, "boilerplate": bool(m)})
    n_boiler = sum(c["boilerplate"] for c in corpus)
    assert n_boiler == 10 and len(corpus) == 12 and all(c["pages"] == 1 for c in corpus)
    assert len(boiler_set) == 1  # the same sentence in all ten
    boiler = next(iter(boiler_set))
    assert all(c["chars"] < 512 for c in corpus)  # each fits in one 512-character chunk

    data = {
        "meta": {
            "repo": REPO, "repoUrl": f"https://github.com/{REPO}", "sha": SHA,
            "builtAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "demoUrl": "https://preventive-care-recommendation.streamlit.app/",
            "utilsSha256": hashlib.sha256(utils_src.encode()).hexdigest(),
        },
        "worked": worked,
        "patients": patients,
        "corpus": corpus,
        "boilerplate": boiler,
        "stats": {"documents": len(corpus), "boilerplateDocs": n_boiler, "pagesEach": 1},
        "pipeline": {"k": 5, "chunkSize": 512, "chunkOverlap": 64, "chunkUnit": "characters", "embedding": "all-MiniLM-L6-v2", "maxRevisions": 2, "temperature": 0},
    }
    OUT.write_text(json.dumps(data, indent=1, ensure_ascii=True) + "\n")
    print(f"wrote {OUT} ({OUT.stat().st_size / 1024:.1f} KB)")
    for p in patients:
        print(" ", p["id"], p["risk"]["risk_percentage"], p["risk"]["risk_tier"])


if __name__ == "__main__":
    sys.exit(main())
