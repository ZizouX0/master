#!/usr/bin/env python3
"""Consolidate every sweep into ONE master dataset, workbook and CSV.

Five searches ran over the course of this project, each with its own schema:

  phase1-opportunities.json   539  the original worldwide sweep (programmes AND scholarships)
  deep-europe-final.json      102  the deep-Europe follow-up (same schema)
  sounddesign-europe.json     319  the sound-design/production deep dive
  private-es-pt-nl-it.json    114  private institutions in Spain, Portugal, NL, Italy
  europe-gapfill.json          85  everything the above missed, public and private

This maps all of them onto one row shape, dedupes, and derives the four judgement
columns the candidate actually chooses on: what it costs HIM, what language he'd be
taught in, whether it is public or private, and his realistic chance of admission.
"""
import json, re, sys, glob, csv
from collections import defaultdict, Counter

OUT_XLSX = "results/MASTER-all-opportunities.xlsx"
OUT_CSV = "results/MASTER-all-opportunities.csv"
OUT_JSON = ".masters-search/results/master-all.json"

SRC = [
    (".masters-search/results/phase1-opportunities.json", "worldwide sweep"),
    (".masters-search/results/deep-europe-final.json", "deep Europe"),
    (".masters-search/results/sounddesign-europe.json", "sound design deep dive"),
    (".masters-search/results/private-es-pt-nl-it.json", "private ES/PT/NL/IT"),
    (".masters-search/results/europe-gapfill.json", "Europe gap sweep"),
]

# ---------------------------------------------------------------- normalising

COUNTRY_FIX = {"uk": "United Kingdom", "türkiye": "Turkey", "turkiye": "Turkey",
               "czechia": "Czech Republic", "united states": "USA", "us": "USA",
               "the netherlands": "Netherlands", "holland": "Netherlands"}

REGION = {
    "Western Europe": ["France", "Belgium", "Netherlands", "Luxembourg", "Ireland",
                       "United Kingdom", "Monaco"],
    "Central Europe": ["Germany", "Austria", "Switzerland", "Liechtenstein", "Poland",
                       "Czech Republic", "Slovakia", "Hungary", "Slovenia"],
    "Nordics & Baltics": ["Sweden", "Norway", "Denmark", "Finland", "Iceland",
                          "Estonia", "Latvia", "Lithuania"],
    "Southern Europe": ["Spain", "Portugal", "Italy", "Greece", "Malta", "Cyprus",
                        "Andorra", "San Marino"],
    "Balkans & Türkiye": ["Croatia", "Serbia", "Bosnia and Herzegovina", "Montenegro",
                          "North Macedonia", "Albania", "Kosovo", "Romania", "Bulgaria",
                          "Turkey", "Moldova"],
    "Eastern Europe & Caucasus": ["Ukraine", "Georgia", "Armenia", "Belarus", "Azerbaijan"],
    "North America": ["USA", "Canada"],
    "Asia-Pacific": ["Australia", "New Zealand", "Japan", "South Korea", "China", "Taiwan",
                     "Singapore", "Hong Kong", "India"],
    "Middle East & North Africa": ["UAE", "Qatar", "Israel", "Egypt", "Tunisia",
                                   "Saudi Arabia", "Morocco", "Lebanon", "Jordan"],
}
COUNTRY_REGION = {c: r for r, cs in REGION.items() for c in cs}


def txt(s, n=500):
    s = re.sub(r"\s+", " ", str(s or "")).strip()
    if not s or s.lower() in ("n/a", "na", "none", "unknown", "-", "null"):
        return ""
    return s if len(s) <= n else s[: n - 1] + "…"


def country_of(r):
    raw = (r.get("country") or "").strip()
    raw = re.sub(r"\s*\([^)]*\)", "", raw)
    raw = re.split(r"[/,;]| \+ | and | & ", raw)[0].strip(" -+")
    if not raw:
        return "Unknown"
    if len(raw) > 28:                       # a sentence, not a country
        for c in COUNTRY_REGION:
            if re.search(rf"\b{re.escape(c)}\b", raw, re.I):
                return c
        return "Multi-country"
    return COUNTRY_FIX.get(raw.lower(), raw)


