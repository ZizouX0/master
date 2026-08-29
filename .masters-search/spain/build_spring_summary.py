#!/usr/bin/env python3
"""Summarise the enriched spring-intake dataset.

Classification reads `europe_recognition`, which the enrichment brief required
agents to open with their verdict, and nothing else. An earlier version pattern-
matched the prose for 'titulo propio' and filed a genuinely official master as
unrecognised, because its status field said 'OFFICIAL -- CONFIRMED, not titulo
propio' and the phrase it searched for sat inside the negation.
"""
import csv, os, re
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC  = os.path.join(ROOT, "output", "spring-intakes-enriched.csv")
OUT  = os.path.join(ROOT, "output", "spring-enriched-summary.md")


def recognised(r):
    v = (r["europe_recognition"] or "").strip().upper()
    if v.startswith("EHEA LEVEL 7"):
        return "yes"
    if v.startswith(("PENDING", "NOT YET")):
        return "pending"
    return "no"


def sector(r):
    t = (r["institution_type"] or "").lower()
    return "public" if re.search(r"\bpublic", t) and "private" not in t else "private"


def money(v):
    """A euro total, or None. Decides the number format from the LAST separator:
    '5,044.20' is English and blind European parsing turns it into 5.04."""
    if not v or "not found" in v.lower():
        return None
    m = re.search(r"(\d[\d.,]{2,})", v.replace(" ", ""))
    if not m:
        return None
    t = m.group(1).rstrip(".,")
    if "," in t and "." in t:
        t = t.replace(".", "").replace(",", ".") if t.rfind(",") > t.rfind(".") else t.replace(",", "")
    elif "," in t:
        t = t.replace(",", "") if len(t.split(",")[-1]) == 3 else t.replace(",", ".")
    elif t.count(".") == 1 and len(t.split(".")[-1]) == 3:
        t = t.replace(".", "")
    try:
        f = float(t)
    except ValueError:
        return None
    return f if 100 <= f <= 100000 else None


def place(r):
    c = re.split(r"[(;—]", r["city"] or "")[0].strip()
    return (c[:34] or "not stated")


