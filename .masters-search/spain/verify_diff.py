#!/usr/bin/env python3
"""Diff wave-4 independent re-sourcing against wave-2 enrichment -> output/verified.jsonl

Per the brief:
  fields that match           -> VERIFIED
  fields that differ          -> CONFLICT, both values and both sources retained
  fields the verifier missed  -> UNCONFIRMED

Comparison is semantic, reusing consolidate.same_meaning: two agents writing "266.67" and
"267", or "Ingles (English)" and "English (stated on the programme page)", agree.
"""
import json, sys
from pathlib import Path
sys.path.insert(0, ".masters-search/spain")
from consolidate import same_meaning, fold          # noqa: E402

OUT = Path("output")
FIELDS = ["official_status","ruct_code","ects","modality","language_of_instruction",
          "tuition_total_eur","tuition_year_of_rates","non_eu_surcharge",
          "complementary_credits_required","application_window_2027"]

def load(p):
    rows=[]
    for line in Path(p).read_text(encoding="utf-8",errors="replace").splitlines():
        line=line.strip()
        if line:
            try:
                r=json.loads(line)
                if isinstance(r,dict): rows.append(r)
            except json.JSONDecodeError: pass
    return rows

def main():
    progs=load(OUT/"programmes.jsonl")
    ver={}
    for f in sorted((OUT/"wave4").glob("verify-*.jsonl")):
        if "input" in f.name: continue
        for r in load(f):
            if r.get("id"): ver.setdefault(r["id"], r)
    print(f"wave-2 programmes: {len(progs)} · wave-4 verifications: {len(ver)}")

    tally={"VERIFIED":0,"CONFLICT":0,"UNCONFIRMED":0,"NOT VERIFIED":0}
    for p in progs:
        v=ver.get(p.get("id"))
        if not v:
            p["verification_status"]="NOT VERIFIED"
            tally["NOT VERIFIED"]+=1
            continue
        results, conflicts = {}, list(p.get("conflicts") or [])
        for fld in FIELDS:
            a=str(p.get(fld) or "").strip()
            b=str(v.get(fld) or "").strip()
            miss=lambda t: (not t) or fold(t).startswith(("not found","not published","unknown"))
            if miss(b):
                results[fld]="UNCONFIRMED"
            elif miss(a):
                results[fld]="UNCONFIRMED"
                # the verifier found something enrichment did not -- keep it, flagged
                p[fld]=b
                p.setdefault("filled_by_verifier",[]).append(fld)
            elif same_meaning(fld,a,b):
                results[fld]="VERIFIED"
            else:
                results[fld]="CONFLICT"
                conflicts.append({"field":fld,"value_kept":a[:400],"value_other":b[:400],
                                  "kept_from":p.get("_batch"),"other_from":"wave4-verifier",
                                  "note":"enrichment and independent verification disagree"})
        p["field_verification"]=results
        p["conflicts"]=conflicts
        # the brief escalates a conflict on cost, deadline, official status or language
        decisive={"tuition_total_eur","application_window_2027","official_status",
                  "language_of_instruction","non_eu_surcharge"}
        if any(results[f]=="CONFLICT" for f in decisive if f in results):
            p["verification_status"]="CONFLICT"; p["needs_tiebreak"]=True
        elif any(v_=="CONFLICT" for v_ in results.values()):
            p["verification_status"]="CONFLICT"
        elif all(v_=="UNCONFIRMED" for v_ in results.values()):
            p["verification_status"]="UNCONFIRMED"
        else:
            p["verification_status"]="VERIFIED"
        tally[p["verification_status"]]+=1

    with (OUT/"verified.jsonl").open("w",encoding="utf-8") as fh:
        for p in progs: fh.write(json.dumps(p,ensure_ascii=False)+"\n")
    print("verification status:", tally)
    print("needing a third-agent tie-break:",
          sum(1 for p in progs if p.get("needs_tiebreak")))

if __name__=="__main__":
    main()