def institution_of(r):
    return txt(r.get("institution") or r.get("university"), 110)


RX_NO_SCHEME = re.compile(r"^\s*(none|no scholarship|not found|n/?a|none found|unverified|check)\b", re.I)


def scheme_name(r):
    """The named funding scheme, or '' when the record says there isn't one.

    Scholarships in this dataset are always attached to a programme rather than
    standing alone, and 63 records literally say "None found" — so a non-empty
    field is not the same as a real scheme.
    """
    name = M_txt(r.get("scholarshipName"), 120)
    if not name or RX_NO_SCHEME.match(name):
        return ""
    return name


def M_txt(s, n=500):
    return txt(s, n)


# ---------------------------------------------------------------- public/private

def pubpriv(r):
    s = (r.get("publicPrivate") or "").strip()
    low = s.lower()
    if low.startswith("public") or re.match(r"^\s*(state|government|federal)", low):
        return "Public"
    if low.startswith("private"):
        return "Private"
    # the private sweep has no publicPrivate field at all — every row in it is private
    if r.get("_source") == "private ES/PT/NL/IT":
        return "Private"
    itype = ((r.get("institutionType") or "") + " " + (r.get("qualification") or "")).lower()
    if re.search(r"\bprivate\b|título propio|titulo propio|vakıf|foundation universit", itype):
        return "Private"
    if re.search(r"\bstate\b|public|statale|conservatorio statale|national (university|academy)", itype):
        return "Public"
    if "public" in low[:40]:
        return "Public"
    if "private" in low[:40]:
        return "Private"
    return "Check"


# ---------------------------------------------------------------- language

LANGS = ["English", "German", "French", "Italian", "Spanish", "Portuguese", "Dutch", "Danish",
         "Swedish", "Norwegian", "Finnish", "Polish", "Czech", "Slovak", "Hungarian", "Romanian",
         "Bulgarian", "Greek", "Turkish", "Estonian", "Latvian", "Lithuanian", "Slovenian",
         "Croatian", "Serbian", "Icelandic", "Ukrainian", "Georgian", "Catalan", "Flemish"]


def language_of(r):
    s = (r.get("language") or "").strip()
    if not s:
        return "Check"
    head = re.split(r"[.;(]", s)[0]
    hits = [L for L in LANGS if re.search(rf"\b{L}\b", head, re.I)]
    if not hits:
        hits = [L for L in LANGS if re.search(rf"\b{L}\b", s[:90], re.I)]
    if not hits:
        return "Check"
    if len(hits) == 1:
        return hits[0]
    hits.sort(key=lambda L: (L != "English", L))
    return " + ".join(hits[:2])


def language_ok(lang):
    """Languages he can already work in."""
    return lang.startswith("English") or lang.startswith("French") or "French" in lang


# ---------------------------------------------------------------- money

FX = {"EUR": 1.0, "€": 1.0, "USD": 0.92, "$": 0.92, "GBP": 1.17, "£": 1.17, "DKK": 0.134,
      "SEK": 0.088, "NOK": 0.086, "CHF": 1.05, "PLN": 0.23, "HUF": 0.0026, "CZK": 0.040,
      "RON": 0.20, "BGN": 0.51, "ISK": 0.0067, "TRY": 0.026, "TL": 0.026, "UAH": 0.022,
      "GEL": 0.34, "RSD": 0.0085, "AUD": 0.60, "CAD": 0.68}
CUR = "|".join(re.escape(k) for k in sorted(FX, key=len, reverse=True))
RX_MONEY = re.compile(rf"(?:({CUR})\s?([\d][\d ,.]*\d)|([\d][\d ,.]*\d)\s?({CUR}))", re.I)
RX_FREE = re.compile(r"\bno (?:\S+ ){0,2}tuition|tuition[- ]free|free of charge|\bzero\b|"
                     r"eur 0\b|does not (?:charge|levy)|no fees?\b|waived for all|"
                     r"covered by (?:the )?(?:scholarship|fellowship|programme)", re.I)


