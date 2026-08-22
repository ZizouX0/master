"""Program_Dossiers.pdf — the full-detail layer.

One page per shortlisted programme on a fixed template, so the eye learns where
things live. The completeness contract: every non-empty field in the CSV row
appears on that programme's page. Named blocks cover the fields that deserve
prominence; a catch-all block at the foot renders whatever is left, so a schema
change can never silently drop data.
"""
import sys, json, subprocess, importlib, re
sys.path.insert(0, "build"); sys.path.insert(0, "research")
from render import document, to_pdf, esc, page_footer
from data import load, PATH_COLOR, PATH_NAME

subprocess.run([sys.executable, "research/rank.py"], capture_output=True)
rank = importlib.import_module("rank")
scores = {r["id"]: r.get("score", 0) for r in json.load(open("research/ranked.json"))}

rows = [r for r in load() if r["usable"] and not rank.viability(r)]
for r in rows: r["_score"] = scores.get(r["id"], 0)
rows.sort(key=lambda r: -r["_score"])

# The shortlist drives this, not the raw score. The score alone spent four pages
# on near-identical Granada computer-science masters and dropped UJA Linares,
# which is application #5 in SHORTLIST.md. So the strategic picks are named and
# claim their page first; the ranking then fills the remainder, capped at two
# programmes per institution so the book covers options rather than repeating one.
NAMED = [
    ("Audiokommunikation", None), ("Ingenieria Acustica", "Malaga"),
    ("Innovation Management, Entrepreneurship", "Berlin"),
    ("Ciencia de Datos", "Granada"), ("Telecommunication Eng", "Jaen"),
    ("Human-Computer Interaction and Design", None), ("ESMT", None),
    ("Audio Communication and Sonology", None), ("Netherlands Film Academy", None),
    ("Music Management", "Macromedia"), ("Global Entertainment", None),
    ("Nuevos Medios", None), ("Direccion y Gestion", "Malaga"), ("Art Sonor", None),
]
picked, seen, per_inst = [], set(), {}
def take(r):
    picked.append(r); seen.add(r["id"])
    per_inst[r["institution"][:22]] = per_inst.get(r["institution"][:22], 0) + 1

for key, city in NAMED:
    for r in rows:
        if r["id"] in seen: continue
        hay = (r["institution"] + " " + r["program_name"]).lower()
        if key.lower() in hay and (city is None or city.lower() in hay):
            take(r); break
for r in rows:
    if len(picked) >= 15: break
    if r["id"] in seen: continue
    if per_inst.get(r["institution"][:22], 0) >= 2: continue
    take(r)
picked = picked[:15]

SHOWN = set()
def field(r, col):
    SHOWN.add((r["id"], col))
    return r[col]

def q(r, col, fallback="not published"):
    v = r[col]
    if v and not v.upper().startswith("TBC"):
        SHOWN.add((r["id"], col))          # only claim it is shown once it is actually printed
        return esc(v)
    return f'<span class="small">{esc(v) if v else fallback}</span>' if v else f'<span class="small">{fallback}</span>'

PROFILE = ("5-year software-engineering diploma · 300 ECTS · Tunisian national (non-EU) · "
           "Arabic, French, English · no English test sat yet · music portfolio in progress")

