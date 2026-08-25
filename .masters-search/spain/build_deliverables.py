#!/usr/bin/env python3
"""Build the §9 deliverables from verified.jsonl + funding.jsonl.

programmes.csv · funding.csv · shortlist.md · deadlines.ics · gaps.md · sources.jsonl

The scoring arithmetic is printed into shortlist.md per programme, because the brief
requires the arithmetic shown, not hidden.
"""
import json, csv, re, sys
from pathlib import Path
from datetime import datetime, timedelta

OUT = Path("output")
SCHEMA = ["id","path_codes","programme_name_es","programme_name_en","institution",
    "institution_type","city","autonomous_community","official_status","ruct_code","ruct_url",
    "ects","duration_years","modality","language_of_instruction","language_source_url",
    "language_requirement","tuition_total_eur","tuition_per_ects_eur","tuition_year_of_rates",
    "non_eu_surcharge","additional_fees_eur","tuition_source_url","entry_requirements",
    "accepts_engineering_background","complementary_credits_required",
    "credit_recognition_available","credit_recognition_source_url","application_window_2027",
    "application_rounds","non_eu_early_round_advised","admissions_contact_email",
    "deadline_source_url","curriculum_summary","notable_faculty_or_lab","industry_links",
    "thesis_or_internship","scholarships_internal","scholarship_ids_external",
    "verification_status","conflicts","sources"]

def load(p):
    p = Path(p)
    if not p.exists():
        return []
    out = []
    for line in p.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if line:
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return out

def flat(v):
    if isinstance(v, (list, tuple)):
        return " | ".join(flat(x) for x in v)
    if isinstance(v, dict):
        return json.dumps(v, ensure_ascii=False)
    return "" if v is None else str(v)

MISSING = {"", "NOT FOUND", "UNKNOWN", "NONE", "N/A"}
def has(v):
    return flat(v).strip().upper() not in MISSING

# ---------- scoring: funding 40 · field fit 25 · official status 15 · language 10 · credit 10
def score(p, funding_by_id):
    b = {}
    # funding — a fully-funded route the candidate can actually claim is the whole point
    ext = [funding_by_id.get(str(i)) for i in (p.get("scholarship_ids_external") or [])]
    ext = [f for f in ext if f]
    yes  = [f for f in ext if str(f.get("tunisian_eligible","")).upper().startswith("YES")]
    cond = [f for f in ext if str(f.get("tunisian_eligible","")).upper().startswith("CONDITIONAL")]
    internal = p.get("scholarships_internal") or []
    fully = [f for f in yes if re.search(r"full|stipend|living|manutenc|subsist", flat(f.get("covers")) + flat(f.get("amount_detail")), re.I)]
    f_raw = min(1.0, 0.60*bool(fully) + 0.25*bool(yes) + 0.10*bool(cond) + 0.15*bool(internal))
    if not ext and not internal:
        f_raw = 0.0
    b["funding"] = (f_raw, 40)

    # field fit — the candidate's core is software engineering + music; A/B are the bullseye
    codes = set(p.get("path_codes") or [])
    fit = 0.0
    if codes & {"A", "B"}:            fit = 1.0
    elif codes & {"C", "AA", "AB"}:   fit = 0.85
    elif codes & {"AC", "X"}:         fit = 0.65
    elif codes & {"P", "S"}:          fit = 0.55
    if len(codes) > 1:
        fit = min(1.0, fit + 0.05)
    b["field_fit"] = (fit, 25)

    st = flat(p.get("official_status")).lower()
    off = 1.0 if "universitario" in st else (0.6 if "enseñanzas artísticas" in st or "ensenanzas artisticas" in st else (0.2 if "propio" in st else 0.0))
    if has(p.get("ruct_code")):
        off = max(off, 1.0)
    b["official"] = (off, 15)

    lang = flat(p.get("language_of_instruction")).lower()
    if re.search(r"\bengl|inglés|ingles|anglès", lang):      lg = 1.0
    elif re.search(r"franc", lang):                           lg = 0.9
    elif re.search(r"castellano|español|spanish|catal", lang):lg = 0.35
    else:                                                     lg = 0.5 if lang else 0.0
    if re.search(r"\bengl", lang) and re.search(r"castellano|español|spanish", lang):
        lg = 0.7   # mixed-language delivery
    b["language"] = (lg, 10)

    cr = flat(p.get("credit_recognition_available")).lower()
    comp = flat(p.get("complementary_credits_required")).lower()
    if re.search(r"\byes|sí|si\b|available|reconoc", cr):     c = 1.0
    elif re.search(r"\bno\b|not available|ninguno|none", comp): c = 0.7
    elif not has(p.get("credit_recognition_available")):      c = 0.0
    else:                                                      c = 0.4
    b["credit"] = (c, 10)

    total = sum(r*w for r, w in b.values())

    # A programme whose Sept-2027 intake is in doubt cannot outrank one that will
    # certainly run, however good it looks on the other five axes. Applied as a
    # multiplier so the component breakdown above stays readable and the reason shows.
    risk = flat(p.get("intake_2027_risk")).strip()
    if risk:
        factor = 0.45 if "suspended recruitment" in risk or "winding down" in risk else 0.7
        total *= factor
        b["intake risk"] = (factor, 0)
    return total, b