def _eur(raw, cur):
    n = raw.strip().replace(" ", "")
    if re.match(r"^\d{1,3}(,\d{3})+(\.\d+)?$", n):
        n = n.replace(",", "")
    elif re.match(r"^\d{1,3}(\.\d{3})+(,\d+)?$", n):
        n = n.replace(".", "").replace(",", ".")
    else:
        n = n.replace(",", ".")
    try:
        v = float(n)
    except ValueError:
        return None
    if 1990 <= v <= 2100 and v == int(v):
        return None
    return v * FX.get(cur.upper(), FX.get(cur, 1.0))


def cost_band(r):
    """What HE pays. Non-EU/international rate wherever the dataset has one."""
    for key in ("tuitionNonEU", "tuitionIntl", "tuitionTotal", "tuitionPerYear", "tuitionEU"):
        s = (r.get(key) or "").strip()
        if not s:
            continue
        if RX_FREE.search(s[:120]):
            return "Free", 0.0
        vals = []
        for m in RX_MONEY.finditer(s):
            v = _eur(m.group(2) or m.group(3), m.group(1) or m.group(4))
            if v and 20 <= v <= 500_000:
                vals.append(v)
        if vals:
            big = max(vals)
            # a stated programme total for a 2-year degree — halve it to compare per-year
            if re.search(r"\btotal\b|whole programme|two[- ]year|2[- ]year", s, re.I) and big > 8000:
                big /= 2
            if big < 1500:
                return "Under €1,500", big
            if big < 5000:
                return "€1,500–5,000", big
            if big < 15000:
                return "€5,000–15,000", big
            return "Over €15,000", big
    return "Check", None


COST_ORDER = {"Free": 0, "Under €1,500": 1, "€1,500–5,000": 2, "€5,000–15,000": 3,
              "Over €15,000": 4, "Check": 5}


def funding_of(r):
    s = (r.get("fundingLevel") or "").strip().lower()
    if s.startswith("full"):
        return "Full"
    if s.startswith("partial"):
        return "Partial"
    if s.startswith("none"):
        return "None"
    sch = (r.get("scholarships") or r.get("scholarship") or r.get("stipendCoverage") or "")
    if re.search(r"full tuition|fully funded|covers tuition|tuition waiver|monthly stipend", sch, re.I):
        return "Full"
    if re.search(r"\d{1,3}\s?%|discount|bursary|partial|reduction", sch, re.I):
        return "Partial"
    return "Check"


# ---------------------------------------------------------------- chance of admission

RX_CS = re.compile(r"comput\w+|software|informatic|engineering degree|\bIT\b|electr\w+ engineer|"
                   r"telecomunicaci|ingenier|informàtica|informatica|ingegneria|engenharia|"
                   r"technical (?:degree|background)|STEM", re.I)
RX_ANY = re.compile(r"any (?:bachelor|discipline|field|subject)|bachelor'?s? (?:degree )?in any|"
                    r"herhangi bir lisans|no (?:specific )?(?:field|subject) (?:is )?(?:required|named|specified)|"
                    r"regardless of (?:the )?(?:field|discipline)|any first[- ]cycle", re.I)
RX_OPEN = re.compile(r"related field|cognate|or equivalent|other discipline|related discipline|"
                     r"relevant field|affini|verwandt", re.I)
RX_MUSICBA = re.compile(r"bachelor of music|degree[^.]{0,18}\bin music\b|music degree|musical education|"
                        r"conservator\w+ (?:diploma|degree)|licence de musique|triennio|"
                        r"instrumental bachelor|bachelor'?s? (?:degree )?in an instrument|"
                        r"tonmeister|sound transmission|b\.?f\.?a\.? in sound", re.I)
