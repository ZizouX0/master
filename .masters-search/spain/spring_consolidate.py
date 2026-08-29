#!/usr/bin/env python3
"""Merge the spring-intake slices -> output/spring-intakes.csv + a summary.

Two axes (institution-type and path-code) plus a dataset-mining slice were run, so the
same programme can appear several times. Dedupe on institution+programme, keep the record
with the most evidence, and preserve disagreement about whether a spring intake exists --
that disagreement is the finding, not noise.
"""
import json, csv, re, unicodedata, sys
from pathlib import Path
from collections import defaultdict, Counter

OUT=Path("output"); SP=OUT/"spring"
def fold(s):
    s=unicodedata.normalize("NFKD",(s or "").lower())
    s="".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+"," ",s).strip()

rows=[]
for f in sorted(SP.glob("*.jsonl")):
    for line in f.read_text(encoding="utf-8",errors="replace").splitlines():
        line=line.strip()
        if not line: continue
        try:
            r=json.loads(line)
            if isinstance(r,dict) and (r.get("institution") or r.get("programme_name")):
                r["_slice"]=f.stem; rows.append(r)
        except json.JSONDecodeError: pass

groups=defaultdict(list)
for r in rows:
    groups[(fold(r.get("institution"))[:38], fold(r.get("programme_name"))[:52])].append(r)

def verdict(r):
    return str(r.get("spring_intake","")).strip().upper()[:9] or "NOT FOUND"

merged=[]
for k,g in groups.items():
    # richest record wins, but every distinct verdict is retained
    best=max(g,key=lambda x: sum(1 for v in x.values() if isinstance(v,str) and v.strip()))
    vs={verdict(x) for x in g}
    best["_verdicts_seen"]="; ".join(sorted(vs))
    best["_disagreement"]="YES" if len({v for v in vs if v in ("YES","NO")})>1 else ""
    best["_slices"]=", ".join(sorted({x["_slice"] for x in g}))
    best["_times_checked"]=len(g)
    merged.append(best)

merged.sort(key=lambda r:(verdict(r)!="YES", fold(r.get("institution"))))
COLS=["institution","programme_name","path_codes","spring_intake","start_month",
      "start_date_verbatim","intakes_per_year","other_intakes",
      "application_deadline_for_spring_intake","official_status","ruct_code","modality",
      "language_of_instruction","tuition_total_eur","url","evidence_verbatim","notes",
      "_verdicts_seen","_disagreement","_slices","_times_checked"]
def flat(v):
    if isinstance(v,(list,tuple)): return " | ".join(str(x) for x in v)
    if isinstance(v,dict): return json.dumps(v,ensure_ascii=False)
    return "" if v is None else str(v)
with (OUT/"spring-intakes.csv").open("w",newline="",encoding="utf-8") as fh:
    w=csv.DictWriter(fh,fieldnames=COLS,extrasaction="ignore"); w.writeheader()
    for r in merged: w.writerow({c:flat(r.get(c)) for c in COLS})

yes=[r for r in merged if verdict(r)=="YES"]
print(f"raw records      : {len(rows)}")
print(f"unique programmes: {len(merged)}")
print(f"verdicts         : {dict(Counter(verdict(r) for r in merged).most_common())}")
print(f"disagreements    : {sum(1 for r in merged if r['_disagreement'])}")
print(f"\nSPRING = YES ({len(yes)}):")
for r in yes:
    print(f"  {flat(r.get('institution'))[:36]:38} | {flat(r.get('programme_name'))[:44]:46} | "
          f"{flat(r.get('start_month'))[:14]:15} | {flat(r.get('official_status'))[:26]}")
