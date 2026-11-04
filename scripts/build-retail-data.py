#!/usr/bin/env python3
"""Build app/data/retail-case.json from the Retail Demand Intelligence Platform repository.

Every value in the snapshot is read from a file in that repo at a pinned commit (no numbers are
typed in by hand), and the figures that the repo's EVAL_REPORT.md also states are asserted against it.
Standard library only. Run:  python3 scripts/build-retail-data.py
"""
import csv, io, json, statistics, urllib.request
from collections import defaultdict

REPO = "mannemkarthik010/retail-intel-platform"
SHA = "85a7291fcfae13d837d3b51b339b5353c94df7ac"
RAW = f"https://raw.githubusercontent.com/{REPO}/{SHA}/"

def get(path):
    with urllib.request.urlopen(urllib.request.Request(RAW + path, headers={"User-Agent": "portfolio-data-build"}), timeout=60) as r:
        return r.read().decode("utf-8")

def rows(path):
    return list(csv.DictReader(io.StringIO(get(path))))

CURATED = [  # (series, why it is worth looking at)
    ("S03_D05", "The example series from the repo's evaluation report"),
    ("S01_D01", "Holt-Winters was selected here"),
    ("S02_D03", "Seasonal-naive was selected here"),
    ("S04_D08", "Contains the injected 5-week supply disruption (and the 2020 demand shock)"),
    ("S10_D03", "Flagged by monitoring, then re-selected from gradient boosting to seasonal-naive"),
    ("S13_D08", "The largest per-series drift alert"),
    ("S19_D07", "Flagged by monitoring; the deployed model was kept"),
]
MODELS = ["seasonal_naive", "holt_winters", "global_gbm"]

selected = json.loads(get("reports/selected_model.json"))
summary = rows("reports/series_summary.csv")
cutoffs = rows("reports/per_cutoff_metrics.csv")
forecasts = rows("reports/current_forecasts.csv")
sales = rows("data/retail_sales.csv")
coverage = json.loads(get("reports/interval_coverage.json"))
importance = json.loads(get("reports/feature_importance.json"))
fleet_log = rows("reports/monitoring_fleet_log.csv")
alerts = rows("reports/monitoring_series_alerts.csv")
agent = json.loads(get("reports/agent_eval_report.json"))["mock_backend"]
events = json.loads(get("data/ground_truth_events.json"))
retrain_all = [json.loads(l) for l in get("reports/retraining_log.jsonl").splitlines() if l.strip()]
latest = {}
for r in retrain_all:               # the log is append-only and holds several runs; keep the latest decision per series
    latest[r["series"]] = r
retrain = [latest[k] for k in sorted(latest)]
trace_line = next(json.loads(l) for l in get("reports/agent_traces.jsonl").splitlines() if "store 3 dept 5" in l and "forecast" in l.lower())

# ---- fleet leaderboard (computed), asserted against docs/EVAL_REPORT.md section 1
by_model = defaultdict(list)
for r in summary: by_model[r["model"]].append(float(r["wape"]))
wins = defaultdict(int)
for m in selected.values(): wins[m] += 1
leaderboard = []
for m in MODELS:
    v = by_model[m]
    leaderboard.append({"model": m, "meanWape": round(statistics.mean(v) * 100, 2), "medianWape": round(statistics.median(v) * 100, 2),
                        "stdWape": round(statistics.pstdev(v) * 100, 2), "wins": wins[m]})
doc = {"global_gbm": (7.90, 154), "seasonal_naive": (8.58, 77), "holt_winters": (11.16, 9)}
for row in leaderboard:
    exp_mean, exp_wins = doc[row["model"]]
    assert abs(row["meanWape"] - exp_mean) < 0.06, (row, exp_mean)
    assert row["wins"] == exp_wins, (row, exp_wins)
assert sum(wins.values()) == 240
assert abs(coverage["empirical_coverage_overall"] - 0.7422) < 1e-4