RX_PERF = re.compile(r"live audition|on-site audition|in-person audition|perform(?:ance)? audition|"
                     r"instrumental audition|recital|targeted towards performers|"
                     r"sufficient performance|proficiency in music theory", re.I)
# "CS may qualify as comparable, confirm with the institute" is not the same as "we accept CS"
RX_HEDGE = re.compile(r"may qualify|may be considered|confirm with|at the discretion|"
                      r"case[- ]by[- ]case|subject to approval|if deemed", re.I)
RX_PROEXP = re.compile(r"professional experience (?:in|as)|years? of (?:professional )?experience|"
                       r"professional[- ]level|industry experience required|"
                       r"significant experience in audio", re.I)
RX_PORTF = re.compile(r"portfolio|work samples|arbeitsproben|portefólio|portafolio|showreel|demo reel", re.I)
LANG_HARD = ("German", "Italian", "Spanish", "Portuguese", "Dutch", "Danish", "Swedish",
             "Norwegian", "Finnish", "Polish", "Czech", "Slovak", "Hungarian", "Romanian",
             "Bulgarian", "Greek", "Turkish", "Estonian", "Latvian", "Lithuanian", "Slovenian",
             "Croatian", "Serbian", "Icelandic", "Ukrainian", "Georgian", "Catalan")


def chance(r, lang):
    """His realistic chance of being admitted. Strong / Possible / Weak + why."""
    blob = " ".join(str(r.get(k, "")) for k in
                    ("entryRequirements", "acceptsNonMusic", "portfolioSpec", "portfolioReq",
                     "auditionSpec", "program", "fitNotes", "qualification"))
    acc = (r.get("acceptsNonMusic") or "").strip().lower()

    # The hard requirement lives in entryRequirements. Judge that field on its own — a stray
    # "software" elsewhere in the record must not cancel an explicit music-degree demand.
    entry = str(r.get("entryRequirements", ""))
    explicit_yes = acc.startswith("yes") or RX_ANY.search(entry or "")

    if str(r.get("tunisianEligible", "")).strip().lower().startswith("no"):
        return "Weak", "Tunisian nationals are not eligible"
    if RX_PROEXP.search(blob):
        return "Weak", "Wants professional audio experience he does not have"
    if acc.startswith("no"):
        return "Weak", "States it does not accept a non-music background"
    if RX_MUSICBA.search(entry) and not explicit_yes:
        # a music degree named first, but comparable technical subjects also listed
        if RX_OPEN.search(entry) or RX_CS.search(entry):
            return ("Possible",
                    "Music degree is the named route, but technical subjects count as comparable — ask")
        return "Weak", "Entry requires a music/Tonmeister degree"
    if RX_PERF.search(entry) and not explicit_yes:
        return "Weak", "Assumes performance training he does not have"
    if RX_MUSICBA.search(blob) and not (RX_ANY.search(blob) or RX_CS.search(blob) or explicit_yes):
        return "Weak", "Requires a music degree"

    hard_lang = lang.split(" + ")[0] in LANG_HARD and not language_ok(lang)

    if RX_ANY.search(blob) or acc.startswith("yes"):
        base = ("Strong", "Explicitly open to a non-music/any bachelor's")
    elif RX_CS.search(blob):
        base = (("Possible", "Engineering/computing may be accepted, but the wording hedges — ask first")
                if RX_HEDGE.search(entry) else
                ("Strong", "Names engineering or computing as a welcome background"))
    elif RX_OPEN.search(blob):
        base = ("Possible", "Open to related fields — he'd argue the case")
    else:
        base = ("Possible", "No explicit statement — ask admissions")

    if hard_lang:
        return ("Possible" if base[0] == "Strong" else "Weak",
                f"{base[1]}, but taught in {lang} — language is the real gate")
    if RX_PORTF.search(blob) and base[0] == "Strong":
        return "Strong", base[1] + "; portfolio required, so build it"
    return base


CHANCE_ORDER = {"Strong": 0, "Possible": 1, "Weak": 2}


