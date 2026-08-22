"""deadlines.ics — every actionable date, with 30-day and 7-day reminders.

The exclusion rule matters more than the inclusion rule: a comparator date from
the 2026 cycle is NOT a 2027 deadline, so it never becomes a calendar event.
A wrong date in a calendar is worse than no date, because it is trusted silently.
"""
import sys, datetime as dt
sys.path.insert(0, "build")
from pathlib import Path
from data import load, funding_rows, TODAY

CAL_OK = {"confirmed_2027", "recurring_annual"}

def esc(s):
    return (str(s or "").replace("\\", "\\\\").replace(";", "\;")
            .replace(",", "\\,").replace("\n", "\\n"))

def fold(line):
    out, b = [], line.encode("utf-8")
    while len(b) > 73:
        cut = 73
        while cut > 0 and (b[cut] & 0xC0) == 0x80: cut -= 1
        out.append(b[:cut].decode("utf-8")); b = b[cut:]
    out.append(b.decode("utf-8"))
    return "\r\n ".join(out)

events = []
def add(prefix, title, date, conf, desc, url, uid):
    flag = "" if conf == "confirmed_2027" else "  [recurring annual date — CONFIRM the 2027 date]"
    events.append(dict(
        uid=uid, date=date,
        summary=f"[{prefix}] {title}{flag}",
        desc=desc + ("\n\nDATE CONFIDENCE: confirmed 2027, read off an official page."
                     if conf == "confirmed_2027" else
                     "\n\nDATE CONFIDENCE: recurring annual deadline projected to 2027. "
                     "The institution had not published its 2027 date when this was built — confirm it."),
        url=url))

progs = load()
skipped_prog = 0
for r in progs:
    if not r["usable"]: continue
    if not r["deadline_date"]: continue
    if r["deadline_conf"] not in CAL_OK:
        skipped_prog += 1; continue
    desc = (f"{r['institution']}\n{r['city']}, {r['country']}\n"
            f"Paths: {r['path_letter']}  |  {r['language_of_instruction'][:60]}\n"
            f"Tuition (non-EU): {r['tuition_non_eu_eur_per_year'] or 'TBC'}\n"
            f"English required: {r['english_level_required'][:70] or 'TBC'}\n"
            f"Accepts a 300-ECTS engineering diploma: {r['accepts_engineering_bachelor']}\n"
            f"Verification: {r['verification_status']}\n"
            f"Source deadline text: {r['deadline_label']}")
    add("APP", r["program_name"][:70], r["deadline_date"], r["deadline_conf"],
        desc, r["program_url"], f"app-{r['id']}@masters2027")

skipped_fund = 0
for f in funding_rows():
    if not f["deadline_date"]: continue
    if f["deadline_conf"] not in CAL_OK:
        skipped_fund += 1; continue
    if (f.get("tunisia_eligible") or "").lower() == "no": continue   # closed to him
    desc = (f"{f.get('provider','')}\nRegion: {f.get('region','')}\n"
            f"Coverage: {f.get('coverage_level','')}  |  Amount: {f.get('amount_eur_per_year','TBC')}\n"
            f"Tunisian eligible: {f.get('tunisia_eligible','unclear')}\n"
            f"Applies to: {f.get('applies_to_institution','any')}\n"
            f"Requires an admission offer first: {f.get('requires_admission_first','unclear')}\n"
            f"Evidence: {(f.get('tunisia_eligible_evidence') or '')[:200]}")
    add("FUND", (f.get("scholarship_name") or "scholarship")[:70], f["deadline_date"],
        f["deadline_conf"], desc, f.get("funding_url", ""),
        f"fund-{f.get('scholarship_id','x')}@masters2027")

# Document start-by dates mirror the workbook exactly
earliest = min([r["deadline_date"] for r in progs
                if r["usable"] and r["deadline_date"] and r["deadline_conf"] in CAL_OK])
DOCS = [
 ("Degree certificate — sworn translation + apostille", 8),
 ("Official transcripts (sealed copies)", 4),
 ("IELTS Academic — book now (booking to reported score)", 9),
 ("Passport — check validity through end of studies", 8),
 ("Recommendation letters (2) — ask now", 6),
 ("CV — academic format", 2),
 ("Statement of purpose — technical fork", 4),
 ("Statement of purpose — business fork", 3),
 ("Portfolio — 3 finished pieces", 16),
 ("Business-idea video (1 minute) — Berklee", 2),
 ("Register the venture — unlocks ESMT Panzer (EUR 35,000)", 6),
 ("DUA Anexo II certification — Andalusian publics", 5),
 ("Blocked account (Sperrkonto) EUR 11,904 — if unfunded", 5),
 ("Visa appointment slot", 12),
]
for i, (name, weeks) in enumerate(DOCS):
    d = earliest - dt.timedelta(weeks=weeks)
    events.append(dict(
        uid=f"doc-{i}@masters2027", date=d,
        summary=f"[DOC] START: {name}",
        desc=(f"Lead time {weeks} weeks, worked backward from {earliest.isoformat()} — the earliest "
              f"calendar-eligible deadline in the dataset.\n\nLead times are ESTIMATES for a Tunisian "
              f"applicant, not verified figures."),
        url=""))

lines = ["BEGIN:VCALENDAR", "VERSION:2.0",
         "PRODID:-//Masters 2027 sweep//deadlines//EN", "CALSCALE:GREGORIAN",
         "METHOD:PUBLISH", "X-WR-CALNAME:Master's 2027 — deadlines",
         "X-WR-TIMEZONE:Africa/Tunis"]
stamp = "20260822T090000Z"
for e in sorted(events, key=lambda x: x["date"]):
    d = e["date"]
    lines += ["BEGIN:VEVENT",
              f"UID:{e['uid']}",
              f"DTSTAMP:{stamp}",
              f"DTSTART;VALUE=DATE:{d:%Y%m%d}",
              f"DTEND;VALUE=DATE:{d + dt.timedelta(days=1):%Y%m%d}",
              fold(f"SUMMARY:{esc(e['summary'])}"),
              fold(f"DESCRIPTION:{esc(e['desc'])}"),
              "TRANSP:TRANSPARENT"]
    if e["url"].startswith("http"):
        lines.append(fold(f"URL:{e['url']}"))
    for days, label in ((30, "30 days"), (7, "7 days")):
        lines += ["BEGIN:VALARM", "ACTION:DISPLAY",
                  fold(f"DESCRIPTION:{esc(e['summary'])} — {label} to go"),
                  f"TRIGGER:-P{days}D", "END:VALARM"]
    lines.append("END:VEVENT")
lines.append("END:VCALENDAR")

out = Path("deliverables/tools/deadlines.ics")
out.write_text("\r\n".join(lines) + "\r\n", encoding="utf-8")
print(f"{len(events)} events -> {out}")
print(f"  APP  {sum(1 for e in events if e['summary'].startswith('[APP]'))}")
print(f"  FUND {sum(1 for e in events if e['summary'].startswith('[FUND]'))}")
print(f"  DOC  {sum(1 for e in events if e['summary'].startswith('[DOC]'))}")
print(f"  excluded as 2026-cycle comparators: {skipped_prog} programmes, {skipped_fund} schemes")
