#!/usr/bin/env python3
"""Split output/raw_candidates.jsonl into ~15-candidate batches for wave-2 enrichment.

Batches are built so each agent gets a coherent slice it can be efficient on:
candidates are grouped by institution first (an agent already on a university's site can
open four pages there cheaply), and RUCT status is pre-attached from the backbone so the
agent does not have to re-derive it.
"""
import json, sys, re, unicodedata
from pathlib import Path
from collections import defaultdict

OUT = Path("output"); W2 = OUT/"wave2"; W2.mkdir(parents=True, exist_ok=True)
BATCH = int(sys.argv[1]) if len(sys.argv) > 1 else 15

def fold(s):
    s = unicodedata.normalize("NFKD", (s or "").lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", s).strip()

def main():
    cands = [json.loads(l) for l in (OUT/"raw_candidates.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]
    backbone = []
    bb = OUT/"ruct-backbone.jsonl"
    if bb.exists():
        backbone = [json.loads(l) for l in bb.read_text(encoding="utf-8").splitlines() if l.strip()]

    # index the backbone by significant title words so a candidate can be matched to its
    # registry row without an exact string match (agents name programmes inconsistently)
    STOP = {"master","universitario","en","de","del","la","el","los","las","y","por","e","i"}
    idx = defaultdict(list)
    for r in backbone:
        words = {w for w in fold(r["title"]).split() if w not in STOP and len(w) > 3}
        for w in words:
            idx[w].append((words, r))

    matched = 0
    for c in cands:
        if c.get("ruct_code"):
            matched += 1
            continue
        cw = {w for w in fold(c.get("programme_name")).split() if w not in STOP and len(w) > 3}
        ci = fold(c.get("institution"))
        best, score = None, 0.0
        seen = set()
        for w in cw:
            for words, r in idx.get(w, []):
                rid = r["ruct_code"]
                if rid in seen:
                    continue
                seen.add(rid)
                ov = len(cw & words) / max(1, len(cw | words))
                # require the university to look like the same one, or the title overlap
                # to be strong enough to stand on its own
                uni_ok = bool(set(fold(r["university"]).split()) & set(ci.split()))
                if ov > score and (uni_ok or ov > 0.55):
                    best, score = r, ov
        if best and score >= 0.34:
            c["ruct_candidate_code"] = best["ruct_code"]
            c["ruct_candidate_title"] = best["title"]
            c["ruct_candidate_estado"] = best["estado"]
            c["ruct_match_confidence"] = round(score, 2)
            matched += 1

    # group by institution so an agent stays on one domain where possible
    by_inst = defaultdict(list)
    for c in cands:
        by_inst[fold(c.get("institution"))[:40]].append(c)
    order = []
    for inst in sorted(by_inst, key=lambda k: -len(by_inst[k])):
        order.extend(by_inst[inst])

    batches = [order[i:i+BATCH] for i in range(0, len(order), BATCH)]
    for i, b in enumerate(batches, 1):
        p = W2/f"batch-{i:02d}-input.jsonl"
        with p.open("w", encoding="utf-8") as fh:
            for c in b:
                fh.write(json.dumps(c, ensure_ascii=False)+"\n")
    print(f"candidates      : {len(cands)}")
    print(f"RUCT-matched    : {matched} ({matched*100//max(1,len(cands))}%)")
    print(f"batches of {BATCH}  : {len(batches)}")
    for i, b in enumerate(batches, 1):
        insts = sorted({(c.get('institution') or '?')[:28] for c in b})
        print(f"  batch-{i:02d}: {len(b):2d} · {', '.join(insts[:4])}{' …' if len(insts)>4 else ''}")

if __name__ == "__main__":
    main()
