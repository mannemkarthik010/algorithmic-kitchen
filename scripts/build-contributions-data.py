#!/usr/bin/env python3
"""Build app/data/contributions-live.json for the Code Evolution viewer.

For each of Karthik's open-source pull requests this reads the PUBLIC GitHub API (no token) and records what GitHub
says right now: state, merge time, size, reviews, labels, the changed files and their actual diff hunks, and whether
a closing comment says the PR was superseded. Nothing is written by hand and nothing is inferred beyond that.

The viewer shows the status exactly as recorded here. Run again to refresh. Unauthenticated limit is 60 requests an
hour; this uses about 5 per pull request.

Run:  python3 -I scripts/build-contributions-data.py
"""
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

PRS = [
    ("pandera-itemsize-dtypes", "unionai-oss/pandera", 2437),
    ("pytorch-fx-format-target", "pytorch/pytorch", 191687),
    ("pytorch-dcp-grad-dtype", "pytorch/pytorch", 191998),
    ("pytorch-flight-recorder-gc", "pytorch/pytorch", 191439),
]
OUT = Path(__file__).resolve().parent.parent / "app" / "data" / "contributions-live.json"
ME = "mannemkarthik010"


def get(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "portfolio-build-script", "Accept": "application/vnd.github+json"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.loads(r.read())


def hunk(patch: str, limit: int):
    """First hunk of a patch, trimmed to `limit` lines, as typed lines."""
    lines = patch.split("\n")
    out = []
    started = False
    for ln in lines:
        if ln.startswith("@@"):
            if started:
                break
            started = True
            out.append({"t": "meta", "s": ln})
            continue
        if not started:
            continue
        kind = "add" if ln.startswith("+") else "del" if ln.startswith("-") else "ctx"
        out.append({"t": kind, "s": ln[1:] if ln[:1] in "+- " else ln})
        if len(out) >= limit:
            break
    return out


def main() -> None:
    data = []
    for slug, repo, n in PRS:
        base = f"https://api.github.com/repos/{repo}"
        pr = get(f"{base}/pulls/{n}")
        reviews = get(f"{base}/pulls/{n}/reviews")
        files = get(f"{base}/pulls/{n}/files?per_page=30")
        comments = get(f"{base}/issues/{n}/comments?per_page=50")

        is_test = lambda p: bool(re.search(r"(^|/)(tests?|test_[^/]*|[^/]*_test\.py)(/|$)", p))
        fl = []
        for f in files:
            role = "test" if is_test(f["filename"]) else "source"
            fl.append({
                "path": f["filename"], "status": f["status"], "additions": f["additions"], "deletions": f["deletions"], "role": role,
                "hunk": hunk(f.get("patch") or "", 26 if role == "source" else 18),
            })
        # one meaningful change per role first
        fl.sort(key=lambda x: (x["role"] != "source", -(x["additions"] + x["deletions"])))

        rv = [{"user": r["user"]["login"], "state": r["state"], "at": r["submitted_at"][:10], "mine": r["user"]["login"] == ME}
              for r in reviews if r["state"] != "PENDING"]
        # Latest decision per reviewer who is not me
        latest = {}
        for r in rv:
            if not r["mine"] and r["state"] in ("APPROVED", "CHANGES_REQUESTED", "DISMISSED"):
                latest[r["user"]] = r["state"]
        sup = None
        for c in comments:
            if re.search(r"supersed|in favor of|instead of this|closing (this )?(pr|pull)", c["body"], re.I) and c["user"]["login"] != "pytorch-bot[bot]":
                sup = {"by": c["user"]["login"], "at": c["created_at"][:10], "text": re.sub(r"\s+", " ", c["body"]).strip()[:220]}
                break

        state = "merged" if pr["merged"] else pr["state"]
        data.append({
            "slug": slug, "repo": repo, "number": n, "url": pr["html_url"], "title": pr["title"],
            "state": state, "draft": pr["draft"], "createdAt": pr["created_at"][:10], "updatedAt": pr["updated_at"][:10],
            "mergedAt": (pr["merged_at"] or "")[:10] or None, "closedAt": (pr["closed_at"] or "")[:10] or None,
            "additions": pr["additions"], "deletions": pr["deletions"], "changedFiles": pr["changed_files"],
            "labels": [l["name"] for l in pr["labels"]],
            "reviews": rv, "latestDecisions": latest, "closingNote": sup,
            "files": fl,
        })
        print(f"  {slug:28} {state:7} +{pr['additions']}/-{pr['deletions']} files={pr['changed_files']} decisions={latest} note={'yes' if sup else 'no'}")

    OUT.write_text(json.dumps({"fetchedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "author": ME, "prs": data}, indent=1, ensure_ascii=True) + "\n")
    print(f"wrote {OUT} ({OUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    sys.exit(main())
