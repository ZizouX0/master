"""Career_Paths.pdf — what you learn on each path, what job it leads to, what it pays.

Salary figures are ONLY those retrieved from a named source this session. Where
sources disagree the spread is printed rather than averaged, because averaging
two numbers that differ by 2x manufactures a precision neither has.
"""
import sys
sys.path.insert(0, "build")
from render import document, to_pdf, esc, stamp_footers
from data import PATH_COLOR
from subjects import PATH_FULL

# ---------------------------------------------------------------- sources
S_STEP = "StepStone Gehaltsreport 2026"
S_CBS  = "CBS / national average 2026"
S_MP   = "Michael Page / Manfred salary guide 2026 (Spain)"
S_AGG  = "aggregator (PayScale / SalaryExpert / ERI / Glassdoor)"

ANCHORS = [
 ("Berlin — all occupations, gross median", "€56,500", S_STEP, "high"),
 ("Netherlands — all occupations, gross average", "€53,436", S_CBS, "high"),
 ("Spain — software engineer, 0–2 years", "€20,000 – €28,000", S_MP, "high"),
 ("Spain — software engineer, 3–6 years", "€32,000 – €50,000", S_MP, "high"),
 ("Berlin — IT software developer", "€45,500 – €63,800 (avg €53,400)", S_STEP, "high"),
 ("Berlin — data scientist", "€50,400 – €69,700 (avg €59,400)", S_STEP, "high"),
]

