"""Portfolio_Brief.pdf — what the gated programmes actually ask for, and the
smallest body of work that satisfies the most of them."""
import sys, json, subprocess, importlib, datetime as dt
sys.path.insert(0, "build"); sys.path.insert(0, "research")
from render import document, to_pdf, esc, stamp_footers
from data import load, PATH_COLOR

subprocess.run([sys.executable, "research/rank.py"], capture_output=True)
rank = importlib.import_module("rank")

rows = [r for r in load() if r["usable"]]
def gated(r):
    v = (r["portfolio_or_audition_required"] or "").lower()
    return v.startswith(("yes", "y ")) or "portfolio" in v or "audition" in v or "work sample" in v
G = [r for r in rows if gated(r)]
OPEN = [r for r in G if not rank.viability(r)]
BLOCKED = [r for r in G if rank.viability(r)]
OPEN.sort(key=lambda r: (r["deadline_date"] or dt.date(2099,1,1)))

def chips(r):
    return "".join(f'<span class="badge" style="background:{PATH_COLOR.get(p,"#5C5C68")}">{p}</span> '
                   for p in r["paths"])

def ask_rows(lst, blocked=False):
    out = []
    for r in lst:
        dl = r["deadline_date"].isoformat() if r["deadline_date"] else (r["application_deadline"][:26] or "TBC")
        conf = "" if r["deadline_conf"] == "confirmed_2027" else ' <span class="tiny">(unconfirmed for 2027)</span>'
        why = ""
        if blocked:
            why = f'<div class="tiny" style="color:#C2451F">Closed to him: {esc("; ".join(rank.viability(r)))}</div>'
        out.append(
          f"""<tr><td>{chips(r)}</td>
              <td><b>{esc(r['program_name'][:52])}</b><div class="tiny">{esc(r['institution'][:46])} · {esc(r['city'][:20])}</div>{why}</td>
              <td>{esc(r['portfolio_or_audition_required'][:330])}</td>
              <td class="num">{esc(dl)}{conf}</td></tr>""")
    return "".join(out)

earliest = min([r["deadline_date"] for r in OPEN if r["deadline_date"]] or [dt.date(2027,1,12)])

KIT = [
 ("Three finished pieces", "≤20 min total runtime",
  "The single most repeated ask in the dataset. UdK caps a portfolio at five samples and 20 minutes; "
  "Amsterdam wants three stereo recordings; UCM wants three original compositions; Babelsberg wants "
  "three films. Three strong pieces inside 20 minutes satisfies all of them at once."),
 ("A one-page context sheet per piece", "title · genre · year · context · your exact role",
  "UdK demands an information document per sample; Berklee MPTI demands role descriptions; ESCAC wants "
  "a project list. Writing it once per piece covers every one of them, and it is the part engineers "
  "habitually skip."),
 ("A 60-second video pitch", "a business idea, self-produced",
  "Berklee GEMB's entire gate. Not an audition — a pitch. Reuse the framing for BIMM's interview."),
 ("A 3-minute project pitch video", "three thesis projects you would pursue",
  "Berklee MPTI asks for exactly this; ESCAC asks for a 3-minute videopitch; MULTICOM asks for 90 "
  "seconds on motivation. One recording, three cuts."),
 ("A two-page study plan / research proposal", "problem · method · why you",
  "Sonology requires a two-page structured study plan; TU Berlin's double degree requires a research "
  "project proposal; HKU requires a study plan. This is where your engineering wins the argument."),
 ("An artistic CV", "releases, tools built, technical credits",
  "Distinct from the academic CV. Barcelona's Art Sonor selects on it explicitly."),
]

MONTHS = [
 ("Sept 2026", "Decide the three pieces", "Pick works that show range, not volume: one composed, one "
  "sound-designed to picture, one built with a tool you wrote. That third one is your differentiator "
  "and nobody else in the pile has it."),
 ("Oct 2026", "Piece 1 finished + context sheet", "Finish one completely rather than starting three. "
  "A finished piece with a written role description is worth more than three sketches."),
 ("Nov 2026", "Piece 2 + the two-page study plan", "Draft the study plan now, while the work is fresh — "
  "it is the document that turns a portfolio into an application."),
 ("Dec 2026", "Piece 3 + both pitch videos", "Record once, cut to 60 seconds and 3 minutes. "
  "Self-produced is fine; Berklee asks for self-produced."),
 ("Early Jan 2027", "Assemble and submit", f"The binding deadline is the Netherlands Film Academy at "
  f"{earliest.isoformat()}, 12:00 CET. Everything else on this path falls later."),
]

