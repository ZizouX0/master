#!/usr/bin/env python3
"""Merge wave-2 batches -> output/programmes.jsonl, wave-3 blocks -> output/funding.jsonl.

Deliberately runs against whatever is on disk. Two session limits have killed agents
mid-flight, so the dataset must be buildable at any moment rather than only when every
slice is in -- a partial dataset that is honest about being partial is the deliverable.
"""
import json, re, unicodedata
from pathlib import Path
from collections import defaultdict

OUT = Path("output")

def load(p):
    rows=[]
    for line in Path(p).read_text(encoding="utf-8", errors="replace").splitlines():
        line=line.strip()
        if not line: continue
        try:
            r=json.loads(line)
            if isinstance(r,dict): rows.append(r)
        except json.JSONDecodeError: pass
    return rows

def fold(s):
    s=unicodedata.normalize("NFKD",(s or "").lower())
    s="".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+"," ",s).strip()

def _nums(x):
    """Money/credit figures in a blob, normalised: '5.079,00' and '5079' compare equal."""
    out=set()
    for m in re.finditer(r"\d[\d.,]*", str(x or "")):
        t=m.group(0)
        if "," in t and "." in t: t=t.replace(".","").replace(",",".")
        elif "," in t:            t=t.replace(",",".")
        try:
            v=float(t)
            if v>=1: out.add(round(v,2))
        except ValueError: pass
    return out

_LANGS=("ingles","english","castellano","espanol","spanish","catala","catalan","galego",
        "gallego","euskera","frances","french")
def same_meaning(field, a, b):
    """Do two agents actually disagree, or just phrase it differently?

    Comparing raw prose flagged 225 'conflicts' that were almost all wording variance
    ('Ingles (English)' vs 'English -- UC3M runs this master in...'). Compare the thing
    the field is actually asserting instead.
    """
    fa, fb = fold(a), fold(b)
    if fa == fb: return True
    def miss(t):
        # "not yet published" does NOT contain "not published" -- that near-miss was
        # flagging two agents who both said the 2027-28 calendar is unpublished as a
        # conflict with each other.
        return (not t.strip() or any(m in t for m in (
            "not found","not published","not yet published","no publicad","sin publicar",
            "not yet out","no esta publicad","aun no","pendiente de publicaci",
            "see canonical record")))   # dedup stub, not a value
    # One agent finding a figure the other could not is COVERAGE, not contradiction.
    # Only two present-and-different values are a conflict worth a human's time.
    if miss(fa) or miss(fb): return True
    if field == "language_of_instruction":
        # Compare the FIRST language named, not every language mentioned: enrichment
        # prose routinely says things like "a public Spanish university teaching in
        # English", and set-comparison read that as disagreeing with plain "English".
        norm={"ingles":"en","english":"en","castellano":"es","espanol":"es","spanish":"es",
              "catala":"ca","catalan":"ca","galego":"gl","gallego":"gl","euskera":"eu",
              "frances":"fr","french":"fr"}
        first=lambda t: next((norm[l] for l in sorted(
            (x for x in _LANGS if x in t), key=lambda x: t.index(x))), None)
        return first(fa) == first(fb)
    if field == "official_status":
        cat=lambda t: ("ea" if "artistic" in t else "of" if "universitario" in t
                       else "tp" if ("propio" in t or "permanente" in t) else "?")
        return cat(fa) == cat(fb)
    if field == "non_eu_surcharge":
        yes=lambda t: t.strip().startswith(("yes","si","s ")) or "surcharge" in t or "doubl" in t
        return yes(fa) == yes(fb) and (_nums(a) == _nums(b) or not (_nums(a) and _nums(b)))
    na, nb = _nums(a), _nums(b)
    if na and nb:
        # Agree if they share a figure, or if their closest figures are within 1% --
        # agents variously write 266.67 and 267, 171.5 and 172, 231.83 and 232 for the
        # same derived per-credit price, and rounding is not a contradiction.
        if na & nb: return True
        return any(abs(x - y) <= 0.01 * max(x, y) for x in na for y in nb)
    return fa[:60] == fb[:60]

def slug(r):
    base=fold(r.get("institution"))[:28]+"-"+fold(r.get("programme_name_es") or r.get("programme_name_en") or r.get("programme_name"))[:38]
    return re.sub(r"\s+","-",base).strip("-")

