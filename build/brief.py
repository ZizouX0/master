"""Decision_Brief.pdf — the decision layer. Short, opinionated, no raw data tables."""
import sys; sys.path.insert(0, "build")
from render import document, to_pdf, esc, page_footer
from data import load, PATH_COLOR, PATH_NAME

rows = {r["id"]: r for r in load()}

def fee(rid, fallback=""):
    r = rows.get(rid)
    if not r: return fallback
    return r["tuition_non_eu_eur_per_year"][:40] or fallback

TOP3 = [
 dict(rank="01", name="Audiokommunikation und -technologie, M.Sc.",
      inst="TU Berlin — Fachgebiet Audiokommunikation", city="Berlin", paths="A C G H R",
      cost="€0 tuition · ~€750/yr semester fee, transport ticket included",
      odds="No programme scholarship. It does not need one — this is the cheapest real degree in the sweep.",
      deadline="15 June (window 1 Apr–15 Jun) · 2026 cycle, 2027 TBC",
      why=["The best credential fit found anywhere: the admission text names engineering degrees "
           "first and asks for exactly the maths and programming you already hold.",
           "The only <b>yes_explicit</b> on its path, from a group that leads Europe on spatial audio. "
           "Its deadline is late enough to sit outside the December scramble."],
      risk="German C1. That is 12–18 months from a standing start, and it is the entire decision — "
           "nothing else about this programme blocks you."),
 dict(rank="02", name="Máster Universitario en Ingeniería Acústica",
      inst="Universidad de Málaga — E.T.S. Ingeniería de Telecomunicación", city="Málaga", paths="A H R",
      cost="€820.80 total · 60 ECTS · 12 months",
      odds="Needs no scholarship to be affordable. Andalusia levies no nationality surcharge — "
           "confirmed against Decreto 98/2023.",
      deadline="29 January · DUA Fase 1, reserved for foreign-qualification applicants",
      why=["A real <i>título oficial</i> in acoustics for the price of a phone, inside the "
           "telecommunications school with an anechoic Audio &amp; Electroacoustics Lab.",
           "Its access list names <i>Ingeniería Informática</i> explicitly, and a student-stay authorisation "
           "counts as residence — the opposite of Madrid, where the same paperwork multiplies the fee sixfold."],
      risk="Spanish B2, and acoustics is engineering rather than music-making. Andalusia has no "
           "music provision at all — <i>SONIDO</i> returns zero results region-wide."),
 dict(rank="03", name="Human-Computer Interaction &amp; Design with Extended Reality",
      inst="EIT Digital Master School — Twente and Madrid entry points", city="rotating", paths="N",
      cost="€18,000/yr list price — but the full tuition waiver is open to all nationalities",
      odds="Strongest verified funding odds in English. Waivers state “Available to: All students”; "
           "a BME waiver stacks; an EIF plan defers all fees to six months after graduation.",
      deadline="2027 dates unpublished · the 2026 equivalent closed in early January",
      why=["Wave 1 recorded EIT funding as closed to non-EU applicants. That was half wrong and the "
           "error would have discarded a fully funded route.",
           "Only the Scholarship of Excellence — the one adding a living allowance — is EU-only, and the "
           "admission text handles longer technical degrees case-by-case."],
      risk="You must apply in <b>Period 1</b>. In Period 2, Twente and UNITN admit non-EU entrants "
           "only if they already hold a Dutch permit — applying from Tunisia then is an auto-reject."),
]

PERPATH = [
 ("A","TU Berlin — Audiokommunikation","€0","See 01. German C1 is the only gate."),
 ("C","UGR — Ciencia de Datos, Granada","€820.80",
      "Path-C gate genuinely passed: UGR's <b>SigMAT</b> group works on speech recognition and voice synthesis. Spanish B2."),
 ("N","TU Berlin — IMES, M.Sc.","€0",
      "<b>English-taught</b>, free, <b>yes_explicit</b> — the only Berlin row that is all three. 15 May."),
 ("H","TU Berlin + Sonology double degree","€0 → €11,488",
      "Berlin then The Hague. <b>15 Feb.</b> Both languages bind: IELTS 6.0 <i>and</i> TestDaF TDN 4."),
 ("G","Netherlands Film Academy","€8,250/yr",
      "Cheapest non-EU Dutch master, and the only hard timed 2027 date: <b>12 Jan 2027, 12:00 CET</b>."),
 ("R","— none exists —","—",
      "NL and Spain have none. BHT Berlin's is real but <b>summer-intake only</b>. Treat R as a post-master's add-on."),
 ("J","Macromedia Berlin — Music Management","€13,680",
      "English, state-recognised, no subject bar. 300 ECTS unlocks the 3-semester route: −6 months, −€6,840."),
 ("L","ESMT Berlin","€36,000 → ~€1,000 net","See the panel opposite."),
 ("AC","UMA — Dirección y Gestión de Marketing","€820.80",
      "<b>yes_explicit</b> at Andalusian prices; most Dutch and Berlin marketing masters reject engineers."),
 ("AD","UGR — Nuevos Medios Interactivos","€820.80",
      "The only cheap AD row not demanding 30 ECTS of prior media studies."),
]