# ---- per-series dots (selected model's backtest WAPE)
wape_of = {(r["series"], r["model"]): float(r["wape"]) for r in summary}
fleet = [{"series": s, "model": m, "wape": round(wape_of[(s, m)] * 100, 2)} for s, m in sorted(selected.items())]

# ---- curated series
sales_by = defaultdict(list)
for r in sales:
    sales_by[(int(r["Store"]), int(r["Dept"]))].append(r)
series_out = []
for sid, why in CURATED:
    store, dept = int(sid[1:3]), int(sid[5:7])
    hist = [{"d": r["Date"], "v": float(r["Weekly_Sales"]), "h": r["IsHoliday"] == "True",
             "p": any(float(r[f"MarkDown{i}"]) > 0 for i in range(1, 6))} for r in sales_by[(store, dept)]]
    fc = [{"d": r["forecast_date"], "v": float(r["forecast_value"]), "lo": float(r["forecast_low"]), "hi": float(r["forecast_high"])}
          for r in forecasts if r["series"] == sid]
    per_model = {m: {"wape": round(wape_of[(sid, m)] * 100, 2)} for m in MODELS}
    cut = defaultdict(dict)
    for r in cutoffs:
        if r["series"] == sid: cut[r["cutoff"]][r["model"]] = round(float(r["wape"]) * 100, 2)
    series_out.append({"id": sid, "store": store, "dept": dept, "why": why, "selected": selected[sid],
                       "modelUsed": next(r["model_used"] for r in forecasts if r["series"] == sid),
                       "history": hist, "forecast": fc, "wapeByModel": per_model,
                       "cutoffs": [{"cutoff": k, **v} for k, v in sorted(cut.items())]})
    assert len(fc) == 8 and len(hist) == 260, sid

out = {
    "source": {"repo": REPO, "commit": SHA, "files": sorted({"reports/agent_traces.jsonl", "reports/selected_model.json", "reports/series_summary.csv", "reports/per_cutoff_metrics.csv",
              "reports/current_forecasts.csv", "data/retail_sales.csv", "reports/interval_coverage.json", "reports/feature_importance.json",
              "reports/monitoring_fleet_log.csv", "reports/monitoring_series_alerts.csv", "reports/agent_eval_report.json",
              "data/ground_truth_events.json", "reports/retraining_log.jsonl"}),
               "note": "Dataset is synthetic (see docs/DATA_PROVENANCE.md in the repo)."},
    "events": events,
    "leaderboard": leaderboard,
    "fleet": fleet,
    "coverage": {"nominal": coverage["nominal_coverage"], "overall": coverage["empirical_coverage_overall"], "n": coverage["n_observations"],
                 "cutoff": coverage["cutoff_date"], "byModel": coverage["empirical_coverage_by_selected_model"]},
    "importance": [{"feature": i["feature"], "value": round(i["importance_mean"], 1)} for i in importance][:8],
    "monitoring": [{"cutoff": r["cutoff"], "wape": round(float(r["wape"]) * 100, 2), "drift": r["fleet_drift_flag"] == "True"} for r in fleet_log],
    "alerts": alerts,
    "retraining": retrain,
    "agent": {"cases": agent["n_cases"], "passed": agent["n_passed"], "knownLimitations": agent["n_known_limitations"],
              "byCategory": {k: {"n": v["n"], "passed": v["passed"]} for k, v in agent["by_category"].items()}},
    "trace": {"question": trace_line["question"], "backend": trace_line["backend"],
              "step": {k: trace_line["steps"][0][k] for k in ("reasoning", "tool", "args")},
              "result": {k: trace_line["steps"][0]["result"][k] for k in ("series", "model_used", "backtest_wape")},
              "answer": trace_line["final_answer"].split("\n")[:3]},
    "series": series_out,
}
with open("app/data/retail-case.json", "w") as f:
    json.dump(out, f, separators=(",", ":"))
print("wrote app/data/retail-case.json", len(json.dumps(out)) // 1024, "KB")
print("leaderboard:", leaderboard)
print("alerts columns:", list(alerts[0].keys()) if alerts else None)
print("retraining sample:", retrain[0] if retrain else None)