# ---- programmes
progs={}
for f in sorted((OUT/"wave2").glob("batch-*.jsonl")):
    if "input" in f.name: continue
    for r in load(f):
        r.setdefault("id", slug(r))
        # RUCT code is the strongest identity; fall back to the slug
        k = (r.get("ruct_code") or "").strip() or r["id"]
        if k in progs:
            # Two agents enriching the same programme independently is a verification
            # signal, not noise. Keeping the richer record and dropping the other threw
            # away genuinely conflicting sourced figures -- UPC came back as 45.00
            # EUR/credit from one agent and 102.52 from another, and the second vanished.
            # Rule 8 says record contradictions, never resolve them silently.
            score=lambda x: sum(1 for v in x.values() if isinstance(v,str) and v.strip() and v.strip().upper() not in {"NOT FOUND","UNKNOWN",""})
            keep, drop = (progs[k], r) if score(r) <= score(progs[k]) else (r, progs[k])
            DECISIVE = ("tuition_total_eur","tuition_per_ects_eur","non_eu_surcharge",
                        "language_of_instruction","official_status","ects",
                        "application_window_2027","complementary_credits_required")
            conflicts = list(keep.get("conflicts") or [])
            for fld in DECISIVE:
                a, b_ = str(keep.get(fld) or "").strip(), str(drop.get(fld) or "").strip()
                if a and b_ and not same_meaning(fld, a, b_):
                    conflicts.append({
                        "field": fld, "value_kept": a[:400], "value_other": b_[:400],
                        "kept_from": keep.get("_batch"), "other_from": drop.get("_batch"),
                        "note": "two enrichment agents disagreed; both values retained per rule 8",
                    })
            keep["conflicts"] = conflicts
            keep.setdefault("duplicate_of", []).append(drop.get("id"))
            keep["_batch"] = keep.get("_batch") or f.stem
            progs[k] = keep
            continue
        r["_batch"]=f.stem
        progs[k]=r

# conservatory register: official, and structurally invisible to RUCT
ea=OUT/"wave1/registry-ensenanzas-artisticas.jsonl"
ea_rows=[r for r in load(ea) if r.get("path_code") not in ("-", "", None)] if ea.exists() else []
for r in ea_rows:
    r.setdefault("id", slug(r))
    r.setdefault("official_status", "máster en enseñanzas artísticas")
    r.setdefault("path_codes", [r.get("path_code")] if r.get("path_code") else [])
    r.setdefault("programme_name_es", r.get("programme_name"))
    r["_batch"]="registry-ensenanzas-artisticas"
    r.setdefault("verification_status","PENDING")
    progs.setdefault(r.get("boe_order") or r["id"], r)

# ---- funding
funds={}
for f in sorted((OUT/"wave3").glob("block*.jsonl")):
    for r in load(f):
        k=(r.get("scholarship_id") or r.get("name") or "").strip() or json.dumps(r)[:60]
        r["_block_file"]=f.stem
        funds[k]=r
# ---- link funding to programmes
# Without this the brief's heaviest criterion (funding, 40%) scores flat across every
# programme and the shortlist is really ranked on the other 60. Enrichment agents had no
# sight of the funding wave, so the join has to happen here.
STOP={"universidad","universitat","universidade","university","de","del","la","el","los",
      "las","y","i","the","of","campus","escuela","escola"}
def toks(x):
    return {w for w in fold(x).split() if w not in STOP and len(w)>3}

for f in funds.values():
    e=str(f.get("tunisian_eligible","")).strip().upper()
    f["tunisian_eligible"]=e or "NOT FOUND"

def is_emjm(r):
    blob=fold(" ".join(str(r.get(k,"")) for k in
        ("programme_name_es","programme_name_en","programme_name","institution","notes")))
    return "erasmus mundus" in blob or "conjunto internacional" in blob

for r in progs.values():
    ids=set(r.get("scholarship_ids_external") or [])
    ptoks=toks(r.get("institution"))
    prog_emjm=is_emjm(r)
    for k,f in funds.items():
        fid=f.get("scholarship_id") or k
        # a scheme tied to named Spanish institutions
        inst=f.get("spanish_institutions") or []
        if isinstance(inst,str): inst=[inst]
        inst=list(inst)+([f["tied_to_institution"]] if f.get("tied_to_institution") else [])
        if any(toks(i) & ptoks for i in inst if i):
            ids.add(fid); continue
        # Erasmus Mundus schemes attach to Erasmus Mundus programmes
        if prog_emjm and "erasmus mundus" in fold(str(f.get("name",""))+str(f.get("funder",""))):
            ids.add(fid); continue
        # Deliberately NOT linking nationwide schemes to every programme. Doing so makes
        # the funding score identical everywhere, which is the same failure as not linking
        # at all. A programme's funding score should say what is claimable FOR IT; the
        # handful of country-wide routes that survive are a constant and are reported
        # separately in funding.csv.
    r["scholarship_ids_external"]=sorted(ids)

