#!/usr/bin/env python3
"""Decide whether a record is actually a master's degree.

The dataset deliberately contains things that are NOT master's degrees — that is the
whole point of the private-schools sweep, which went looking for certificates sold as
"Masters". This module separates them.

The hard part is negation. Verified records frequently describe a real degree by saying
what it is NOT: "a genuine second-cycle degree, not a Lehrgang or certificate", or
"MESTRADO — a real degree, NOT a pós-graduação". A naive keyword match reads the words
"certificate" and "pós-graduação" and throws the degree away. Every disqualifier is
therefore checked for a preceding negation before it counts.
"""
import re

LEVELS = ["Master's degree", "Master di I livello (60 CFU)", "Bachelor / first cycle",
          "Not a degree", "Funding scheme", "Aggregate entry", "Unclear"]

# --- things that mean "this is a real second-cycle degree" -------------------------
RX_MASTER = re.compile(
    r"\bmaster of (?:arts|science|music|engineering|laws)|\bM\.?Sc\.?\b|\bM\.?A\.?\b|\bMMus\b|"
    r"\bM\.?M\.?\b|\bM\.?Mus\.?\b|\bMBA\b|master'?s degree|máster universitario oficial|mestrado\b|"
    r"laurea magistrale|magistrale\b|(?:diploma accademico di )?(?:secondo|ii) livello|"
    r"second[- ]?(?:cycle|level)|2(?:nd)?[ -]?(?:cycle|level)|EQF (?:level )?7|NFQ level 9|"
    r"yüksek lisans|diplôme national de master|dipl[oô]me de master|magistersk|"
    r"navazující magisterský|inžinier|inženýr\b|\bIng\.|kandidat|maîtrise|"
    r"master programme|master program\b|diplom[- ]ingenieur|\bM\.?F\.?A\.?\b|"
    # the long tail of British and American master's abbreviations
    r"\bM\.?Phil\.?\b|\bMSocSc\b|\bMS in\b|\bM\.S\.|\bMRes\b|\bMLitt\b|\bMSt\b|"
    r"\bM\.?Eng\.?\b|\bMArch\b|\bMEd\b|\bLL\.?M\.?\b|"
    # last resort: a bare "Master ..." in the title. Safe because a disqualifier in the
    # same field (titulo propio, "not a master", CRKBO) is checked first and wins.
    r"\bmaster\b|\bm[aá]ster\b", re.I)

# --- things that mean "this is NOT a master's degree" ------------------------------
RX_NOTDEG = re.compile(
    r"t[ií]tulo propio|t[ií]tol propi|m[aàá]ster propi[oa]?\b|"
    r"(?:institution|school|university)'?s own master|"
    r"not an official|non[- ]official (?:master|title)|"
    r"formaci[oó]n permanente|\bCRKBO\b|NRTO\b|short course|"
    r"p[oó]s[- ]gradua|curso t[eé]cnico|advanced diploma|private (?:school )?certificate|"
    r"not a (?:master|degree|recognised)|is not a master|no ECTS|"
    r"unrecognis|non[- ]accredited|not accredited|attestato|regional certificate", re.I)
RX_BACHELOR = re.compile(
    r"\bBA \(Hons\)|\bB\.?Sc\.?\b|\bB\.?A\.?\b|bachelor|primo livello|first[- ]?(?:cycle|level)|"
    r"1st cycle|licence\b|undergraduate|laurea triennale|\btriennio\b|EQF (?:level )?6", re.I)
RX_ILEVEL = re.compile(r"master (?:universitario )?di (?:i|primo) livello|"
                       r"master di 1[°º]? livello|60 CFU|"
                       # Italian first-level masters are also written out in English
                       r"1st[- ]level (?:university )?master|first[- ]level (?:university )?master",
                       re.I)
RX_SCHEME = re.compile(r"funding[- ]scheme finding|not a qualification|"
                       r"^(?:scholarship|bursary|grant)\b", re.I)
RX_AGGREG = re.compile(r"^(?:~?\d+\+?\s|any |all |participating|market[- ]level|"
                       r"no relevant programme|institution has|systematic check|sector)", re.I)