FILE7 = [
 ("1","TU Berlin — IMES","Free, English, <b>yes_explicit</b>. The no-regret anchor."),
 ("2","TU Berlin — Audiokommunikation","The subject prize. Only if German C1 is underway by spring 2027."),
 ("3","UMA — Ingeniería Acústica","€821 for a real acoustics degree. Your cheapest outcome."),
 ("4","UGR — Ciencia de Datos (SigMAT)","Same price, real audio research group."),
 ("5","UJA Linares — Telecom Engineering","€757, <b>English-taught, B1 only</b>. Removes both language barriers."),
 ("6","EIT Digital HCID/XR — Period 1","Best odds of a full tuition waiver in English."),
 ("7","ESMT Berlin <span class='chip'>self-funded</span>","Only if the venture exists by then."),
]

def top_card(t):
    lis = "".join(f"<li>{w}</li>" for w in t["why"])
    chips = "".join(f'<span class="badge" style="background:{PATH_COLOR.get(p,"#5C5C68")}">{p}</span> '
                    for p in t["paths"].split())
    return f"""<div class="card nobreak" style="margin-bottom:4mm">
      <div class="kicker">{t['rank']} · {esc(t['city'])} &nbsp; {chips}</div>
      <h3 style="font-size:13pt;margin-bottom:.15em">{t['name']}</h3>
      <div class="small" style="margin-bottom:1.6mm">{esc(t['inst'])}</div>
      <ul style="margin-top:.3em">{lis}</ul>
      <table style="font-size:8.4pt;margin-top:1.5mm">
        <tr><td style="width:22mm;color:#5C5C68;border:0;padding-left:0">Cost</td><td style="border:0">{t['cost']}</td></tr>
        <tr><td style="color:#5C5C68;border:0;padding-left:0">Funding</td><td style="border:0">{t['odds']}</td></tr>
        <tr><td style="color:#5C5C68;border:0;padding-left:0">Deadline</td><td style="border:0"><b>{esc(t['deadline'])}</b></td></tr>
        <tr><td style="color:#C2451F;border:0;padding-left:0">Biggest risk</td><td style="border:0">{t['risk']}</td></tr>
      </table></div>"""

unverified = [r for r in load() if r["verification_status"] in ("UNVERIFIED","CONFLICT","DEAD_LINK")]

p1 = f"""<div class="page">
 <div class="kicker">Master's 2027 · Decision Brief · built 22 August 2026</div>
 <h1>Seven applications, four strategies,<br>one thing to do this month.</h1>
 <hr class="rule">
 <p class="lede">From 197 verified programmes and 139 funding schemes across Spain, the Netherlands and
 Berlin. Ranked on funding odds (40%), admission fit for your 300-ECTS engineering diploma (25%),
 path priority (15%), city (10%) and cost (10%), with a 15% penalty on German-taught programmes.</p>
 <div class="grid2" style="margin-top:5mm">
  <div>
   <h2>The data is four strategies, not 197 options</h2>
   <table>
    <thead><tr><th style="width:34mm">Strategy</th><th>What you get</th><th>What it costs you</th></tr></thead>
    <tr><td><b>Berlin technical</b></td><td>Best subject fit in Europe, tuition-free</td>
        <td>German C1 — 12–18 months you have not started</td></tr>
    <tr><td><b>Andalusia cheap</b></td><td>A real master's for ~€821 total, engineering-friendly admission</td>
        <td>Zero music content region-wide, and Spanish B2</td></tr>
    <tr><td><b>Funded mobility</b></td><td>Money, English, prestige</td>
        <td>Deadlines in Dec–Jan, subject fit that wanders</td></tr>
    <tr><td><b>Barcelona</b></td><td>Exactly the degree you want</td>
        <td><b>Unverified</b> — its own site blocked every attempt, twice</td></tr>
   </table>
   <div class="warnbox" style="margin-top:4mm">
    <h3 style="margin-top:0">The uncomfortable finding</h3>
    <p style="margin:0">The single best subject match in this sweep — <b>UPF Barcelona's Sound and Music
    Computing</b>, home of the Music Technology Group — could not be verified. Its tuition, its 2027
    deadline and its access list are all unread: <span class="mono">upf.edu</span> returned 403 to every
    method across two verification waves, five hosts, and a direct attempt, down to
    <span class="mono">robots.txt</span>. Twenty minutes in a normal browser settles it, and it could
    displace entry 02 below.</p>
   </div>
  </div>
  <div>{top_card(TOP3[0])}</div>
 </div>
 {page_footer("Decision Brief · Master's September 2027", 1, 3)}
</div>"""

