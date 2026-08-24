"""Career_Paths.pdf — what you study, what job it leads to, what it pays.

Salary figures are ONLY those retrieved from a named source this session.
Where sources disagree the spread is printed rather than averaged. Published
collective pay scales (TV-L in Germany, CAO in the Netherlands) are preferred
over crowd-sourced aggregators wherever a role maps onto one, because they are
negotiated, published and verifiable rather than self-reported.
"""
import sys
sys.path.insert(0, "build")
from render import document, to_pdf, esc, stamp_footers
from data import PATH_COLOR
from subjects import PATH_FULL

SCALE = "published pay scale"
STEP  = "StepStone Gehaltsreport 2026"
CBS   = "CBS national average 2026"
MP    = "Michael Page / Manfred guide 2026 (ES)"
IND   = "Indeed / Jooble Spain 2026"
GAMES = "European games-industry employment survey"
UKM   = "UK Music / Chartlex 2026 (UK only)"
AGG   = "aggregator — PayScale / ERI / SalaryExpert / Glassdoor"

CONF = {"solid": "#3F6B5C", "indicative": "#B8672A", "weak": "#C2451F", "no data": "#C2451F"}

ANCHORS = [
 ("Germany — <b>TV-L E13 step 1</b>, the public research-engineer scale a TU Berlin or university "
  "audio-lab post is paid on", "€4,759.37 / month → <b>€57,112 / yr</b>", SCALE + " (April 2026)", "solid"),
 ("Netherlands — <b>CAO Dutch Universities scale 10</b> (graduate researcher/engineer)",
  "€3,546 – €5,213 / month", SCALE + " (1 Jul 2025 table)", "solid"),
 ("Netherlands — <b>CAO scale 11</b> (senior researcher / lecturer)",
  "€4,728 – €6,349 / month", SCALE, "solid"),
 ("Berlin — all occupations, gross median", "€56,500", STEP, "solid"),
 ("Berlin — IT software developer", "€45,500 – €63,800 (avg €53,400)", STEP, "solid"),
 ("Berlin — data scientist", "€50,400 – €69,700 (avg €59,400)", STEP, "solid"),
 ("Netherlands — all occupations, gross average", "€53,436", CBS, "solid"),
 ("Spain — software engineer, 0–2 yrs / 3–6 yrs", "€20,000 – €28,000 / €32,000 – €50,000", MP, "solid"),
]

