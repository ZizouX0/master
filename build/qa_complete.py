"""Completeness check: every non-empty field of a dossiered programme must be
findable in Program_Dossiers.pdf, and every usable programme's key fields in
dashboard.html. Compares against master_programs.csv rather than against the
generator, so a bug in the generator cannot hide itself."""
import sys, re, json, subprocess, importlib, unicodedata
sys.path.insert(0, "build"); sys.path.insert(0, "research")
from pathlib import Path
from data import load

def norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", s).strip().lower()

def squash(s):
    """Whitespace-free form. PDF extraction and CSS word-break both insert line
    breaks inside long values — especially URLs — so a space-sensitive compare
    reports data as missing when it is plainly on the page."""
    return re.sub(r"\s+", "", norm(s))

SKIP = {"paths","fee_num","deadline_date","deadline_conf","deadline_label","usable","_score"}

def check_pdf(pdf, ids, rows):
    import pymupdf
    doc = pymupdf.open(pdf)
    text = norm(" ".join(p.get_text() for p in doc))
    tight = squash(text)
    missing = []
    for r in rows:
        if r["id"] not in ids: continue
        for k, v in r.items():
            if k in SKIP or k.startswith("_") or not isinstance(v, str) or not v.strip():
                continue
            nv = norm(v)
            if len(nv) < 3: continue
            # pipe-delimited fields are rendered as lists, so check the parts,
            # not the delimiter — every datum must appear, the separator need not
            parts = [x.strip() for x in v.split("|") if len(x.strip()) > 2] if "|" in v else [v]
            gone = [x for x in parts
                    if norm(x)[:110] not in text and squash(x)[:110] not in tight]
            if gone:
                missing.append((r["id"], k, gone[0][:70]))
    return missing, doc.page_count

def check_html(path, rows):
    raw = norm(Path(path).read_text(encoding="utf-8"))
    tight = squash(raw)
    missing = []
    for r in rows:
        if not r["usable"]: continue
        for k, v in r.items():
            if k in SKIP or k.startswith("_") or not isinstance(v, str) or not v.strip(): continue
            nv = norm(v)
            if len(nv) < 3: continue
            parts = [x.strip() for x in v.split("|") if len(x.strip()) > 2] if "|" in v else [v]
            gone = [x for x in parts
                    if norm(x)[:110] not in raw and squash(x)[:110] not in tight]
            if gone:
                missing.append((r["id"], k, gone[0][:70]))
    return missing

if __name__ == "__main__":
    rows = load()
    ids = json.load(open("build/dossier_ids.json"))
    miss, pages = check_pdf("deliverables/tools/Program_Dossiers.pdf", set(ids), rows)
    print(f"Program_Dossiers.pdf — {pages} pages, {len(ids)} programmes")
    print(f"  missing fields: {len(miss)}")
    from collections import Counter
    for k, n in Counter(m[1] for m in miss).most_common():
        print(f"    {k}: {n}")
    for m in miss[:12]:
        print(f"      {m[0]} {m[1]} :: {m[2]}")