p1 = f"""<div class="page">
 <div class="kicker">Master's 2027 · portfolio &amp; audition gates</div>
 <h1>What they actually ask for</h1><hr class="rule">
 <p class="lede">{len(G)} of the 179 usable programmes are portfolio- or audition-gated. {len(OPEN)} are
 genuinely open to you; {len(BLOCKED)} are closed for reasons that have nothing to do with your portfolio,
 and are listed second so you do not build work for a door that is already shut.</p>
 <div class="okbox" style="margin:3mm 0">
  <p style="margin:0"><b>The reassuring finding:</b> almost nothing here needs finished music of the kind
  you do not yet have. The programmes that would have demanded a mature body of work — UdK's Tonmeister,
  the conservatoire performance routes — are closed to you on <i>credential</i> grounds anyway, and
  Tonmeister additionally requires an audiogram proving hearing across 125&nbsp;Hz–8&nbsp;kHz. What the open
  programmes want is <b>three pieces, described well</b>, plus short video and a study plan.</p>
 </div>
 <h2>Open to you — build for these</h2>
 <table><thead><tr><th style="width:22mm">Paths</th><th style="width:66mm">Programme</th>
 <th>What it asks for, verbatim</th><th style="width:26mm">Deadline</th></tr></thead>
 {ask_rows(OPEN)}</table>
</div>"""

p2 = f"""<div class="page">
 <h2 style="margin-top:0">Gated, but closed to you for other reasons</h2>
 <p class="small">Do not build for these. Each is blocked on credential, closure or visa grounds that a
 portfolio cannot fix.</p>
 <table style="font-size:7.6pt"><thead><tr><th style="width:20mm">Paths</th><th style="width:62mm">Programme</th>
 <th>What it asks for</th><th style="width:24mm">Deadline</th></tr></thead>
 {ask_rows(BLOCKED, blocked=True)}</table>
</div>"""

kit_rows = "".join(f"""<tr><td><b>{esc(a)}</b><div class="tiny">{esc(b)}</div></td><td>{c}</td></tr>"""
                   for a, b, c in KIT)
tl_w = 232
tl = []
for i, (m, title, _) in enumerate(MONTHS):
    x = 6 + i * (tl_w / len(MONTHS))
    tl.append(f'<div style="position:absolute;left:{x}mm;top:0;width:{tl_w/len(MONTHS)-4}mm">'
              f'<div style="height:3mm;background:#E0603A;width:3mm;border-radius:50%"></div>'
              f'<div class="tiny" style="color:#E0603A;margin-top:1mm"><b>{esc(m)}</b></div>'
              f'<div class="small">{esc(title)}</div></div>')

p3 = f"""<div class="page">
 <h2 style="margin-top:0">The minimal portfolio that satisfies the most programmes</h2>
 <p class="small">Built from the overlap above. Six artefacts cover every open gate in the table on page 1.</p>
 <table><thead><tr><th style="width:60mm">Artefact</th><th>Which programmes it satisfies, and why</th></tr></thead>
 {kit_rows}</table>
 <h2 style="margin-top:.7em">Month by month to the binding deadline</h2>
 <div style="position:relative;height:20mm;margin-top:2mm">
   <div style="position:absolute;left:6mm;right:6mm;top:1.4mm;height:.6mm;background:#D8D4CE"></div>
   {''.join(tl)}
 </div>
 <table style="margin-top:1mm;font-size:8pt"><thead><tr><th style="width:24mm">Month</th><th style="width:52mm">Milestone</th><th>Why this order</th></tr></thead>
 {''.join(f'<tr><td><b>{esc(m)}</b></td><td>{esc(t)}</td><td>{esc(d)}</td></tr>' for m,t,d in MONTHS)}</table>
 <div class="warnbox" style="margin-top:2mm"><p style="margin:0"><b>One caution.</b> Every deadline on
 page 1 marked <i>unconfirmed for 2027</i> is last cycle's date, kept for planning. Confirm each before
 you pace the work to it — and note that the binding one, the Netherlands Film Academy at
 {earliest.isoformat()} 12:00 CET, <b>is</b> confirmed.</p></div>
</div>"""

EXTRA = "body{font-size:8.6pt;line-height:1.36}h1{font-size:21pt}h2{font-size:12.4pt}td{padding:1.2mm 2mm}.page{min-height:0}"
pdf = to_pdf(document("Portfolio Brief", p1 + p2 + p3, EXTRA), "Portfolio_Brief.pdf")
n = stamp_footers(pdf, "Portfolio Brief  ·  Master's September 2027  ·  built 2026-08-22")
print(f"Portfolio_Brief.pdf — {n} pages | gated {len(G)} (open {len(OPEN)}, blocked {len(BLOCKED)})")