PATHS = [
 dict(L="A",
  study=[("Core", "Digital signal processing — filters, FFT, convolution, sampling theory, and the "
                  "real-time constraint that makes audio harder than it looks on paper"),
         ("Core", "Psychoacoustics: masking, localisation, loudness. What the ear perceives, and therefore "
                  "what you are allowed to throw away — this is why codecs work"),
         ("Core", "Music information retrieval: beat and key tracking, transcription, source separation, "
                  "audio fingerprinting"),
         ("Tools", "C++ with JUCE for plug-ins (VST3/AU), Python with librosa/PyTorch for analysis, "
                   "MATLAB in the more traditional departments, Max/MSP or Pure Data for prototyping"),
         ("Tools", "Version control, profiling and latency budgeting — the software-engineering half you "
                   "already have, which most of your classmates will not"),
         ("Thesis", "Typically half software, half experiment: build the thing, then measure whether it "
                    "works on listeners or on a dataset. Your engineering degree makes the build half easy; "
                    "the measurement half is what you will actually learn")],
  jobs=[("Audio software / DSP engineer", "Plug-ins, audio engines, embedded audio. The most direct destination.",
         "Native Instruments and Ableton (Berlin), Bose, Dolby, Sonos, Focusrite, Steinberg"),
        ("Music-tech R&D engineer", "Prototype-to-product research inside an audio company.",
         "Spotify audio team, Dolby, Fraunhofer IIS (the MP3/AAC institute)"),
        ("MIR / machine-listening engineer", "Recommendation, tagging, stem separation, detection.",
         "Spotify, Deezer, Epidemic Sound, Musixmatch"),
        ("Embedded audio engineer", "DSP on constrained hardware — instruments, cars, hearables.",
         "Automotive audio, hearing-aid firms, instrument manufacturers"),
        ("Research engineer → PhD", "Paid on a public scale, not a market rate. Predictable and modest.",
         "TU Berlin Audio Communication, UPF MTG, Fraunhofer")],
  pay=[("Germany — research post (TV-L E13)", "€57,112 / yr", SCALE, "solid",
        "The floor for a research-engineer job. Published, negotiated, verifiable."),
       ("Berlin — industry developer band", "€45,500 – €63,800", STEP, "solid",
        "DSP specialists reported at roughly €55,000 – €58,000, i.e. at or above the general band."),
       ("Netherlands — CAO scale 10 equivalent", "€42,500 – €62,500 / yr", SCALE, "solid",
        "€3,546–5,213/month × 12, plus the customary 8% holiday and 8.3% year-end allowances at universities."),
       ("Netherlands — private sector", "€50,000 – €85,000", AGG, "indicative",
        "Sources spread widely; the top of this range is senior or big-tech, not a graduate offer."),
       ("Spain", "€20,000 – €28,000 start · €32,000 – €50,000 at 3–6 yrs", MP, "solid",
        "Recruiter placement data, so it reflects real offers rather than self-reporting.")],
  verdict="The best earnings path here AND the best subject fit — the rare case where you are not "
          "trading money for meaning. Audio DSP is a scarce specialism inside a well-paid profession, "
          "and your software-engineering degree is the entry ticket most applicants lack."),

 dict(L="C",
  study=[("Core", "Machine learning properly: architectures, optimisation, regularisation, evaluation "
                  "that survives contact with reality"),
         ("Core", "Deep learning for sequences and spectrograms — the shapes audio actually takes"),
         ("Core", "Statistics and experimental design, which is what separates an ML engineer from "
                  "someone who calls .fit()"),
         ("Tools", "PyTorch, the HuggingFace stack, MLOps and deployment, cloud training pipelines"),
         ("Tools", "Data engineering — genuinely most of the job, and the part courses under-teach"),
         ("Thesis", "Point it at audio deliberately or you will graduate a generic ML engineer. "
                    "UGR's SigMAT group (speech, voice synthesis) and UPF's Music Technology Group are "
                    "the two labs in this dataset where an audio thesis is actually supervisable")],
  jobs=[("ML engineer — audio, speech, voice", "Speech recognition, TTS, generative audio, voice cloning.",
         "ElevenLabs-type startups, Spotify, Deezer, Sony CSL Paris"),
        ("Data scientist / ML engineer, general", "The fallback that hires constantly in every city.",
         "Effectively every mid-size company in Berlin and Amsterdam"),
        ("Research engineer, audio lab", "Between academia and product.", "Fraunhofer IIS, Sony CSL, university labs"),
        ("MLOps / platform engineer", "Higher paid, less glamorous, always in demand.", "—"),
        ("Applied scientist", "Usually needs a PhD; the research master's is the on-ramp.", "—")],
  pay=[("Berlin — data scientist", "€50,400 – €69,700 (avg €59,400)", STEP, "solid",
        "The best-paid band found anywhere in Berlin in this research."),
       ("Germany — research post (TV-L E13)", "€57,112 / yr", SCALE, "solid", "As above."),
       ("Netherlands", "€55,000 – €100,000+", AGG, "weak",
        "Aggregators quote €101,522 as a national average, which is not credible against a CBS national "
        "average of €53,436. Treat anything above €75,000 as senior or big-tech."),
       ("Spain", "€25,000 – €35,000 start; AI carries a premium", MP, "indicative",
        "DigitalES reports a structural shortage — 8,500 unfilled cloud roles — which pushes AI pay above "
        "the general software band.")],
  verdict="Highest ceiling and the most portable qualification in this document. The risk is not "
          "employment, it is drift: nothing about an AI master's keeps you in music. Only a deliberate "
          "thesis and a lab with an audio group will."),

 dict(L="N",
  study=[("Core", "Prototyping and user research — building in order to learn, not in order to ship"),
         ("Core", "Interaction and product design method: from a vague brief to a testable artefact"),
         ("Core", "Business modelling, validation and pitching — usually assessed by a real pitch"),
         ("Tools", "Figma, rapid hardware prototyping, whatever stack the project needs"),
         ("Thesis", "Almost always a real product with real users, often with an industry partner. "
                    "This is the path where a music-tech product IS the degree")],
  jobs=[("Product manager", "Music-tech startups, hardware, platforms. Engineering background is a strong asset.",
         "Native Instruments, Ableton, Bandcamp-type platforms, hardware startups"),
        ("Interaction / UX engineer", "Where design meets code — your hybrid is the whole job description.", "—"),
        ("Innovation consultant", "Corporate innovation teams and agencies.", "—"),
        ("Founder", "Several of these programmes are explicitly built as venture incubators.",
         "Mondragon LEINN, ESMT, TU Berlin IMES")],
  pay=[("Berlin — product roles", "€53,000 – €70,000", AGG, "indicative",
        "Sits near or slightly above the developer band; equity is common and unquantifiable."),
       ("Netherlands — UX / product", "€45,000 – €75,000", AGG, "indicative", "—"),
       ("Spain — UX / product designer", "€22,000 junior · €30,000 mid · €50,000+ senior", IND, "solid",
        "Indeed reports a €33,932 average for UX designers in Spain; guides put the working range at €25,000–45,000."),
       ("Founder", "no salary until the venture pays one", "—", "no data",
        "The honest entry. Upside is uncapped; downside is a year with no income.")],
  verdict="Slightly below pure engineering at the start, above it later IF the venture works. It is the "
          "only path where the outcome depends more on what you build than on who hires you."),

 dict(L="G",
  study=[("Core", "Sound design craft: field recording, editing, foley, layering, designing to picture"),
         ("Core", "Mixing and delivery standards — broadcast loudness, cinema, game middleware"),
         ("Core", "Narrative and dramaturgy of sound: why a cut works, not just how"),
         ("Tools", "Pro Tools or Reaper, Wwise and FMOD, Dolby Atmos rendering, Unreal/Unity integration"),
         ("Thesis", "A reel. This path is judged on the reel for the rest of your career, and the degree "
                    "is mostly a structured excuse to build one with feedback")],
  jobs=[("Technical sound designer (games)", "Wwise/FMOD plus scripting. THE role where your engineering "
         "converts directly into money — and the best-paid sub-role on this path.",
         "Guerrilla and Nixxes (Amsterdam), Guerrilla Cambridge, King, Ubisoft Barcelona/Berlin"),
        ("Sound designer — film / TV / games", "Project-based, credit-driven, freelance-heavy.", "—"),
        ("Audio post engineer / re-recording mixer", "Studio-based. Stable if you get on staff.",
         "Post houses in Amsterdam, Madrid, Barcelona"),
        ("Audio implementer / audio programmer", "Between design and engineering.", "—"),
        ("Foley artist / field recordist", "Specialist, small market.", "—")],
  pay=[("Europe — games industry, junior", "€6,700 – €24,250 median band", GAMES, "solid",
        "Across all disciplines. Sound sits in the LOWER half, and the survey records that sound-specialist "
        "pay FELL in 2024."),
       ("Europe — games industry, mid-level", "€13,800 – €47,000", GAMES, "solid",
        "Programmers are at the top of that band, QA at the bottom. Audio is nearer the middle."),
       ("Europe — games industry, senior", "€31,000 – €84,000", GAMES, "solid", "—"),
       ("Germany — audio engineer", "25th pct €32,800 · 75th pct €60,750", AGG, "indicative",
        "PayScale percentiles, which are more informative than the averages other sites publish."),
       ("Germany — sound designer", "€33,810 / €52,141 / €58,446", AGG, "weak",
        "THREE sources, same role, same year, 73% apart. This is the least reliable figure in the document."),
       ("Spain — técnico de sonido", "€24,198 – €30,036", IND, "indicative", "Indeed and Jooble disagree by 24%.")],
  verdict="The widest pay uncertainty and the most freelance exposure of any path here, and the European "
          "games survey says sound pay is falling, not rising. Technical sound design is the exception: "
          "it pays like programming because it largely is programming. Pure creative sound design puts you "
          "against a large pool that will out-portfolio you, and your engineering counts for little there."),

 dict(L="H",
  study=[("Core", "Ambisonics, binaural rendering, HRTFs, wave field synthesis"),
         ("Core", "Room and environmental acoustics: measurement, modelling, prediction"),
         ("Core", "Object-based audio and the Atmos/MPEG-H production chain"),
         ("Tools", "Measurement rigs, anechoic and WFS facilities, Reaper/Pro Tools with spatial toolsets, "
                   "SPAT and IEM plug-in suites"),
         ("Thesis", "The most mathematically demanding path in this list. Expect real physics")],
  jobs=[("Spatial audio engineer", "Format and renderer development.", "Dolby, Fraunhofer IIS, Sennheiser AMBEO, Apple"),
        ("Immersive audio specialist", "Atmos mixing, VR/AR audio, installations, planetaria.", "—"),
        ("Acoustic consultant", "Buildings, transport, environmental noise. Nothing to do with music — "
         "and the most reliable employer on this path.", "Arup, Level Acoustics (NL), Spanish consultancies"),
        ("Audio systems R&D", "Loudspeaker and array design.", "L-Acoustics, d&b audiotechnik, Meyer Sound")],
  pay=[("Germany — research post (TV-L E13)", "€57,112 / yr", SCALE, "solid",
        "Fraunhofer and university spatial-audio groups pay on public scales."),
       ("Berlin — engineering band", "€45,000 – €65,000", AGG, "indicative", "Tracks the general engineering band."),
       ("Germany — acoustics engineer", "€31,321", AGG, "weak",
        "ERI's figure, and it contradicts the German engineering band by roughly €20,000. Do not plan on it."),
       ("Netherlands — acoustics research post", "€2,901 – €3,707 / month", SCALE, "indicative",
        "Advertised research-position band, i.e. €34,800 – €44,500 before allowances."),
       ("Spain", "€22,000 – €35,000 (consulting)", MP, "indicative", "—")],
  verdict="A genuinely scarce specialism with a boring, stable fallback attached: acoustic consulting pays "
          "steadily and has nothing to do with music. Small field — few employers, so the job picks the "
          "city rather than the other way round."),

 dict(L="R",
  study=[("Core", "PA and line-array design, coverage prediction, system optimisation and tuning"),
         ("Core", "Networked audio — Dante, AES67 — plus power, rigging and safety"),
         ("Core", "Show production workflow and crew management"),
         ("Tools", "L-Acoustics Soundvision, Meyer MAPP, Smaart, DiGiCo and Yamaha consoles"),
         ("Thesis", "Mostly irrelevant — this trade is learned on real shows, and employers ask what "
                    "you have toured, not what you wrote")],
  jobs=[("FOH / monitor engineer", "Touring or venue. Freelance is the norm, not the exception.", "—"),
        ("Systems engineer / system tech", "PA design and deployment — the technical top of the trade.",
         "L-Acoustics, Clair Global, Fluge (ES), rental houses"),
        ("Technical manager — venue or festival", "The salaried destination, and the realistic career end-point.",
         "Paradiso and Ziggo Dome (NL), Berlin venues, Primavera/Sónar (ES)"),
        ("AV systems integrator", "Corporate AV: dull, stable, pays better than touring.", "—")],
  pay=[("Germany — audio engineer, percentiles", "25th pct €32,800 · 75th pct €60,750", AGG, "indicative",
        "The closest usable proxy; live-specific figures were not published by any source found."),
       ("Netherlands — sound engineer", "€62,799 / €63,115", AGG, "weak", "Two aggregators, single-sourced, unverifiable."),
       ("Touring — day rates", "€75 – €150 / day (historic examples)", AGG, "weak",
        "Portugal and Slovakia examples, not current German or Dutch rates. Illustrates the freelance floor, nothing more."),
       ("Spain — técnico de sonido", "€24,198 – €30,036", IND, "indicative", "—")],
  verdict="No viable master's exists in Spain, the Netherlands or Berlin — the Dutch provision stops at "
          "bachelor and BHT Berlin admits only in the summer semester, which cannot reach September 2027. "
          "Treat this as certifications plus real show experience alongside another degree. The pay data is "
          "also the thinnest here, which is consistent with a trade that hires on reputation, not credentials."),

 dict(L="J",
  study=[("Core", "Rights, publishing, licensing and royalty flows — the actual plumbing of the industry"),
         ("Core", "Live and touring economics; deal structures and contract literacy"),
         ("Core", "Streaming economics, playlisting, and the data behind both"),
         ("Tools", "Royalty and catalogue systems, market analytics, negotiation practice"),
         ("Thesis", "Usually a business plan or a market study, frequently with an industry placement")],
  jobs=[("A&R / label manager", "The classic route. Berlin and Amsterdam are real markets.",
         "Sony Music Berlin, indie labels, Warner/Universal Benelux"),
        ("Rights and publishing manager", "Less glamorous, more durable, better paid than A&R.",
         "GEMA (DE), Buma/Stemra (NL), SGAE (ES), publishers"),
        ("Streaming / catalogue analyst", "Where your data skills would command a premium the room lacks.",
         "Spotify, Deezer, distributors, label analytics teams"),
        ("Artist manager / booking agent", "Commission-based. Income follows the roster, not a contract.", "—"),
        ("Music supervisor", "Sync for film, TV, ads. Small field, high competition.", "—")],
  pay=[("UK — A&R base", "£28,000 – £45,000 · senior £55,000 – £110,000", UKM, "indicative",
        "UK ONLY. Included because it is the only real European market data found — do not assume Berlin, "
        "Amsterdam or Madrid match London."),
       ("Europe (Spain, NL, Berlin)", "no reliable published data found", "—", "no data",
        "Searched in three languages. European music-business pay is simply not published."),
       ("Sector context", "1,200+ A&R, marketing and label-services roles cut globally in the 2024–25 "
        "layoff cycle; mid-level pay compressed 8–12%", UKM, "indicative",
        "This is a shrinking-headcount market, which matters more than any single salary figure."),
       ("Artist income", "43% of full-time musicians earn under £14,000 / yr", UKM, "solid",
        "Relevant to the producer half of your ambition, and worth reading twice.")],
  verdict="The weakest salary transparency of any path — and that opacity is the finding. Unpublished pay "
          "is usually lower and more variable than the US figures circulating online. Combined with an "
          "industry actively cutting these exact roles, this is the highest-risk path in the document. "
          "Your data skills are the one thing that would place you above the crowd applying for it."),

 dict(L="L",
  study=[("Core", "Venture creation: business models, validation, funding, cap tables"),
         ("Core", "Cultural policy and how European public money actually moves — grants are a skill"),
         ("Core", "Managing a creative practice as a business, including the tax and legal shape"),
         ("Tools", "Financial modelling, grant writing, pitching"),
         ("Thesis", "Usually the venture itself, assessed as a business")],
  jobs=[("Founder — label, studio, product, agency", "The declared purpose of the path.", "—"),
        ("Cultural programme / venue manager", "Salaried, often publicly funded, modest but stable.",
         "Municipal venues, festivals, arts foundations"),
        ("Arts funding / grants officer", "The reliable salaried role this degree opens.", "—"),
        ("Portfolio freelancer", "Several part-incomes rather than one salary — the common reality.", "—")],
  pay=[("Founder", "no salary until the venture pays one", "—", "no data", "The honest answer."),
       ("Cultural-sector employed roles", "generally BELOW the national medians on page 1", "—", "weak",
        "No specific published figure was found for Spain, the Netherlands or Berlin."),
       ("Relevant instead of a salary", "ESMT Panzer Scholarship — €35,000 against €36,000 tuition, plus "
        "ten months of Berlin housing", "verified in this project's own funding sweep", "solid",
        "Requires under 30, African citizenship and residence, and a founded venture. You meet two of three today.")],
  verdict="Do not choose this for the salary; there isn't one. Choose it if you intend to build something "
          "and want a year of runway, a network and a legal structure while you do. Note the circularity "
          "worth exploiting: registering a venture now both starts the business and unlocks €35,000."),

 dict(L="AC",
  study=[("Core", "Consumer behaviour and brand strategy"),
         ("Core", "Marketing analytics — regression, experiment design, attribution modelling. Your maths "
                  "is a straightforward advantage in a room that mostly fears it"),
         ("Core", "Channel and campaign management, pricing, go-to-market"),
         ("Tools", "R or Python for analytics, SQL, GA4, CRM platforms"),
         ("Thesis", "Usually a company-based project with real data")],
  jobs=[("Marketing analyst → marketing manager", "The quantitative track, and the one that fits you.", "—"),
        ("Growth / performance marketer", "Closest to engineering: measurable, testable, well paid.", "—"),
        ("Product marketing manager", "Bridges product and market — engineering background is valued.", "—"),
        ("Brand manager", "Slower, more corporate, longer ladder.", "FMCG and consumer brands"),
        ("Marketing at a music company", "Where the two halves of your ambition could meet.",
         "Labels, streaming platforms, festival marketing")],
  pay=[("Netherlands — entry", "€38,442 – €42,820", AGG, "indicative", "PayScale entry-level and early-career figures."),
       ("Netherlands — average", "€54,130 vs €100,432", AGG, "weak",
        "PayScale and SalaryExpert, same role, same year, 86% apart. The lower figure is the credible one "
        "against a €53,436 national average."),
       ("Berlin", "€45,000 – €60,000", AGG, "indicative", "—"),
       ("Spain", "€22,000 – €35,000", MP, "indicative", "—")],
  verdict="The safety path: broad hiring, predictable pay, and quantitative marketing genuinely rewards "
          "your background rather than merely tolerating it. The cost is distance — this moves you "
          "furthest from music of any path here."),

 dict(L="AD",
  study=[("Core", "How media organisations are financed, structured and governed"),
         ("Core", "Audience research and platform economics"),
         ("Core", "Creative-industries strategy, policy and regulation"),
         ("Tools", "Audience analytics, project and production management"),
         ("Thesis", "Usually a strategy or case study, often with a media partner")],
  jobs=[("Media / content operations manager", "Streaming platforms, broadcasters, studios.", "—"),
        ("Programme or product manager, media company", "Where your engineering re-enters the picture.", "—"),
        ("Creative-industries strategist or consultant", "Agencies and public bodies.", "—"),
        ("Distribution / platform partnerships", "Commercial, relationship-driven.", "—")],
  pay=[("Netherlands", "€40,000 – €60,000", AGG, "weak", "No published scale found for this role family."),
       ("Berlin", "€42,000 – €60,000", AGG, "weak", "—"),
       ("Spain", "€22,000 – €32,000", MP, "weak", "—")],
  verdict="Sits between marketing and music business and pays like the lower half of marketing. Note the "
          "admissions problem too: most of these programmes reject engineering backgrounds on subject "
          "grounds and route you through a pre-master, adding a year before you earn anything."),
]