def qualify_block(r):
    """Check each entry requirement explicitly against the client's actual credential."""
    acc = field(r, "accepts_engineering_bachelor")
    verdict = {"yes_explicit": ("YES — named explicitly", "#3F6B5C"),
               "likely":       ("LIKELY — not named, not excluded", "#B8672A"),
               "unclear":      ("UNCLEAR — ask admissions", "#B8672A"),
               "no":           ("NO — blocked", "#C2451F")}.get(acc, ("UNCLEAR", "#B8672A"))
    reqs = r["entry_requirements_summary"]
    checks = [
        ("Degree level", "300 ECTS, 5-year engineering diploma",
         "Clears every 180 / 210 / 240-ECTS bar in this dataset. A 210-ECTS threshold can also shorten "
         "the degree — see the notes below."),
        ("Subject match", "engineering / computing",
         "Credit volume is never the obstacle; a demand for credits in a NAMED subject is. "
         "Full admission text below."),
        ("Language", esc(r["language_of_instruction"][:60] or "not published"),
         "He accepts any language of instruction. German is disprefered, not excluded."),
        ("English evidence", esc(r["english_level_required"][:60] or "not published"),
         "No test sat yet — ~9 weeks from booking to a reported score."),
        ("Portfolio / audition", esc(r["portfolio_or_audition_required"][:60] or "not stated"),
         "Portfolio is in progress; a portfolio gate is a scheduling problem, not a disqualification."),
    ]
    trs = "".join(f"<tr><td style='width:24mm'>{a}</td><td style='width:52mm'>{b}</td>"
                  f"<td class='small'>{c}</td></tr>" for a, b, c in checks)
    if reqs: SHOWN.add((r["id"], "entry_requirements_summary"))
    verbatim = (f'<div class="tiny" style="margin-top:1.5mm;font-size:6.9pt">'
                f'<b>Admission text as published:</b> {esc(reqs)}</div>') if reqs else ""
    return f"""<div class="card" style="border-left-color:{verdict[1]}">
      <h3 style="margin-top:0">Do I qualify? &nbsp;
        <span class="badge" style="background:{verdict[1]}">{verdict[0]}</span></h3>
      <div class="tiny" style="margin-bottom:1.5mm">Checked against: {PROFILE}</div>
      <table style="font-size:7.6pt">{trs}</table>{verbatim}</div>"""


def kv2(pairs, fs="7.2pt"):
    """Key/value rows two-up.

    A full-width row spent 267mm displaying "Berlin" or "120". Pairing them
    halves the vertical space with no fragmentation risk, because a table still
    paginates by rows. Long values get a row to themselves so they stay readable.
    """
    LONG = 90
    out, buf = [], []
    def flush():
        if not buf: return
        if len(buf) == 1:
            k, v = buf[0]
            out.append(f"<tr><td>{k}</td><td colspan='3'>{v}</td></tr>")
        else:
            (k1, v1), (k2, v2) = buf
            out.append(f"<tr><td>{k1}</td><td style='width:26%'>{v1}</td>"
                       f"<td style='width:17%'>{k2}</td><td>{v2}</td></tr>")
        buf.clear()
    for k, v in pairs:
        plain = re.sub(r"<[^>]+>", "", str(v))
        if len(plain) > LONG:
            flush()
            out.append(f"<tr><td>{k}</td><td colspan='3'>{v}</td></tr>")
        else:
            buf.append((k, v))
            if len(buf) == 2: flush()
    flush()
    return f'<table class="kv" style="font-size:{fs}">' + "".join(out) + "</table>"

def facts_block(r):
    F = [("Degree awarded", q(r, "degree_awarded")), ("Institution type", q(r, "institution_type")),
         ("City", q(r, "city")), ("Country", q(r, "country")), ("Mobility", q(r, "mobility")),
         ("Language", q(r, "language_of_instruction")), ("Duration (months)", q(r, "duration_months")),
         ("ECTS", q(r, "ects")), ("Tuition, non-EU / yr", f'<b>{q(r, "tuition_non_eu_eur_per_year")}</b>'),
         ("Tuition notes", q(r, "tuition_notes")), ("2027 intake confirmed", q(r, "intake_2027_confirmed")),
         ("Applications open", q(r, "application_opens")), ("Deadline", f'<b>{q(r, "application_deadline")}</b>'),
         ("Which cycle", q(r, "deadline_source_cycle")),
         ("English required", q(r, "english_level_required")),
         ("Paths served", q(r, "path_letter"))]
    return "<h3>Facts</h3>" + kv2(F, "7.2pt")

def funding_block(r):
    names = r["scholarship_names"]
    if names and not names.upper().startswith("TBC"): SHOWN.add((r["id"], "scholarship_names"))
    items = [n.strip() for n in names.split("|") if n.strip()] if names else []
    lis = "".join(f"<li>{esc(n)}</li>" for n in items) or "<li class='small'>None recorded for this programme. Regional schemes may still apply — see the Funding Matrix tab.</li>"
    return f"""<h3>Funding</h3>
      {kv2([("Coverage level", f"<b>{q(r,'scholarship_coverage_level')}</b>"),
            ("Scholarship available", q(r,'scholarship_available')),
            ("Tunisian eligible", q(r,'tunisia_eligible','not established'))], "7.2pt")}<ul style="font-size:7pt">{lis}</ul>"""