def main():
    rows = list(csv.DictReader(open(SRC, encoding="utf-8")))
    L = []
    w = L.append
    rec = Counter(recognised(r) for r in rows)

    w("# Spain — spring-intake master's programmes, enriched\n")
    w("Every programme here has a **confirmed cohort starting January–June**. For each "
      "one the sweep now records where in Spain it is taught, which university awards "
      "it, whether that institution is public or private, what it costs a non-EU "
      "student, and whether the qualification is recognised across Europe.\n")
    w("Every figure is traceable to the institution's own page or to the RUCT / BOE "
      "register; the per-programme sources are in the CSV and the workbook.\n")

    w("## What the %d programmes actually are\n" % len(rows))
    w("| Recognition across Europe | Count | What it means |")
    w("|---|---:|---|")
    w("| **Recognised** — official `Máster Universitario`, or the one `Máster en "
      "Enseñanzas Artísticas` | %d | MECES 3 = EQF/EHEA level 7. Diploma Supplement as "
      "of right, doctoral access, treated as a second-cycle degree throughout the "
      "EHEA. |" % rec["yes"])
    w("| **Not recognised** — `título propio` / `Máster de Formación Permanente` and "
      "private-school certificates | %d | The awarding body's own certificate. Not in "
      "MECES, not in the EHEA framework, no Diploma Supplement as of right, no "
      "doctoral access. Any recognition abroad is at the receiving university's or "
      "employer's discretion. |" % rec["no"])
    w("| Not yet established | %d | See that row's `notes`. |" % rec["pending"])
    w("")
    w("**%d of %d spring intakes — more than a third — carry no automatic European "
      "recognition at all.** That is the most important line in this dataset. Many of "
      "the spring starts advertised in Spain are private certificates that will not on "
      "their own admit you to a PhD or count as a master's degree in another EU "
      "country, however the word *Máster* is used on the page.\n"
      % (rec["no"], len(rows)))

    w("## Public or private\n")
    w("| | Recognised | Not recognised |")
    w("|---|---:|---:|")
    for s in ("public", "private"):
        w("| %s | %d | %d |" % (s.capitalize(),
                                sum(1 for r in rows if sector(r) == s and recognised(r) == "yes"),
                                sum(1 for r in rows if sector(r) == s and recognised(r) == "no")))
    w("")
    pubs = {re.split(r"[(,—]", r["university_awarding"])[0].strip()
            for r in rows if sector(r) == "public"}
    w("Every public-university spring intake found anywhere in Spain is at a single "
      "institution: **%s**. No other Spanish public university runs a second cohort "
      "starting in the spring in these fields. The recognised masters at private "
      "universities are genuinely official degrees — but they are priced privately.\n"
      % ", ".join(sorted(pubs)))

    w("## What it costs a non-EU student\n")
    priced = sorted(((money(r["tuition_non_eu_eur"]), r) for r in rows), key=lambda x: (x[0] is None, x[0]))
    have = [(a, r) for a, r in priced if a]
    w("**%d of %d publish a non-EU price; %d publish none at all** — most private "
      "schools quote only on enquiry. Where nothing is published the field reads NOT "
      "FOUND. No figure in this dataset is an estimate.\n"
      % (len(have), len(rows), len(rows) - len(have)))
    w("The twenty cheapest, all currencies euro:\n")
    w("| Programme | Where | Sector | Recognised | Non-EU total |")
    w("|---|---|---|---|---:|")
    for a, r in have[:20]:
        w("| %s | %s | %s | %s | €%s |" % (
            r["programme_name"][:50].replace("|", "/"), place(r), sector(r),
            {"yes": "**yes**", "no": "no", "pending": "unclear"}[recognised(r)],
            format(int(round(a)), ",")))
    w("")
    w("The cheapest genuinely recognised route into Spain in the spring is UPC: a flat "
      "**45.00 €/credit** non-EU rate set by Catalonia's Decret 96/2026, so **€2,700 "
      "for a 60-credit master and €5,400 for a 120-credit one**. UPC's own FAQ still "
      "prints a stale 102.52 €/credit that contradicts both the tariff and every "
      "programme page; it is recorded as a conflict and used nowhere.\n")

    w("## Where in Spain\n")
    w("| Place | Programmes |")
    w("|---|---:|")
    for k, v in Counter(place(r) for r in rows).most_common(15):
        w("| %s | %d |" % (k, v))
    w("")
    online = sum(1 for r in rows if "online" in place(r).lower())
    w("**%d of %d are online**, which is largely what makes a spring start feasible: a "
      "January or February cohort leaves only weeks between an admission letter and "
      "the first class, against a Tunisian student-visa process that runs one to three "
      "months. For the on-campus options that gap, not the fee, is the real "
      "obstacle.\n" % (online, len(rows)))

    w("## Caveats that survive into the data\n")
    w("- **Academic recognition is not professional recognition.** An EHEA level-7 "
      "degree is recognised as a qualification; practising a regulated profession runs "
      "separately through Directive 2005/36/EC. UPC's *habilitant* engineering masters "
      "carry a **Spanish** professional entitlement, and that is the part that travels "
      "least well.")
    w("- **Language filters harder than cost.** Several official masters are verified "
      "Spanish-only from the ANECA memoria rather than presumed — UNIR's Ciberseguridad, "
      "Protocolo y Eventos and Composición Musical among them — and UPC's Industrial "
      "Engineering at Terrassa runs a Catalan morning group and a Spanish afternoon "
      "group with no English route at all.")
    w("- **A registry code is not a page.** Four UPC pages link an *a-extinguir* RUCT "
      "code instead of the live one, and UNIE redirects its official AI master's URL to "
      "a título propio. Live codes are recorded; superseded ones are logged beside "
      "them rather than dropped.")
    w("- **A 25-credit award is not a master's.** SAE's audio and music-production "
      "titles are 25 ECTS through UDIMA, against the 60–120 that RD 822/2021 art. 37.6 "
      "requires even of a *Máster de Formación Permanente*.\n")

    open(OUT, "w", encoding="utf-8").write("\n".join(L) + "\n")
    print("wrote %s  (%d programmes: %d recognised, %d not, %d pending)"
          % (OUT, len(rows), rec["yes"], rec["no"], rec["pending"]))


if __name__ == "__main__":
    main()