p2 = f"""<div class="page">
 <div class="grid2">
   <div>{top_card(TOP3[1])}{top_card(TOP3[2])}</div>
   <div>
     <h2 style="margin-top:0">Act on this before any application</h2>
     <div class="okbox">
       <h3 style="margin-top:0">ESMT Berlin — Panzer Scholarship: €35,000 against €36,000 of tuition</h3>
       <p>Plus ten months of Berlin housing. Three conditions: <b>under 30</b>, <b>citizen and resident
       of an African country</b>, <b>has founded a business or social enterprise</b>.</p>
       <p style="margin-bottom:0">You satisfy two today. The third is the only eligibility requirement
       in all 197 rows you can <i>manufacture</i> — register a small venture around your production work
       now, so it is met by the 2027 application. Nothing else here turns a weekend into €35,000.</p>
     </div>
     <h2>Best per path</h2>
     <table class="perpath">
      <thead><tr><th style="width:8mm">Path</th><th style="width:46mm">Programme</th><th>Verdict</th></tr></thead>
      {''.join(f'''<tr><td><span class="badge" style="background:{PATH_COLOR.get(p,'#5C5C68')}">{p}</span></td>
        <td>{n}<br><span class="tiny num">{c}</span></td><td>{v}</td></tr>''' for p,n,c,v in PERPATH)}
     </table>
   </div>
 </div>
 {page_footer("Decision Brief · Master's September 2027", 2, 3)}
</div>"""

risk_rows = "".join(
  f"""<tr><td class="mono">{esc(r['id'])}</td><td>{esc(r['institution'][:44])}</td>
      <td><span class="badge v-{r['verification_status']}">{r['verification_status'].replace('_',' ')[:9]}</span></td>
      <td>{esc((r['red_flags'] or 'no reason recorded')[:78])}</td></tr>"""
  for r in sorted(unverified, key=lambda x: x["id"])[:9])

p3 = f"""<div class="page">
 <h2 style="margin-top:0">File these seven</h2>
 <p class="small">Funding-first, A/C/N anchored, capped at two self-funded business options.
 <b>Applications 3, 4 and 5 are Andalusian publics and share one DUA form with six ranked choices</b> —
 three of the seven cost you a single submission.</p>
 <div class="grid2">
  <div><table>
   <thead><tr><th style="width:6mm">#</th><th style="width:56mm">Programme</th><th>Why it is on the list</th></tr></thead>
   {''.join(f'<tr><td class="num"><b>{n}</b></td><td><b>{p}</b></td><td>{w}</td></tr>' for n,p,w in FILE7)}
  </table>
  <h3>Held in reserve, not filed blind</h3>
  <p class="small"><b>UPF Barcelona</b> — verify first; it may displace entry 02.
  <b>Berklee Valencia</b> (self-funded slot 2) — a real Spanish <i>título oficial</i> plus US
  accreditation, portfolio gate is a one-minute business-idea video rather than an audition, but
  ~USD 50,430 with scholarships capped at 90%.
  <b>Erasmus Mundus</b> — an unconfirmed report says 37 new projects were selected in July 2026 for
  September 2027 starts; re-sweep the EACEA catalogue in October.</p>
  </div>
  <div>
   <h2 style="margin-top:0">Risk — everything unverified that could change this picture</h2>
   <p class="small">These rows appear here and <b>nowhere else</b>. None is in the tracker, the
   calendar or the dossiers: a date that might be wrong is worse than a blank one. Of 197 programmes,
   105 are VERIFIED and 74 partially; the {len(unverified)} below are not.</p>
   <table style="font-size:7.8pt">
    <thead><tr><th>id</th><th>Institution</th><th>Status</th><th>Why it is unresolved</th></tr></thead>
    {risk_rows}
   </table>
   <p class="tiny" style="margin-top:1.5mm">Also material: <b>RSM Rotterdam</b> states both €25,800 and
   “approximately €15,200 for non-EEA students” for 2027-28 <i>on the same page</i>. <b>Spain</b> is the
   least resolved region — of 46 schemes only MAEC-AECID is confirmed open at full+stipend, 20 unclear.
   And <b>accepts_engineering_bachelor changed on ~40% of rows in verification</b>: distrust any
   eligibility claim not carried through Wave 3. Full list: <span class="mono">GAPS.md</span>.</p>
  </div>
 </div>
 {page_footer("Decision Brief · Master's September 2027", 3, 3)}
</div>"""

COMPACT = """
body{font-size:9.1pt;line-height:1.4}
h1{font-size:22pt}h2{font-size:12.4pt;margin-top:.7em}h3{font-size:10.6pt;margin-top:.5em}
.lede{font-size:10pt;line-height:1.45}
.page{min-height:0}
.perpath{font-size:7.5pt}.perpath td{padding:1.1mm 2mm}.perpath{margin-bottom:9mm}
table{font-size:8pt}td{padding:1.35mm 2mm}th{padding:1.4mm 2mm;font-size:7pt}
.card{padding:2.8mm 3.2mm}
ul{margin:.15em 0 .4em}li{margin-bottom:.14em}
p{margin:0 0 .4em}
.small{font-size:8pt;line-height:1.35}
.warnbox,.okbox{padding:2.4mm 3.2mm}
"""
to_pdf(document("Decision Brief — Master's September 2027", p1 + p2 + p3, COMPACT), "Decision_Brief.pdf")
print("Decision_Brief.pdf written")