def badge(conf):
    return f'<span class="badge" style="background:{CONF.get(conf, CONF["weak"])}">{esc(conf)}</span>'

def path_page(p):
    L = p["L"]
    groups = {}
    for kind, text in p["study"]:
        groups.setdefault(kind, []).append(text)
    study = ""
    for kind in ("Core", "Tools", "Thesis"):
        if kind not in groups: continue
        study += (f'<div class="tiny" style="color:#E0603A;letter-spacing:.1em;text-transform:uppercase;'
                  f'margin-top:1.5mm">{kind}</div><ul style="margin-top:.5mm">'
                  + "".join(f"<li>{esc(t)}</li>" for t in groups[kind]) + "</ul>")
    jobs = ""
    for j in p["jobs"]:
        title, desc = j[0], j[1]
        who = j[2] if len(j) > 2 and j[2] != "—" else ""
        jobs += (f"<tr><td style='width:36mm'><b>{esc(title)}</b></td><td>{esc(desc)}"
                 + (f'<div class="tiny">Employers: {esc(who)}</div>' if who else "") + "</td></tr>")
    pays = ""
    for place, band, src, conf, note in p["pay"]:
        pays += (f"<tr><td style='width:38mm;border-bottom:0;padding-bottom:0'><b>{place}</b></td>"
                 f"<td style='border-bottom:0;padding-bottom:0'><b>{band}</b></td>"
                 f"<td style='width:19mm;border-bottom:0;padding-bottom:0'>{badge(conf)}</td></tr>"
                 f"<tr><td></td><td colspan='2' class='small' style='padding-top:.3mm'>"
                 f"{esc(src)}{' — ' + esc(note) if note and note != '—' else ''}</td></tr>")
    return f"""<div class="page">
      <div class="kicker">Career path {esc(L)}</div>
      <h1 style="font-size:18pt;margin-bottom:.1em">{esc(PATH_FULL[L])}</h1>
      <hr class="rule" style="margin:.35em 0 .7em">
      <div class="grid2">
        <div>
          <h2 style="margin-top:0">What you would actually study</h2>
          {study}
          <h2>Job opportunities this opens</h2>
          <table>{jobs}</table>
        </div>
        <div>
          <h2 style="margin-top:0">What it pays</h2>
          <table>{pays}</table>
          <div class="card" style="margin-top:2.5mm">
            <h3 style="margin-top:0">The honest verdict</h3>
            <p style="margin:0">{esc(p['verdict'])}</p>
          </div>
        </div>
      </div>
    </div>"""