PATHS = [
 dict(L="A", jobs=[
        ("Audio software / DSP engineer", "Plug-ins, audio engines, embedded audio. The role your degree points at most directly."),
        ("Music-tech R&D engineer", "Ableton, Native Instruments, Bose, Dolby, Sonos, Spotify's audio team."),
        ("MIR / machine-listening engineer", "Recommendation, tagging, stem separation, detection."),
        ("Research assistant → PhD", "If you want the research route, this is where it starts."),
      ],
      learn=["Digital signal processing: filters, FFT, convolution, real-time constraints",
             "Audio programming in C++ and Python — JUCE, plug-in formats, latency budgets",
             "Psychoacoustics: what the ear actually perceives, and what you can therefore discard",
             "Music information retrieval: beat tracking, transcription, source separation",
             "A thesis that is usually half software, half experiment"],
      pay=[("Berlin", "€45,500 – €63,800", S_STEP, "high — DSP roles sit at or above the general developer band, ~€55–58k reported"),
           ("Netherlands", "€50,000 – €85,000", S_AGG, "medium — sources spread widely; treat the top of the range as senior/big-tech"),
           ("Spain", "€20,000 – €28,000 start · €32,000 – €50,000 at 3–6 yrs", S_MP, "high")],
      verdict="The strongest earnings path in this list AND the best subject fit. Audio DSP is a "
              "scarce specialism inside a well-paid profession — you are not trading money for music."),
 dict(L="C", jobs=[
        ("ML engineer (audio / speech)", "Speech recognition, voice synthesis, generative audio."),
        ("Data scientist / ML engineer, general", "The fallback that pays well anywhere — and hires constantly."),
        ("Research engineer at an audio lab", "Sony CSL, Spotify, Deezer, ElevenLabs-type companies."),
      ],
      learn=["Machine learning proper: architectures, training, evaluation, deployment",
             "Deep learning for sequences and spectrograms",
             "Data engineering — the part of the job that is actually most of the job",
             "A thesis you can point at audio if a lab exists (UGR's SigMAT, UPF's MTG)"],
      pay=[("Berlin", "€50,400 – €69,700", S_STEP, "high — the best-paid band found in Berlin"),
           ("Netherlands", "€55,000 – €100,000+", S_AGG, "low — aggregators quote €101k averages that do not match graduate reality; the CBS national average is €53k"),
           ("Spain", "€25,000 – €35,000 start; AI commands a premium", S_MP, "medium")],
      verdict="Highest ceiling and the most portable. The risk is drifting away from audio entirely — "
              "the degree will not keep you in music, only a deliberate thesis and portfolio will."),
 dict(L="N", jobs=[
        ("Product manager / product engineer", "Music-tech startups, hardware, apps."),
        ("Interaction / UX engineer", "Where design meets code."),
        ("Founder", "The path several of these programmes are explicitly built for."),
      ],
      learn=["Prototyping and user research — building to learn, not to ship",
             "Interaction and product design method",
             "Business modelling, validation, pitching",
             "A capstone that is usually a real product with real users"],
      pay=[("Berlin", "€53,000 – €70,000 in product roles", S_AGG, "medium — sits near the developer band, higher with equity"),
           ("Netherlands", "€45,000 – €75,000", S_AGG, "medium"),
           ("Spain", "€25,000 – €40,000", S_MP, "medium")],
      verdict="Pays slightly less than pure engineering at the start and more later, IF the venture works. "
              "It is the only path where the upside is uncapped and the downside is real."),
 dict(L="G", jobs=[
        ("Sound designer — film, TV, games", "Project or staff work; games are the more stable employer."),
        ("Re-recording mixer / audio post engineer", "Studio-based, credit-driven, freelance-heavy."),
        ("Technical sound designer (games)", "The hybrid role your engineering makes you unusually good at — Wwise/FMOD plus code."),
      ],
      learn=["Sound design craft: recording, editing, foley, layering to picture",
             "Mixing and delivery standards for broadcast, cinema and games",
             "Middleware — Wwise, FMOD — and interactive audio systems",
             "A reel. This path is judged on the reel, permanently"],
      pay=[("Germany", "€33,810 – €58,446 — sources disagree by 73%", S_AGG,
            "LOW. PayScale says €33,810, ERI says €52,141, SalaryExpert says €58,446, for the same role and year. ERI's entry level is €38,138"),
           ("Netherlands", "€50,220 sound designer · €62,799 sound engineer", S_AGG, "low — single-source, aggregator"),
           ("Spain", "not researched — the Spanish figure was not retrieved", "—", "none")],
      verdict="The widest pay uncertainty of any path here, and the most freelance exposure. "
              "Technical sound design is the sub-role where your engineering converts into money; "
              "pure creative sound design competes against a large pool that will out-portfolio you."),
 dict(L="H", jobs=[
        ("Spatial audio engineer", "Dolby, Fraunhofer, L-Acoustics, broadcast R&D."),
        ("Immersive audio specialist", "Atmos mixing, VR/AR audio, installation work."),
        ("Acoustic consultant", "The reliable employer for the acoustics degrees — buildings, not music."),
      ],
      learn=["Ambisonics, binaural rendering, wave field synthesis",
             "Room and environmental acoustics, measurement and modelling",
             "Object-based audio formats and production for Atmos and XR",
             "Heavy maths and physics — the most technically demanding path here"],
      pay=[("Berlin", "€45,000 – €65,000", S_AGG, "medium — tracks the engineering band; Fraunhofer/industry R&D at the top"),
           ("Netherlands", "€45,000 – €65,000", S_AGG, "low"),
           ("Spain", "€22,000 – €35,000 (acoustic consulting)", S_MP, "medium")],
      verdict="A genuinely scarce specialism, and acoustics consulting is a stable fallback that has "
              "nothing to do with music. Small field: few employers, so location follows the job."),
 dict(L="R", jobs=[
        ("Live sound engineer (FOH / monitors)", "Touring or venue-based. Freelance is the norm."),
        ("Systems engineer / system tech", "PA design and deployment — the technical top of the field."),
        ("Technical manager, venue or festival", "The salaried destination."),
      ],
      learn=["PA and line-array design, prediction software, system optimisation",
             "Show production: power, rigging, networked audio (Dante), safety",
             "This is learned on real shows more than in classrooms"],
      pay=[("All three countries", "no reliable figure retrieved", "—", "none — and the degree does not exist here anyway")],
      verdict="No viable master's exists in Spain, the Netherlands or Berlin — the Netherlands stops at "
              "bachelor and BHT Berlin admits only in the summer semester. Treat this as a certification "
              "and experience path alongside a degree, not as the degree."),
 dict(L="J", jobs=[
        ("Label manager / A&R", "The classic route. Berlin and Amsterdam are both real markets."),
        ("Rights and publishing manager", "Less glamorous, more durable, better paid."),
        ("Artist manager / booking agent", "Commission-based; income follows the roster."),
        ("Streaming / distribution analyst", "Where your data skills would command a premium."),
      ],
      learn=["Rights, publishing, licensing and royalty flows — the actual mechanics of the industry",
             "Live and touring economics",
             "Streaming economics and playlist strategy",
             "Contract literacy, and negotiation"],
      pay=[("Europe", "no reliable European figures found", "—",
            "NONE. The only benchmarks retrieved were US-denominated (junior A&R scout USD 40–60k, "
            "label marketing manager USD 70–130k) and do not transfer to Berlin, Amsterdam or Madrid pay scales")],
      verdict="The weakest salary transparency of any path in this document, and that is itself the "
              "finding: music-business pay in Europe is not published, which usually means it is lower "
              "and more variable than the US figures circulating online. Your data skills are the "
              "differentiator that would move you up a band."),
 dict(L="L", jobs=[
        ("Founder — label, studio, product, agency", "The point of the path."),
        ("Cultural programme or venue manager", "Salaried, often public or grant-funded."),
        ("Freelance portfolio career", "Several part-incomes rather than one salary."),
      ],
      learn=["Venture creation, business models, funding and grant-writing",
             "Cultural policy and how public money moves in Europe",
             "Managing a practice as a business"],
      pay=[("All three", "no salaried benchmark — income is what the venture earns", "—",
            "none. Cultural-sector employed roles generally sit BELOW the national medians on page 1")],
      verdict="Do not choose this for the salary. Choose it if you intend to build something and want "
              "a year of runway, a network and a legal structure while you do. Note that ESMT's Panzer "
              "Scholarship (€35,000) requires exactly this founder profile."),
 dict(L="AC", jobs=[
        ("Marketing analyst → marketing manager", "The quantitative track is the one that fits you."),
        ("Growth / performance marketer", "Closest to engineering; measurable, well-paid."),
        ("Brand manager", "Slower, more corporate, more senior-track."),
      ],
      learn=["Consumer behaviour and brand strategy",
             "Marketing analytics — regression, experiment design, attribution. Your maths is an advantage here",
             "Campaign and channel management",
             "Usually a company-based capstone project"],
      pay=[("Netherlands", "€38,442 – €55,000 entry · €54,130 average", "PayScale + " + S_AGG,
            "medium — but note SalaryExpert claims €100,432 average for the same role. A 2x disagreement"),
           ("Berlin", "€45,000 – €60,000", S_AGG, "medium"),
           ("Spain", "€22,000 – €35,000", S_MP, "medium")],
      verdict="The safety path: broad hiring, predictable pay, and quantitative marketing genuinely "
              "rewards your background. The cost is that it moves you furthest from music."),
 dict(L="AD", jobs=[
        ("Media / content operations manager", "Streaming platforms, broadcasters, studios."),
        ("Creative-industries strategist or consultant", ""),
        ("Product or programme manager at a media company", "Where your engineering re-enters the picture."),
      ],
      learn=["How media organisations are financed, structured and run",
             "Audience research and platform economics",
             "Creative-industries strategy and policy"],
      pay=[("Netherlands", "€40,000 – €60,000", S_AGG, "low"),
           ("Berlin", "€42,000 – €60,000", S_AGG, "low"),
           ("Spain", "€22,000 – €32,000", S_MP, "low")],
      verdict="Sits between marketing and music business, and pays like the lower half of marketing. "
              "Most of these programmes also reject engineering backgrounds on subject grounds — "
              "check the pre-master requirement before you invest in this path."),
]