def track_of(r):
    blob = " ".join(str(r.get(k, "")) for k in ("program", "track", "focus", "whatYouStudy")).lower()
    if re.search(r"business|management|entertainment|industry|marketing|entrepreneur", blob):
        return "Music business"
    if re.search(r"acoustic|signal process|audio engineer|vibration|psychoacoust", blob):
        return "Acoustics / audio engineering"
    if re.search(r"sound design|music production|electronic music|mixing|mastering|dj|"
                 r"produzione|produção|producción|klangkunst|sound art|musica elettronica", blob):
        return "Sound design / production"
    if re.search(r"music tech|media技|media technolog|musiktechn|game audio|immersive|spatial", blob):
        return "Music & sound technology"
    if re.search(r"scholarship|grant|fellowship|bursar", blob):
        return "Funding scheme"
    return "Other / adjacent"


# ---------------------------------------------------------------- load & merge

def load():
    rows = []
    for path, label in SRC:
        try:
            data = json.load(open(path, encoding="utf-8"))
        except FileNotFoundError:
            print(f"  ! missing {path}", file=sys.stderr)
            continue
        for r in data:
            r["_source"] = label
            rows.append(r)
    return rows


def key_of(r):
    inst = re.sub(r"[^a-z0-9]", "", institution_of(r).lower())[:34]
    prog = re.sub(r"[^a-z0-9]", "", txt(r.get("program"), 200).lower())[:34]
    sch = re.sub(r"[^a-z0-9]", "", (r.get("scholarshipName") or "").lower())[:34]
    return (inst, prog or sch)


def richness(r):
    s = len(json.dumps(r, ensure_ascii=False))
    if r.get("valueVerdict"):
        s += 2_000_000
    if str(r.get("verified", "")).lower().startswith("verified"):
        s += 1_000_000
    return s


def main():
    raw = load()
    merged = {}
    for r in raw:
        k = key_of(r)
        if not k[0] and not k[1]:
            continue
        if k not in merged:
            merged[k] = r
        else:
            keep, drop = (r, merged[k]) if richness(r) > richness(merged[k]) else (merged[k], r)
            # carry over any field the winner is missing
            for f, v in drop.items():
                if f.startswith("_"):
                    continue
                if not txt(keep.get(f)) and txt(v):
                    keep[f] = v
            merged[k] = keep

    out = []
    for r in merged.values():
        c = country_of(r)
        lang = language_of(r)
        band, amount = cost_band(r)
        ch, why = chance(r, lang)
        out.append({
            "_rec": r,
            "Country": c,
            "Region": COUNTRY_REGION.get(c, "Other"),
            "City": txt(r.get("city"), 40),
            "Institution": institution_of(r),
            "Programme / scheme": txt(r.get("program") or r.get("scholarshipName"), 120),
            "Scholarship": scheme_name(r) or "—",
            "Public/Private": pubpriv(r),
            "Track": track_of(r),
            "Taught in": lang,
            "Chance for you": ch,
            "Why that chance": why,
            "Cost band (you)": band,
            "_amount": amount,
            "Funding": funding_of(r),
        })

    out.sort(key=lambda x: (CHANCE_ORDER.get(x["Chance for you"], 3),
                            COST_ORDER.get(x["Cost band (you)"], 6),
                            x["Country"], x["Institution"]))
    return out


if __name__ == "__main__":
    rows = main()
    json.dump([{k: v for k, v in r.items() if not k.startswith("_")} | {"_rec": r["_rec"]}
               for r in rows], open(OUT_JSON, "w"), indent=1, ensure_ascii=False)
    print(f"master rows: {len(rows)}")
    print("  by chance :", dict(Counter(r["Chance for you"] for r in rows)))
    print("  by type   :", dict(Counter(r["Public/Private"] for r in rows)))
    print("  by cost   :", dict(Counter(r["Cost band (you)"] for r in rows)))
    print("  by region :", dict(Counter(r["Region"] for r in rows)))
    print("  countries :", len({r["Country"] for r in rows}))