def standout_block(r):
    paths = set(field(r, "path_letter").split(","))
    if paths & {"A", "C", "H"}:
        tip = ("Lead with the engineering, not the enthusiasm. A committee here sees musicians who cannot "
               "code far more often than the reverse — a working DSP or MIR project, with the code readable, "
               "is worth more than a finished track. Name the group or lab you want to work with in the "
               "motivation letter; on this path that single sentence separates real applicants from browsers.")
    elif paths & {"G", "H"}:
        tip = ("Show sound decisions, not sound design. Three short pieces where you can explain WHY each "
               "choice was made beat a long reel. Your engineering background is the differentiator: say "
               "plainly that you can build the tool as well as use it.")
    elif paths & {"J", "L", "AC", "AD"}:
        tip = ("These rooms are full of business graduates and short of people who can ship software. "
               "Frame the producer half as market knowledge and the engineer half as execution capability, "
               "then point at one concrete artefact — a released track, a tool, a registered venture.")
    else:
        tip = ("Make the dual profile a thesis proposal rather than a biography: one sentence on the "
               "problem, one on why your engineering makes you the person to solve it.")
    return f'<div class="okbox" style="margin-top:2mm"><h3 style="margin-top:0">How to stand out here</h3><p class="small" style="margin:0">{tip}</p></div>'

def rest_block(r):
    """Whatever the named blocks did not render. Guarantees no field is dropped."""
    skip = {"id", "path_letter", "program_name", "institution", "verification_status",
            "verifier_agent", "verified_date", "program_url", "admissions_url", "funding_url",
            "source_urls", "paths", "fee_num", "deadline_date", "deadline_conf",
            "deadline_label", "usable", "_score"}
    pairs = []
    for k, v in r.items():
        if k in skip or k.startswith("_"): continue
        if (r["id"], k) in SHOWN: continue
        if not v: continue
        pairs.append((esc(k.replace("_", " ")), esc(v)))
    if not pairs: return ""
    return "<h3>Also recorded</h3>" + kv2(pairs, "6.9pt")

def sources_block(r):
    urls = [u for u in field(r, "source_urls").split("|") if u.strip()]
    extra = [("Programme", field(r, "program_url")), ("Admissions", field(r, "admissions_url")),
             ("Funding", field(r, "funding_url"))]
    lis = "".join(f'<li><b>{k}</b> <span class="mono brk">{esc(v)}</span></li>'
                  for k, v in extra if v and not v.upper().startswith("TBC"))
    lis += "".join(f'<li><span class="mono brk">{esc(u)}</span></li>' for u in urls)
    return (f'<h3>Sources &amp; verification</h3><p class="tiny" style="margin-bottom:1mm">'
            f'Verified by <b>{esc(field(r,"verifier_agent"))}</b> on <b>{esc(field(r,"verified_date"))}</b> · '
            f'status <b>{esc(field(r,"verification_status"))}</b></p>'
            f'<ul class="tiny">{lis}</ul>')

def contact_block(r):
    adm = field(r, "admissions_url")
    if adm and not adm.upper().startswith("TBC"):
        return f'<p class="tiny"><b>Admissions:</b> <span class="mono brk">{esc(adm)}</span></p>'
    return '<p class="tiny"><b>Admissions contact:</b> none published on the pages read.</p>'

