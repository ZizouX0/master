"""Rough total-cost estimator: tuition + living, minus funding.

IMPORTANT HONESTY NOTE
Tuition and stipend figures are PARSED from the verified official text in the database.
Living costs are NOT from the research — they are my own country-level estimates for a
modest student lifestyle (shared/student housing, food, transport, phone, misc).
Treat every number here as a ballpark for comparison, not a budget.
"""
import re

# Approximate FX to EUR (mid-2026, rough — volatile currencies especially).
FX = {"EUR":1.0, "USD":0.92, "GBP":1.17, "DKK":0.134, "SEK":0.088, "NOK":0.086,
      "CHF":1.05, "PLN":0.23, "HUF":0.0026, "CZK":0.040, "TL":0.026, "TRY":0.026,
      "AUD":0.60, "CAD":0.68, "RON":0.20, "BGN":0.51, "ISK":0.0067, "HRK":0.133}

# Estimated MONTHLY living cost for a student, EUR. Capital cities run higher.
LIVING = {
 "Switzerland":1800, "Norway":1400, "Iceland":1250, "Denmark":1200, "Liechtenstein":1800,
 "Ireland":1150, "Netherlands":1100, "United Kingdom":1150, "Sweden":1050, "Finland":1000,
 "Austria":1000, "Belgium":1000, "Luxembourg":1300, "France":1050, "Germany":950,
 "Italy":850, "Spain":850, "Malta":850, "Cyprus":750, "Portugal":750, "Greece":700,
 "Czech Republic":750, "Estonia":750, "Slovenia":750, "Poland":650, "Slovakia":650,
 "Hungary":650, "Croatia":650, "Lithuania":650, "Latvia":650, "Serbia":600,
 "Romania":600, "Bulgaria":550, "Turkey":600, "Albania":550, "North Macedonia":550,
 "Bosnia":550, "Montenegro":600, "Kosovo":500, "Moldova":500, "Ukraine":500,
 "USA":1600, "Canada":1300, "Australia":1400, "New Zealand":1300,
 "Singapore":1300, "Hong Kong":1300, "Japan":1200, "South Korea":1100, "China":900,
 "Taiwan":900, "UAE":1200, "Qatar":1200, "Egypt":500, "Tunisia":400, "Israel":1300,
 "Multi-country":1050, "Unknown":1000,
}
RX_HOUSING = re.compile(r"free dormitory|dormitory|accommodation|housing contribution|"
                        r"housing provided|room and board|lodging", re.I)
RENT_SHARE = 0.40      # roughly this much of student living cost is rent
SETUP_ONEOFF = 2000   # visa/residence permit, flights, deposit, insurance, initial kit

RX_FREE = re.compile(r"no tuition|tuition[- ]free|free of charge|no fee|waived for all|"
                     r"covered by (the )?(scholarship|fellowship|programme)|no tuition liability", re.I)
RX_UNKNOWN = re.compile(r"unverified|^n/?a|check|not published|calculator", re.I)
RX_AMOUNT = re.compile(r"(EUR|USD|GBP|DKK|SEK|NOK|CHF|PLN|HUF|CZK|TL|TRY|AUD|CAD|RON|BGN|ISK|€|\$|£)"
                       r"\s?([\d][\d,. ]{2,})|([\d][\d,. ]{3,})\s?(EUR|USD|GBP|DKK|SEK|NOK|CHF|PLN|HUF|CZK|€)",
                       re.I)
SYM = {"€":"EUR", "$":"USD", "£":"GBP"}

def _num(s):
    s = s.strip().replace(" ", "")
    # 17,501.40 / 11.488 / 1,400
    if re.match(r"^\d{1,3}([,.]\d{3})+([.,]\d{1,2})?$", s):
        s = s.replace(",", "X").replace(".", "Y")
        # last separator with 1-2 digits after = decimal
        if re.search(r"[XY]\d{1,2}$", s):
            s = re.sub(r"[XY](\d{1,2})$", r".\1", s)
        s = s.replace("X", "").replace("Y", "")
    else:
        s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None

def _amounts_eur(text):
    out = []
    for m in RX_AMOUNT.finditer(text or ""):
        cur = (m.group(1) or m.group(4) or "EUR").upper()
        cur = SYM.get(cur, cur)
        raw = m.group(2) or m.group(3) or ""
        v = _num(raw)
        if v and 50 <= v <= 5_000_000:
            out.append(v * FX.get(cur, 1.0))
    return out

RX_PER_SEM = re.compile(r"(EUR|USD|GBP|DKK|SEK|NOK|CHF|PLN|HUF|CZK|€|\$|£)?\s?([\d][\d,. ]{2,})\s*"
                        r"(?:/\s?semester|per semester)", re.I)
RX_PER_YR  = re.compile(r"(EUR|USD|GBP|DKK|SEK|NOK|CHF|PLN|HUF|CZK|€|\$|£)?\s?([\d][\d,. ]{2,})\s*"
                        r"(?:/\s?(?:yr|year|academic year)|per (?:year|academic year)|/a\b|annual)", re.I)
RX_TOTAL   = re.compile(r"(EUR|USD|GBP|DKK|SEK|NOK|CHF|PLN|HUF|CZK|€|\$|£)?\s?([\d][\d,. ]{3,})\s*"
                        r"(?:total|over the (?:two|2)[- ]year|for (?:the )?(?:4|four) semesters)", re.I)
RX_TOTAL2  = re.compile(r"total[^\d]{0,20}(EUR|USD|GBP|€|\$|£)?\s?([\d][\d,. ]{3,})", re.I)