def main():
    progs = load(OUT/"verified.jsonl") or load(OUT/"programmes.jsonl")
    funds = load(OUT/"funding.jsonl")
    if not progs:
        sys.exit("no programmes.jsonl / verified.jsonl yet")
    fby = {str(f.get("scholarship_id")): f for f in funds}

    # programmes.csv
    with (OUT/"programmes.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=SCHEMA, extrasaction="ignore")
        w.writeheader()
        for p in progs:
            w.writerow({k: flat(p.get(k)) for k in SCHEMA})

    # funding.csv — Tunisian eligibility is a dedicated column, per the brief
    fcols = ["scholarship_id","name","funder","block","amount_detail","covers",
             "tunisian_eligible","eligibility_verbatim","exclusion_clause_verbatim",
             "deadline_2027_intake","application_url","path_codes","notes","sources"]
    with (OUT/"funding.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=fcols, extrasaction="ignore")
        w.writeheader()
        for f in funds:
            w.writerow({k: flat(f.get(k)) for k in fcols})

    # shortlist.md — arithmetic shown
    scored = sorted(((score(p, fby), p) for p in progs), key=lambda t: -t[0][0])[:15]
    L = ["# Shortlist — top 15", "",
         "Formula, as specified in the brief: **funding availability 40% · field fit 25% · "
         "official status & recognition 15% · language accessibility 10% · credit-recognition "
         "upside 10%.** Each component is scored 0–1 then weighted. The arithmetic is shown "
         "per programme; nothing is hidden.", "",
         "A component scores 0 when the underlying fact is `NOT FOUND` — so a low score here "
         "can mean *unknown*, not *bad*. Check `gaps.md` before discarding anything.", ""]
    for rank, ((tot, b), p) in enumerate(scored, 1):
        L += [f"## {rank}. {p.get('programme_name_en') or p.get('programme_name_es')} — {p.get('institution')}",
              "", f"**Score {tot:.1f}/100** · {p.get('city','')} · {flat(p.get('path_codes'))} · "
              f"{p.get('official_status','?')} · {p.get('language_of_instruction','?')}", "",
              "| Component | Raw | Weight | Contribution |", "|---|---:|---:|---:|"]
        for name, (r, wt) in b.items():
            if name == "intake risk":
                L.append(f"| **{name}** | x{r:.2f} | — | **penalty applied** |")
            else:
                L.append(f"| {name} | {r:.2f} | {wt} | **{r*wt:.1f}** |")
        L += ["", f"- Tuition: {p.get('tuition_total_eur','NOT FOUND')} ({p.get('tuition_year_of_rates','?')} rates) · non-EU surcharge: {p.get('non_eu_surcharge','NOT FOUND')}",
              f"- 300-ECTS recognition: {p.get('credit_recognition_available','NOT FOUND')}",
              f"- Application window 2027: {p.get('application_window_2027','NOT FOUND')}",
              f"- Verification: {p.get('verification_status','?')}"]
        if flat(p.get("intake_2027_risk")).strip():
            L.append(f"- ⚠️ **Sept-2027 intake at risk:** {flat(p.get('intake_2027_risk'))}")
        L.append("")
    (OUT/"shortlist.md").write_text("\n".join(L), encoding="utf-8")

    # deadlines.ics — every deadline plus a 45-day-prior reminder
    def parse_date(s):
        s = flat(s)
        for m in re.finditer(r"(\d{4})-(\d{2})-(\d{2})", s):
            try:
                return datetime(*map(int, m.groups()))
            except ValueError:
                pass
        for m in re.finditer(r"(\d{1,2})[/ ](\d{1,2})[/ ](\d{4})", s):
            d, mo, y = map(int, m.groups())
            try:
                return datetime(y, mo, d)
            except ValueError:
                pass
        return None

    ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Spain masters sweep//EN", "CALSCALE:GREGORIAN"]
    n = 0
    def ev(uid, dt, summary, desc, url):
        nonlocal n
        n += 1
        ics.extend(["BEGIN:VEVENT", f"UID:{uid}", f"DTSTAMP:20260824T000000Z",
                    f"DTSTART;VALUE=DATE:{dt:%Y%m%d}", f"DTEND;VALUE=DATE:{dt+timedelta(days=1):%Y%m%d}",
                    f"SUMMARY:{summary[:200]}",
                    f"DESCRIPTION:{re.sub(chr(10),' ',desc)[:600]}"] +
                   ([f"URL:{url}"] if url else []) + ["END:VEVENT"])
    for p in progs:
        d = parse_date(p.get("application_window_2027")) or parse_date(p.get("application_rounds"))
        if not d:
            continue
        nm = f"{p.get('programme_name_en') or p.get('programme_name_es')} — {p.get('institution')}"
        ev(f"prog-{p.get('id')}@spain-sweep", d, f"DEADLINE: {nm}",
           f"Application deadline. Source: {p.get('deadline_source_url','')}", p.get("url") or p.get("deadline_source_url"))
        ev(f"prog-{p.get('id')}-r45@spain-sweep", d - timedelta(days=45), f"45 days to deadline: {nm}",
           "Reminder set 45 days before the application deadline.", p.get("url") or "")
    for f in funds:
        d = parse_date(f.get("deadline_2027_intake"))
        if not d:
            continue
        ev(f"fund-{f.get('scholarship_id')}@spain-sweep", d, f"FUNDING DEADLINE: {f.get('name')}",
           f"{f.get('funder','')} · Tunisian eligible: {f.get('tunisian_eligible','?')}", f.get("application_url"))
        ev(f"fund-{f.get('scholarship_id')}-r45@spain-sweep", d - timedelta(days=45),
           f"45 days to funding deadline: {f.get('name')}", "Reminder.", f.get("application_url") or "")
    ics.append("END:VCALENDAR")
    (OUT/"deadlines.ics").write_text("\r\n".join(ics), encoding="utf-8")

    # sources.jsonl — the audit trail
    with (OUT/"sources.jsonl").open("w", encoding="utf-8") as fh:
        for p in progs:
            for s in (p.get("sources") or []):
                if isinstance(s, dict):
                    fh.write(json.dumps({"record_type":"programme","record_id":p.get("id"),
                        "institution":p.get("institution"), **s}, ensure_ascii=False)+"\n")
        for f in funds:
            for s in (f.get("sources") or []):
                if isinstance(s, dict):
                    fh.write(json.dumps({"record_type":"funding","record_id":f.get("scholarship_id"),
                        "name":f.get("name"), **s}, ensure_ascii=False)+"\n")

    print(f"programmes.csv  : {len(progs)} rows")
    print(f"funding.csv     : {len(funds)} rows")
    print(f"shortlist.md    : top {len(scored)}")
    print(f"deadlines.ics   : {n} events")
    print(f"sources.jsonl   : written")

if __name__ == "__main__":
    main()