anchor_rows = "".join(
  f"<tr><td>{a}</td><td class='num'><b>{b}</b></td><td class='small'>{esc(c)}</td><td>{badge(d)}</td></tr>"
  for a, b, c, d in ANCHORS)

p1 = f"""<div class="page">
 <div class="kicker">Master's 2027 · career and salary reality</div>
 <h1>Ten paths: what you study, what job you get,<br>and what it actually pays.</h1><hr class="rule">
 <p class="lede">One page per path — the syllabus in plain terms, the job titles it really leads to with
 named employers, and the money, with a source and a confidence badge on every single figure.</p>
 <div class="warnbox">
  <h3 style="margin-top:0">Read this before you read a single number</h3>
  <p><b>Salary aggregators disagree with each other by up to 86% on the same role, country and year.</b>
  Sound designer in Germany came back as €33,810 (PayScale), €52,141 (ERI) and €58,446 (SalaryExpert).
  Marketing manager in the Netherlands came back as €54,130 and €100,432. Acoustics engineer in Germany
  came back as €31,321 — twenty thousand euros below the German engineering band it sits inside. These
  are not different jobs. They are the same job measured by sites with different self-selected samples.</p>
  <p style="margin-bottom:0">So this document does four things instead of pretending to precision. It
  <b>prefers published collective pay scales</b> — Germany's TV-L and the Dutch university CAO are
  negotiated, published and verifiable, and a research or public-sector audio job is paid on them exactly.
  It <b>prints the spread rather than an average</b>, because averaging two figures 86% apart manufactures
  a confidence neither has. It <b>badges every figure</b> solid / indicative / weak / no data. And where
  the data does not exist, it <b>says so</b> instead of filling the gap.</p>
 </div>
 <h2>The anchors — trust these before anything else in this file</h2>
 <table><thead><tr><th style="width:96mm">Benchmark</th><th style="width:50mm">Gross</th>
 <th style="width:52mm">Source</th><th>Confidence</th></tr></thead>{anchor_rows}</table>
</div>"""