def _one(m):
    if not m: return None
    cur = SYM.get((m.group(1) or "EUR").upper(), (m.group(1) or "EUR").upper())
    v = _num(m.group(2))
    return v * FX.get(cur, 1.0) if v else None

def tuition_per_year(text):
    """(eur_per_year, confidence) — confidence in {'High','Low','Unknown'}"""
    t = (text or "").strip()
    if not t or RX_UNKNOWN.match(t):
        return None, "Unknown"
    if RX_FREE.search(t):
        return 0.0, "High"
    # 1. an explicit per-semester figure is the most reliable
    v = _one(RX_PER_SEM.search(t))
    if v: return v * 2, "High"
    # 2. an explicit per-year figure
    v = _one(RX_PER_YR.search(t))
    if v: return v, "High"
    # 3. a stated programme total (assume a 2-year master)
    v = _one(RX_TOTAL.search(t)) or _one(RX_TOTAL2.search(t))
    if v: return v / 2, "High"
    # 4. fall back to the largest figure quoted (non-EU fees are the higher ones)
    amts = _amounts_eur(t)
    if not amts:
        return None, "Unknown"
    return max(amts), "Low"

def funding_per_year(stipend_text, funding_bucket):
    """Annual EUR the scholarship pays you (excludes tuition waiver). (amount, tuition_waived)"""
    t = stipend_text or ""
    waived = bool(re.search(r"tuition (fee )?waiver|no tuition|tuition (fees? )?(are )?(covered|waived)|"
                            r"participation costs? (covered|waived)|registration fees?\+?|full tuition", t, re.I)) \
             or funding_bucket == "Full"
    monthly = 0.0
    for m in re.finditer(r"(EUR|USD|GBP|DKK|SEK|NOK|CHF|PLN|HUF|CZK|TL|TRY|€|\$|£)?\s?([\d][\d,. ]{2,})\s*"
                         r"(?:/|per\s)\s?month", t, re.I):
        cur = SYM.get((m.group(1) or "EUR").upper(), (m.group(1) or "EUR").upper())
        v = _num(m.group(2))
        if v:
            monthly = max(monthly, v * FX.get(cur, 1.0))
    annual = monthly * 12
    if not annual:
        for m in re.finditer(r"(EUR|€)?\s?([\d][\d,. ]{3,})\s*(?:grant )?(?:per|/)\s?(?:academic )?(?:year|yr)", t, re.I):
            v = _num(m.group(2))
            if v and v > 1000:
                annual = max(annual, v)
    if not annual:
        m = re.search(r"(EUR|€)?\s?([\d][\d,. ]{3,})\s*(?:one-off|one-time|once)", t, re.I)
        if not m:
            m = re.search(r"(EUR|€)\s?([\d][\d,. ]{3,})[^.]{0,40}(?:one-off|one-time|first year only)", t, re.I)
        v = _num(m.group(2)) if m else None
        if v and v >= 1000:
            annual = v
    return annual, waived

def estimate(row, o):
    """Adds cost columns to a row dict. Returns dict of new fields."""
    country = row["Country"]
    live_m = LIVING.get(country, 1000)
    living = live_m * 12
    housing_covered = bool(RX_HOUSING.search(o.get("stipendCoverage") or ""))
    if housing_covered:                      # dorm/accommodation provided in kind
        living *= (1 - RENT_SHARE)
    tuition, tconf = tuition_per_year(o.get("tuitionIntl"))
    fund, waived = funding_per_year(o.get("stipendCoverage"), row["Funding"])

    tuition_eff = 0.0 if waived else (tuition if tuition is not None else None)
    if tuition_eff is None:
        gross = None
        net = None
    else:
        gross = tuition_eff + living
        net = gross - fund

    def r500(x):
        return int(round(x / 500.0) * 500)

    # verdict
    housing_note = " (accommodation provided)" if housing_covered else ""
    if net is not None and abs(net) < 1500 and row["Funding"].startswith("Full"):
        verdict = f"Roughly break-even — funding ≈ your costs{housing_note}"
    elif row["Funding"].startswith("Full") and net is not None and net <= 0:
        verdict = f"FULLY COVERED — about EUR {r500(-net):,}/yr left over{housing_note}"
    elif row["Funding"].startswith("Full") and net is not None:
        verdict = f"Mostly covered — you'd top up ~EUR {r500(net):,}/yr{housing_note}"
    elif row["Funding"].startswith("Full"):
        verdict = "Funded, but amounts unclear — verify stipend"
    elif net is not None and net <= 3000:
        verdict = f"Cheap — about EUR {r500(net):,}/yr"
    elif net is not None and net <= 12000:
        verdict = f"Moderate — about EUR {r500(net):,}/yr"
    elif net is not None:
        verdict = f"Expensive — about EUR {r500(net):,}/yr"
    else:
        verdict = "Tuition unknown — cannot estimate"

    conf = "Low" if tconf != "High" else ("High" if row["Funding"] in ("Full", "None") else "Medium")
    if tuition_eff is None:
        conf = "Unknown"

    return {
        "Est. living/yr (EUR)": r500(living),
        "Est. tuition/yr (EUR)": ("waived" if waived else (r500(tuition_eff) if tuition_eff is not None else "?")),
        "Est. YOUR cost/yr (EUR)": (max(0, r500(net)) if net is not None else "?"),
        "Est. year-1 cost incl. setup (EUR)": (max(0, r500(net)) + SETUP_ONEOFF if net is not None else "?"),
        "Cost verdict": verdict,
        "Cost confidence": conf,
    }