# ---- clean display names: agents wrote prose ("NOT FOUND as a registered title (...)")
# into name fields, which then renders as the programme's title in the shortlist.
for r in progs.values():
    for k in ("programme_name_en","programme_name_es"):
        v=str(r.get(k) or "")
        if v.strip().upper().startswith("NOT FOUND") or len(v)>140:
            r[k]=""
    if not (r.get("programme_name_es") or r.get("programme_name_en")):
        # fall back to the registered RUCT title, which is always a real name
        r["programme_name_es"]=str(r.get("ruct_title") or r.get("ruct_candidate_title")
                                   or r.get("programme_name") or "").strip()[:140]

# ---- flag programmes whose September-2027 intake is in doubt
# A programme that may not run cannot sit at the top of a shortlist. WAVES ranked #1
# until its consortium turned out to have suspended recruitment; several other titles
# are A EXTINGUIR or pending verification. This is a ranking input, not a footnote.
# fold() strips punctuation and accents, so these are plain lowercase word sequences,
# NOT regexes -- passing a regex through fold() destroys its metacharacters, which is
# how the first version of this silently matched nothing at all.
RISK = [
    (["not to open the recruitment", "suspended recruitment", "not open the recruitment campaign",
      "decided not to open"],                                  "consortium has suspended recruitment"),
    (["has finished the current funding", "finished the current funding from the european commission",
      "funding has ended", "successor programme holds the eu funding"],
                                                               "Erasmus Mundus EU funding has ended for this consortium"),
    (["a extinguir", "extinguida", "en extincion", "plan en extincion", "titulacion a extinguir"],
                                                               "title winding down (A EXTINGUIR)"),
    (["pendiente de verificacion", "pendiente de resolucion de verificacion",
      "pendiente de aprobacion", "en proces de verificacio", "en proceso de verificacion"],
                                                               "not yet verified / not yet official"),
    (["appears to have been withdrawn", "soft 404", "no programme page exists",
      "serves the cev barcelona homepage"],                    "no live programme page - may be withdrawn"),
]
for r in progs.values():
    blob = fold(json.dumps(r, ensure_ascii=False))
    hits = [label for needles, label in RISK if any(n in blob for n in needles)]
    est = fold(str(r.get("ruct_candidate_estado") or r.get("estado") or ""))
    if "extingu" in est and "title winding down (A EXTINGUIR)" not in hits:
        hits.append("title winding down (A EXTINGUIR)")
    r["intake_2027_risk"] = "; ".join(dict.fromkeys(hits)) if hits else ""

# ---- write, only now that linking and name-cleaning have run
with (OUT/"programmes.jsonl").open("w",encoding="utf-8") as fh:
    for r in progs.values(): fh.write(json.dumps(r,ensure_ascii=False)+"\n")
with (OUT/"funding.jsonl").open("w",encoding="utf-8") as fh:
    for r in funds.values(): fh.write(json.dumps(r,ensure_ascii=False)+"\n")

# ---- report
def norm(x):
    """Fold accents before substring-matching status strings.

    'artist' is NOT a substring of 'artisticas' when the i carries an accent, which
    silently reported 13 conservatory records as 0 on the first run. Any status match
    below must go through this.
    """
    return fold(str(x or ""))

per=defaultdict(int)
for r in progs.values():
    for c in (r.get("path_codes") or ["?"]): per[str(c)]+=1
def category(r):
    """Exactly one bucket per record.

    Matched on the LEADING words of official_status, not anywhere in the string: several
    records read like "master universitario (NOT titulo propio)" or carry a CONFLICT note
    naming both, and substring-counting filed those twice -- 99 buckets for 87 records.
    """
    st = norm(r.get("official_status"))
    if st.startswith("master en ensenanzas artistic") or st.startswith("ensenanzas artistic"):
        return "ensenanzas_artisticas"
    if st.startswith("master universitario") or st.startswith("universitario"):
        return "oficial"
    if st.startswith("titulo propio") or st.startswith("master propio") or "formacion permanente" in st:
        return "titulo_propio"
    if "no university" in st or "private certificate" in st:
        return "no_university"
    return "unknown"

cats=defaultdict(int)
for r in progs.values(): cats[category(r)]+=1
elig=defaultdict(int)
for r in funds.values(): elig[str(r.get("tunisian_eligible","?")).upper()[:12]]+=1
print(f"programmes.jsonl : {len(progs)}")
print(f"  by category    : {dict(sorted(cats.items()))}")
print(f"  per path_code  : {dict(sorted(per.items()))}")
print(f"funding.jsonl    : {len(funds)}")
print(f"  tunisian_eligible: {dict(sorted(elig.items()))}")