# a disqualifier preceded by one of these is the record DENYING it, not admitting it
NEG = re.compile(r"(?:not|nor|never|rather than|isn'?t|is not|are not|as opposed to|"
                 r"unlike|no longer|instead of)\s+(?:a |an |the )?(?:mere(?:ly)? )?$", re.I)


def _real_hit(rx, text):
    """True only for a match that is NOT preceded by a negation."""
    for m in rx.finditer(text):
        if not NEG.search(text[max(0, m.start() - 28):m.start()]):
            return True
    return False


def level(rec, programme="", institution=""):
    """rec = the raw source record dict."""
    qual = str(rec.get("qualification") or rec.get("degree") or "")
    acc = str(rec.get("accreditationStatus") or "")
    name = f"{programme} {institution}"

    # a record with no programme at all, only a scheme name, is money rather than a course
    if not str(rec.get("program") or "").strip() and str(rec.get("scholarshipName") or "").strip():
        return "Funding scheme"
    if RX_SCHEME.search(qual) or RX_SCHEME.search(programme):
        return "Funding scheme"
    if RX_AGGREG.search(institution.strip()) or RX_AGGREG.search(programme.strip()):
        return "Aggregate entry"

    # the qualification field is authoritative; fall back to accreditation, then the name
    for field in (qual, acc, name):
        if not field.strip():
            continue
        if _real_hit(RX_ILEVEL, field):
            return "Master di I livello (60 CFU)"
        neg = _real_hit(RX_NOTDEG, field)
        bach = _real_hit(RX_BACHELOR, field)
        mast = _real_hit(RX_MASTER, field)
        if mast and not neg and not bach:
            return "Master's degree"
        if neg:
            return "Not a degree"
        if bach and not mast:
            return "Bachelor / first cycle"
        if mast:
            return "Master's degree"
    # nothing named an award. If the record is talking about money, it is a scheme —
    # this fires last so a named degree always wins over the word "scholarship".
    if re.search(r"scholarship|bursar|\bgrants?\b|funding[- ]scheme|fellowship", name, re.I):
        return "Funding scheme"
    return "Unclear"


if __name__ == "__main__":
    import sys
    sys.path.insert(0, ".masters-search")
    import build_master as M
    from collections import Counter

    rows = M.main()
    for r in rows:
        r["_lvl"] = level(r["_rec"], r["Programme / scheme"], r["Institution"])

    # cases whose answer is known from reading the source pages during the search
    EXPECT = [
        ("Ilmenau", "Medieningenieur", "Master's degree"),
        ("Künste Bremen", None, "Master's degree"),
        ("industrielle Gestaltung Linz", "Interface Cultures", "Master's degree"),
        ("Saint Louis", "Sound Design", "Master's degree"),
        ("Munster", None, "Master's degree"),
        ("Ankara Müzik", None, "Master's degree"),
        ("ČVUT", None, "Master's degree"),
        ("Žilin", None, "Master's degree"),
        ("Berklee", "Music Production", "Master's degree"),
        ("UCAM", None, "Not a degree"),
        ("Francisco de Vitoria", None, "Not a degree"),
        ("Pro Audio Education", None, "Not a degree"),
        ("Abbey Road", "Advanced Diploma", "Not a degree"),
        ("Mohole", None, "Not a degree"),
        # ESMUC is a genuine public conservatoire, but these two are its OWN titles
        ("ESMUC", "Bandes Sonores", "Not a degree"),
        ("Escola Superior de Música de Catalunya", "Composició Musical amb Tecnologies", "Not a degree"),
        ("Cattolica", "Comunicazione Musicale", "Master di I livello (60 CFU)"),
        ("IULM", None, "Master di I livello (60 CFU)"),
        ("Regione Lombardia", None, "Funding scheme"),
    ]
    bad = 0
    for inst, prog, want in EXPECT:
        hit = next((r for r in rows if inst.lower() in r["Institution"].lower()
                    and (not prog or prog.lower() in r["Programme / scheme"].lower())), None)
        if not hit:
            print(f"  --  {inst}: not found"); continue
        ok = hit["_lvl"] == want
        bad += not ok
        print(f"  {'ok ' if ok else 'CHK'} {inst:<24} -> {hit['_lvl']:<30} want {want}")
    print(f"\nmismatches: {bad} of {len(EXPECT)}")
    print(dict(Counter(r["_lvl"] for r in rows)))