pages, index = [], []
for n, r in enumerate(picked, start=2):     # page 1 is the index
    index.append((n, r))
    chips = "".join(f'<span class="badge" style="background:{PATH_COLOR.get(p,"#5C5C68")}">{p}</span> '
                    for p in field(r, "path_letter").split(",") if p)
    vs = field(r, "verification_status")
    flags = field(r, "red_flags")
    warn = (f'<div class="warnbox" style="margin-top:2mm"><h3 style="margin-top:0">Flags</h3>'
            f'<p class="tiny" style="margin:0">{esc(flags)}</p></div>') if flags else ""
    pages.append(f"""<div class="page">
      <div class="kicker">{esc(field(r,'id'))} &nbsp;·&nbsp; {esc(field(r,'city'))}, {esc(field(r,'country'))} &nbsp;&nbsp; {chips}
         <span class="badge v-{vs}">{vs.replace('_',' ')}</span></div>
      <h1 style="font-size:16pt;margin-bottom:.1em">{esc(field(r,'program_name')[:120])}</h1>
      <div class="small" style="margin-bottom:2.5mm">{esc(field(r,'institution')[:110])}</div>
      {qualify_block(r)}
      {facts_block(r)}
      {contact_block(r)}
      {funding_block(r)}
      {standout_block(r)}
      {rest_block(r)}
      {warn}
      {sources_block(r)}
    </div>""")

idx_rows = "".join(
  f"""<tr><td class="num">{n}</td><td class="mono">{esc(r['id'])}</td>
      <td>{esc(r['program_name'][:60])}</td><td>{esc(r['institution'][:42])}</td>
      <td>{esc(r['city'][:18])}</td>
      <td>{''.join(f'<span class="badge" style="background:{PATH_COLOR.get(p,"#5C5C68")}">{p}</span> ' for p in r['path_letter'].split(',') if p)}</td>
      <td class="num">{esc(r['tuition_non_eu_eur_per_year'][:16] or 'TBC')}</td>
      <td><span class="badge v-{r['verification_status']}">{r['verification_status'].replace('_',' ')[:9]}</span></td></tr>"""
  for n, r in index)

idx = f"""<div class="page">
 <div class="kicker">Master's 2027 · full-detail layer</div>
 <h1>Program Dossiers</h1><hr class="rule">
 <p class="lede">One page per shortlisted programme, on a fixed template so the eye learns where things
 live: does he qualify → facts → funding → what else was recorded → flags → sources. Every field held in
 <span class="mono">master_programs.csv</span> for that programme appears on its page.</p>
 <table style="margin-top:4mm">
  <thead><tr><th style="width:10mm">Page</th><th style="width:16mm">id</th><th>Programme</th>
  <th>Institution</th><th>City</th><th style="width:26mm">Paths</th><th style="width:22mm">Tuition/yr</th>
  <th style="width:20mm">Status</th></tr></thead>{idx_rows}
 </table>
 <p class="small" style="margin-top:4mm">Selected from the 106 programmes that pass the viability gate —
 a real master's degree, admitting for September 2027, able to support a Tunisian student visa, and not
 closed to him on entry requirements. Ordered by the weighted score; the named strategic picks are
 guaranteed a page regardless of rank.</p>\n <p class="small"><b>On length:</b> the template is one page, but completeness outranks it — every field recorded for a programme is printed, and the densest rows (ESMT carries 11,000 characters of verified notes) run onto a second page rather than being truncated. Page numbers are stamped on every page.</p>
</div>"""

EXTRA = """
.page{min-height:0}
body{font-size:9pt;line-height:1.36}
h1{font-size:17pt}h3{font-size:9.6pt;margin-top:.55em}
td{padding:1.05mm 1.8mm}th{padding:1.3mm 1.8mm}
.card{padding:2.4mm 3mm}.okbox,.warnbox{padding:2.2mm 3mm}
h3{break-after:avoid}
table{width:100%}
td:first-child{width:34mm;color:#5C5C68}
.kv td{padding:.85mm 2mm;vertical-align:top}
.warnbox,.okbox,.card{break-inside:avoid}
.brk{word-break:break-all;overflow-wrap:anywhere}
ul{margin:.15em 0 .3em}li{margin-bottom:.12em}
"""
from render import stamp_footers
_p = to_pdf(document("Program Dossiers", idx + "".join(pages), EXTRA), "Program_Dossiers.pdf")
_n = stamp_footers(_p, "Program Dossiers  ·  Master's September 2027  ·  built 2026-08-22")
print("stamped footers on", _n, "pages")
import json as _json; _json.dump([r["id"] for r in picked], open("build/dossier_ids.json","w"))
print("dossiers:", len(picked), "programmes")
for n, r in index: print(f"  p{n:<3}{r['id']:<8}{r['institution'][:34]:<36}{r['program_name'][:40]}")