p2 = f"""<div class="page">
 <h2 style="margin-top:0">All ten at a glance</h2>
 <table><thead><tr><th style="width:8mm"></th><th style="width:46mm">Path</th>
 <th style="width:50mm">Best-paid role it leads to</th><th style="width:42mm">Best anchor figure</th>
 <th>Data quality</th></tr></thead>
 {''.join(f'''<tr>
   <td><span class="badge" style="background:{PATH_COLOR.get(p['L'],'#5C5C68')}">{p['L']}</span></td>
   <td><b>{esc(PATH_FULL[p['L']])}</b></td>
   <td>{esc(p['jobs'][0][0])}</td>
   <td>{p['pay'][0][1]}</td>
   <td>{badge(p['pay'][0][3])}</td>
 </tr>''' for p in PATHS)}
 </table>
 <div class="grid2" style="margin-top:4mm">
  <div class="okbox">
   <h3 style="margin-top:0">Where the money and the music genuinely overlap</h3>
   <p>Three roles pay engineering money and are really about sound: <b>audio DSP / plug-in engineer</b>
   (path A), <b>ML engineer for audio or speech</b> (path C), and <b>technical sound designer</b> in games
   (path G — Wwise and FMOD plus scripting). All three are scarce specialisms inside well-paid professions.</p>
   <p>You do not have to choose between earning and music. You do have to choose the <i>technical</i> half
   of the music industry over the creative half — which is where your degree already puts you.</p>
   <p style="margin-bottom:0"><b>And the effect that dwarfs every path here:</b> the same software role pays
   <b>€20,000–28,000 starting in Spain</b> and <b>€45,500–63,800 in Berlin</b>. Spain's cheap tuition and low
   salaries are one fact seen twice.</p>
  </div>
  <div class="warnbox">
   <h3 style="margin-top:0">The two things this research changed my mind about</h3>
   <p><b>Game audio pays worse than the aggregators claim.</b> The European games-industry survey puts
   junior medians at €6,700–24,250 and records that sound-specialist pay <i>fell</i> in 2024. The
   €50,000–58,000 figures on salary sites do not describe a first job.</p>
   <p style="margin-bottom:0"><b>Music business is shrinking, not just opaque.</b> The 2024–25 layoff cycle
   cut 1,200+ A&amp;R, marketing and label-services roles globally and compressed mid-level pay by 8–12%.
   That matters more than any single salary figure on path J.</p>
  </div>
 </div>

</div>"""

EXTRA = ("body{font-size:8.8pt;line-height:1.36}h1{font-size:18pt}h2{font-size:11.4pt;margin-top:.7em}"
         "h3{font-size:10pt}td{padding:1.1mm 1.8mm}.page{min-height:0}"
         ".card{background:#F7F5F2}li{margin-bottom:.16em}ul{margin:.1em 0 .3em;padding-left:1em}"
         ".warnbox,.okbox,.card{break-inside:avoid}")
pdf = to_pdf(document("Career Paths — what you study, what you become, what it pays",
                      p1 + p2 + "".join(path_page(p) for p in PATHS), EXTRA),
             "Career_Paths.pdf")
n = stamp_footers(pdf, "Career Paths  ·  Master's September 2027  ·  built 2026-08-22  ·  every figure sourced and badged")
print(f"Career_Paths.pdf — {n} pages, {len(PATHS)} paths")
