"""Shared data layer for the tooling.

One rule drives the whole module: a date this sweep could not confirm for the
2027 cycle must never reach a calendar or a tracker looking like a fact. Most
institutions had not published 2027 dates when they were read, so what we mostly
hold are 2026-cycle comparators and recurring annual dates. Those are useful for
planning and dangerous as commitments, so every date carries a confidence and
the consumers decide what they are allowed to show.
"""
import csv, re, datetime as dt
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV  = ROOT / "deliverables" / "master_programs.csv"
TODAY = dt.date(2026, 8, 22)
TARGET_START = dt.date(2027, 9, 1)

USABLE = {"VERIFIED", "PARTIALLY_VERIFIED"}

INK, ACCENT = "#16161E", "#E0603A"
PATH_COLOR = {   # consistent across every tab, page and view
    "A":  "#E0603A", "C": "#C2451F", "N": "#B8672A",
    "H":  "#7A5EA8", "G": "#4F7CA8", "R": "#3F6B5C",
    "J":  "#8A6D3B", "L": "#6B8A3B", "AC": "#5A6270", "AD": "#7A6A5A",
}
PATH_NAME = {
    "A": "Sound & Music Computing", "C": "AI/ML for Audio & Music",
    "N": "Music-Tech Product & Innovation", "G": "Sound Design",
    "H": "Immersive / Spatial Audio", "R": "Live Sound & Event Systems",
    "J": "Music Business", "L": "Creative Entrepreneurship",
    "AC": "Marketing / Brand Management", "AD": "Media & Entertainment Mgmt",
}

MONTHS = {m.lower(): i for i, m in enumerate(
    ["January","February","March","April","May","June","July","August",
     "September","October","November","December"], 1)}
MON3 = {m[:3].lower(): i for m, i in MONTHS.items()}

def _mk(y, m, d):
    try: return dt.date(y, m, d)
    except ValueError: return None

def parse_deadline(text, cycle_note):
    """Return (date, confidence, human_label).

    confidence ∈ confirmed_2027 | recurring_annual | comparator_2026 | none
    Only the first two may reach the calendar; comparators are shown in the
    workbook with the confidence stated, and never as an .ics event.
    """
    t = (text or "").strip()
    note = (cycle_note or "").strip()
    if not t or t.upper().startswith("TBC"):
        return None, "none", (t or "TBC")

    # an explicit 2027 date is the only thing we treat as settled
    m = re.search(r"(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+2027", t)
    if m:
        mon = MONTHS.get(m.group(2).lower()) or MON3.get(m.group(2)[:3].lower())
        if mon:
            d = _mk(2027, mon, int(m.group(1)))
            if d: return d, "confirmed_2027", t[:90]
    m = re.search(r"2027-(\d{2})-(\d{2})", t)
    if m:
        d = _mk(2027, int(m.group(1)), int(m.group(2)))
        if d: return d, "confirmed_2027", t[:90]

    said_2026 = re.search(r"2026 cycle|2026/27|2026-27|for the 2026", note + " " + t, re.I)
    # a bare "15 June" with no year is a recurring annual deadline; project to 2027
    m = re.search(r"\b(\d{1,2})\s+([A-Za-z]{3,9})\b(?!\s*\d{4})", t)
    if m:
        mon = MONTHS.get(m.group(2).lower()) or MON3.get(m.group(2)[:3].lower())
        if mon:
            d = _mk(2027, mon, int(m.group(1)))
            if d:
                conf = "comparator_2026" if said_2026 else "recurring_annual"
                return d, conf, t[:90]
    m = re.search(r"\b([A-Za-z]{3,9})\s+(\d{1,2})\b(?!\s*,?\s*\d{4})", t)
    if m:
        mon = MONTHS.get(m.group(1).lower()) or MON3.get(m.group(1)[:3].lower())
        if mon:
            d = _mk(2027, mon, int(m.group(2)))
            if d:
                conf = "comparator_2026" if said_2026 else "recurring_annual"
                return d, conf, t[:90]
    return None, "none", t[:90]

def money(s):
    if not s: return None
    s = str(s).replace(",", "").replace(" ", " ")
    m = re.search(r"(\d+(?:\.\d+)?)", s)
    return float(m.group(1)) if m else None

def load():
    rows = list(csv.DictReader(open(CSV, encoding="utf-8")))
    for r in rows:
        for k in list(r):
            r[k] = (r[k] or "").strip()
        r["paths"] = [p for p in r["path_letter"].split(",") if p]
        r["fee_num"] = money(r["tuition_non_eu_eur_per_year"])
        d, c, lbl = parse_deadline(r["application_deadline"], r["deadline_source_cycle"])
        r["deadline_date"], r["deadline_conf"], r["deadline_label"] = d, c, lbl
        r["usable"] = r["verification_status"] in USABLE
    return rows

def funding_rows():
    out = []
    for p in sorted((ROOT / "research" / "wave2").glob("funding_*.csv")):
        for r in csv.DictReader(open(p, encoding="utf-8")):
            r = {k: (v or "").strip() for k, v in r.items() if k}
            r["_file"] = p.stem.replace("funding_", "")
            d, c, lbl = parse_deadline(r.get("deadline", ""), r.get("deadline_source_cycle", ""))
            r["deadline_date"], r["deadline_conf"], r["deadline_label"] = d, c, lbl
            out.append(r)
    return out