CONF = {"high": ("#3F6B5C", "solid"), "medium": ("#B8672A", "indicative"),
        "low": ("#C2451F", "weak"), "none": ("#C2451F", "no data")}

def path_page(p):
    L = p["L"]
    jobs = "".join(f"<tr><td style='width:52mm'><b>{esc(a)}</b></td><td>{esc(b)}</td></tr>"
                   for a, b in p["jobs"])
    learn = "".join(f"<li>{esc(x)}</li>" for x in p["learn"])
    pays = ""
    for place, band, src, conf in p["pay"]:
        key = conf.split()[0].lower().rstrip(".—")
        col, label = CONF.get(key, CONF["low"])
        # the source note gets its own full-width line; as a fourth column it was
        # squeezed into 22mm and wrapped into a tall sliver that pushed the
        # verdict card onto a page of its own
        pays += (f"<tr><td style='width:26mm;border-bottom:0;padding-bottom:0'><b>{esc(place)}</b></td>"
                 f"<td style='border-bottom:0;padding-bottom:0'><b>{esc(band)}</b></td>"
                 f"<td style='width:20mm;border-bottom:0;padding-bottom:0'>"
                 f"<span class='badge' style='background:{col}'>{esc(label)}</span></td></tr>"
                 f"<tr><td></td><td colspan='2' class='small' style='padding-top:.4mm'>"
                 f"{esc(src)} — {esc(conf)}</td></tr>")
    return f"""<div class="page">
      <div class="kicker">Career path {esc(L)}</div>
      <h1 style="font-size:19pt;margin-bottom:.15em">{esc(PATH_FULL[L])}</h1>
      <hr class="rule" style="margin:.4em 0 .8em">
      <div class="grid2">
        <div>
          <h2 style="margin-top:0">What you would actually learn</h2>
          <ul>{learn}</ul>
          <h2>What job you end up doing</h2>
          <table>{jobs}</table>
        </div>
        <div>
          <h2 style="margin-top:0">What it pays</h2>
          <table>{pays}</table>
          <div class="card" style="margin-top:3mm">
            <h3 style="margin-top:0">The honest verdict</h3>
            <p style="margin:0">{esc(p['verdict'])}</p>
          </div>
        </div>
      </div>
    </div>"""

