import json, sys, re
sys.path.insert(0,'.masters-search')
import build_master as M

CUT = re.compile(r"\s*(?:[—–-]\s*)?(?:successor title|CONFIRMED|VERIFIED|STATUS:|APPEARS |NOT A MASTER|"
                 r"INSTITUTION HAS|MARKET-LEVEL|FUNDING-SCHEME|NO RELEVANT PROGRAMME|"
                 r"\(course code|\(co-?ordinat|— NOT |, NOT A )", re.I)
def title(p):
    t = M.txt(p, 400); m = CUT.search(t)
    if m and m.start() > 12: t = t[:m.start()]
    t = t.strip(" —–-,;:")
    return t if len(t) <= 88 else t[:88].rsplit(" ",1)[0] + "…"

MONTH = re.compile(r"\b(january|february|march|april|may|june|july|august|september|october|november|december"
                   r"|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b|\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b", re.I)
ROLLING = re.compile(r"\brolling\b|no (?:fixed|published) deadline|year[- ]round|first[- ]come", re.I)
NOISE = re.compile(r"previous record|CORRECTION|was wrong|earlier draft|prior record", re.I)
def deadline(s):
    """A chip only when the text really states a date — and never a correction note."""
    t = M.txt(s, 400)
    if not t: return ""
    parts = re.split(r"(?<=[a-z0-9\)])\.\s+|;\s+", t)
    for seg in parts:
        if NOISE.search(seg): continue
        if MONTH.search(seg) or ROLLING.search(seg):
            seg = re.sub(r"^\s*(CONFIRMED|VERIFIED|CORRECTED|NOTE)[:.\s—–-]*", "", seg, flags=re.I).strip()
            return seg[:62].rstrip(" ,;–—") + ("…" if len(seg) > 62 else "")
    return ""

def t(v,n): return M.txt(v,n)
rows = M.main(); out=[]
for r in rows:
    rec=r["_rec"]; v=(rec.get("valueVerdict") or "").upper()
    verdict = "WORTH IT" if v.startswith("WORTH") else ("AVOID" if v.startswith("AVOID") else ("CONDITIONAL" if v else ""))
    out.append({"c":r["Country"],"rg":r["Region"],"ct":t(r["City"],40),"i":r["Institution"],
      "p":r["Programme / scheme"],"pt":title(r["Programme / scheme"]),
      "ch":r["Chance for you"],"why":r["Why that chance"],"cb":r["Cost band (you)"],
      "lg":r["Taught in"],"pp":r["Public/Private"],"fu":r["Funding"],"tr":r["Track"],
      "sch":r["Scholarship"],"vd":verdict,"rt":t(rec.get("rating"),3),
      "dls":deadline(rec.get("deadline")),
      "deg":t(rec.get("qualification") or rec.get("degree"),320),"acc":t(rec.get("accreditationStatus"),400),
      "visa":t(rec.get("visaEligible"),260),
      "fee":t(rec.get("tuitionNonEU") or rec.get("tuitionIntl") or rec.get("tuitionTotal") or rec.get("tuitionPerYear"),400),
      "fees2":t(rec.get("otherFees"),300),"allin":t(rec.get("totalCostEstimate"),340),
      "schd":t(rec.get("scholarships") or rec.get("scholarship") or rec.get("stipendCoverage"),400),
      "lgr":t(rec.get("languageRequirement"),260),"eng":t(rec.get("englishTest"),260),
      "dl":t(rec.get("deadline"),300),"op":t(rec.get("applicationOpens"),240),
      "dur":t(rec.get("durationEcts"),140),"entry":t(rec.get("entryRequirements"),500),
      "nm":t(rec.get("acceptsNonMusic"),300),"pf":t(rec.get("portfolioSpec") or rec.get("portfolioReq"),340),
      "au":t(rec.get("auditionSpec"),240),"study":t(rec.get("whatYouStudy") or rec.get("focus"),420),
      "rec":t(rec.get("recommendation") or rec.get("fitNotes"),700),
      "src":(rec.get("sourceUrl") or "").split(" ")[0][:300],"sw":rec.get("_source","")})
json.dump(out, open(sys.argv[1],"w",encoding="utf-8"), ensure_ascii=False, separators=(",",":"))
print("rows",len(out),"| deadline chips", sum(1 for o in out if o["dls"]))
noise=[o for o in out if o["dls"] and re.search(r"previous record|CORRECTION", o["dls"], re.I)]
print("noisy chips remaining:", len(noise))
for o in [x for x in out if x["vd"]=="WORTH IT"][:6]:
    print(f"   {o['dls'][:56]:<58} | {o['pt'][:40]}")