anchor_rows = "".join(
  f"<tr><td>{esc(a)}</td><td class='num'><b>{esc(b)}</b></td><td class='small'>{esc(c)}</td>"
  f"<td><span class='badge' style='background:{CONF[d][0]}'>{CONF[d][1]}</span></td></tr>"
  for a, b, c, d in ANCHORS)

p1 = f"""<div class="page">
 <div class="kicker">Master's 2027 · career and salary reality</div>
 <h1>Ten paths, what each one turns you into,<br>and what it pays.</h1><hr class="rule">
 <p class="lede">One page per path: what the degree teaches, the job titles it actually leads to, and the
 money — with the source and the confidence attached to every figure.</p>
 <div class="warnbox">
  <h3 style="margin-top:0">Read this before you read a single salary number</h3>
  <p><b>Salary aggregators disagree with each other by up to 2× on the same role, country and year.</b>
  Sound designer in Germany came back as €33,810 (PayScale), €52,141 (ERI) and €58,446 (SalaryExpert).
  Marketing manager in the Netherlands came back as €54,130 (PayScale) and €100,432 (SalaryExpert).
  These are not different roles. They are the same role measured by sites with different, mostly
  self-selected samples.</p>
  <p style="margin-bottom:0">So this document does three things instead of pretending to precision:
  it <b>prints the spread rather than an average</b>, because averaging two numbers that differ by 2×
  manufactures a confidence neither has; it <b>labels every figure with its source and a confidence
  badge</b>; and it <b>anchors everything to national medians</b>, which come from statistical offices
  and recruiter placement data and are the only genuinely solid numbers here.</p>
 </div>
 <h2>The anchors — trust these first</h2>
 <table><thead><tr><th style="width:78mm">Benchmark</th><th style="width:52mm">Gross per year</th>
 <th style="width:56mm">Source</th><th>Confidence</th></tr></thead>{anchor_rows}</table>
 <p class="small" style="margin-top:3mm"><b>The country effect dwarfs the path effect.</b> The same
 software role pays roughly <b>€20–28k starting in Spain</b> and <b>€45–64k in Berlin</b> — a gap far
 larger than any difference between these ten paths. Spain's low tuition and low salary are the same
 fact seen twice. Berlin gives you free tuition <i>and</i> the higher salary, which is why it keeps
 winning on the shortlist; the price is German.</p>
</div>"""

p2 = f"""<div class="page">
 <h2 style="margin-top:0">All ten at a glance</h2>
 <table><thead><tr><th style="width:8mm"></th><th style="width:52mm">Path</th>
 <th style="width:56mm">Typical first job</th><th style="width:44mm">Berlin band</th>
 <th>Salary-data quality</th></tr></thead>
 {''.join(f'''<tr>
   <td><span class="badge" style="background:{PATH_COLOR.get(p['L'],'#5C5C68')}">{p['L']}</span></td>
   <td><b>{esc(PATH_FULL[p['L']])}</b></td>
   <td>{esc(p['jobs'][0][0])}</td>
   <td>{esc(p['pay'][0][1])}</td>
   <td><span class="badge" style="background:{CONF[p['pay'][0][3].split()[0].lower().rstrip('.—')][0]}">{CONF[p['pay'][0][3].split()[0].lower().rstrip('.—')][1]}</span></td>
 </tr>''' for p in PATHS)}
 </table>
 <div class="grid2" style="margin-top:4mm">
  <div class="okbox">
   <h3 style="margin-top:0">Where the money and the music actually overlap</h3>
   <p>Three roles pay engineering money and are genuinely about sound:
   <b>audio DSP / plug-in engineer</b> (path A), <b>ML engineer for audio or speech</b> (path C), and
   <b>technical sound designer</b> in games (path G — Wwise/FMOD plus code). All three are scarce
   specialisms inside well-paid professions, which is the rare combination.</p>
   <p style="margin-bottom:0">You do not have to choose between earning and making music. You do have
   to choose the <i>technical</i> half of the music industry rather than the creative half, because
   that is where the pay is and where your degree already puts you.</p>
  </div>
  <div class="warnbox">
   <h3 style="margin-top:0">Where the numbers simply do not exist</h3>
   <p><b>Path J (music business)</b> — no reliable European salary data was found at all. The
   figures circulating online are US-denominated and do not transfer. That opacity is itself
   informative: unpublished pay is usually lower and more variable than the public US numbers suggest.</p>
   <p><b>Path L (entrepreneurship)</b> — there is no salary, by design. Income is whatever the venture
   earns, and employed cultural-sector roles sit below the national medians.</p>
   <p style="margin-bottom:0"><b>Path R (live sound)</b> — no figure retrieved, and no viable master's
   exists in scope regardless. It is a certification-and-experience field, not a degree field.</p>
  </div>
 </div>
</div>"""

EXTRA = ("body{font-size:9.2pt;line-height:1.4}h1{font-size:19pt}h2{font-size:12pt;margin-top:.8em}"
         "h3{font-size:10.4pt}td{padding:1.3mm 2mm}.page{min-height:0}"
         ".card{background:#F7F5F2}li{margin-bottom:.2em}")
pdf = to_pdf(document("Career Paths — what you learn, what you become, what it pays",
                      p1 + p2 + "".join(path_page(p) for p in PATHS), EXTRA),
             "Career_Paths.pdf")
n = stamp_footers(pdf, "Career Paths  ·  Master's September 2027  ·  built 2026-08-22  ·  every figure sourced")
print(f"Career_Paths.pdf — {n} pages, {len(PATHS)} paths")
