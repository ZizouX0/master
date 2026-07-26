export const meta = {
  name: 'europe-sound-design-production-deep',
  description: 'Deep Europe-only sweep for sound design & music production masters, verified, for a Tunisian software-engineering grad aiming at DJ/producer work',
  phases: [
    { title: 'Countries', detail: 'per-country deep dives' },
    { title: 'Niches', detail: 'film schools, game audio, private academies, electroacoustic, immersive' },
    { title: 'Verify', detail: 'confirm every entry on the official page' },
  ],
}

const PROFILE = `WHO THIS IS FOR (do not invent facts about him):
- Tunisian national. BSc Software Engineering (SMU MedTech, Tunisia), graduating now. NO music degree,
  NO conservatory training, NO professional audio-engineering experience yet.
- Languages: Arabic (native), French (fluent), English (working). IELTS/TOEFL NOT yet taken.
- Goal: become an international DJ and music producer. He wants HANDS-ON craft: music production,
  mixing, sound design, electronic music, live electronics, studio work.
- Funding: strongly prefers fully funded; partial acceptable; tuition-free/low-fee public counts.
  Self-pay only as a labelled fallback.
- Target intake: SEPTEMBER 2027 (calls typically open Oct 2026 - Feb 2027).
- TODAY IS JULY 2026. Most 2027 deadlines are NOT published yet. If you only find the previous
  cycle's date, label it "PRIOR CYCLE - confirm new date". NEVER present an old date as current.`

const SCOPE = `SCOPE — STRICT:
- EUROPE ONLY (EU + UK + Switzerland + Norway/Iceland + Western Balkans + Turkey). Ignore US/Canada/Asia/Oceania.
- ONLY masters (or equivalent 2nd-cycle / MA / MMus / MSc / MFA / postgraduate diploma at master level) in:
  SOUND DESIGN · MUSIC PRODUCTION · ELECTRONIC MUSIC PRODUCTION · SOUND ENGINEERING / RECORDING ARTS ·
  SOUND ART / SONIC ARTS (practice-based) · FILM & GAME SOUND · LIVE ELECTRONICS / PERFORMANCE ·
  IMMERSIVE / SPATIAL AUDIO · ELECTROACOUSTIC COMPOSITION **where the emphasis is practical production**.
- EXCLUDE: pure musicology, pure acoustics/vibration engineering, classical instrumental performance,
  music therapy, general media studies, music business/management (covered elsewhere), and bachelor programmes.
- INCLUDE every institution type: public universities, universities of applied sciences, conservatories
  and academies of music, art schools, FILM schools, and PRIVATE/specialist audio academies.`

const RULES = `METHOD & HONESTY RULES:
- Use WebSearch and WebFetch. Do NOT call the firecrawl CLI.
- Search in the LOCAL LANGUAGE as well as English — this is where the best finds hide. Examples:
  DE "Master Sounddesign / Tonmeister / Musikproduktion / Elektronische Komposition"
  FR "master son / conception sonore / MAO / musiques appliquees / ingenierie du son"
  ES "master diseno de sonido / produccion musical"  IT "biennio musica elettronica / sound design"
  NL "master sound design / muziekproductie"  PL "rezyseria dzwieku"  CZ/SK "zvukova skladba / zvukova tvorba"
  PT "mestrado som / producao musical"  SCAND "lyddesign / ljuddesign / musikkproduksjon".
- Prefer OFFICIAL pages (the institution's own programme page). Aggregators are LEADS ONLY — confirm before listing.
- Capture the PORTFOLIO / AUDITION requirement as precisely as the page states it (how many works,
  what length, what formats, whether a LIVE audition or an on-site test is required). This is the single
  most decision-relevant field for this candidate.
- Explicitly judge whether a NON-MUSIC / computer-science / software-engineering bachelor is accepted.
  Quote the wording if the page addresses it.
- If a fact is not on a page you actually read, write "UNVERIFIED" - never guess.
- Aim for QUALITY over volume: a verified, well-described programme beats five vague ones. 8-18 per slice.`

const F = {
  program:    { type: 'string', description: 'Exact programme name as published' },
  university: { type: 'string', description: 'Institution name' },
  city:       { type: 'string', description: 'City where you would actually study' },
  country:    { type: 'string' },
  degree:     { type: 'string', description: 'MA / MMus / MSc / MFA / 2nd-cycle diploma etc.' },
  institutionType: { type: 'string', description: 'Public university / University of applied sciences / Conservatory / Art school / Film school / Private academy' },
  focus:      { type: 'string', description: 'Which of: Music Production, Sound Design, Film/Game Sound, Electronic Music/Live Electronics, Immersive Audio, Recording/Engineering, Sonic Arts' },
  whatYouStudy:{ type: 'string', description: 'Concrete curriculum content: modules, studios, software, projects. What he would actually DO.' },
  language:   { type: 'string', description: 'Language of instruction' },
  durationEcts:{ type: 'string', description: 'Length and ECTS, e.g. "2 years / 120 ECTS"' },
  tuitionIntl:{ type: 'string', description: 'Tuition for a non-EU student, with currency and year, or UNVERIFIED' },
  scholarship:{ type: 'string', description: 'Named funding available to a non-EU/Tunisian student, or "None found"' },
  fundingLevel:{ type: 'string', description: 'Full / Partial / None / UNVERIFIED' },
  stipend:    { type: 'string', description: 'What the funding actually pays (tuition waiver, monthly amount, housing) or UNVERIFIED' },
  portfolioSpec:{ type: 'string', description: 'EXACT portfolio requirement as published: number of works, duration, format, notes' },
  auditionSpec:{ type: 'string', description: 'Live audition / on-site test / interview requirement, or "None"' },
  acceptsNonMusic:{ type: 'string', description: 'Yes / No / Check — is a software-engineering or other non-music bachelor accepted? Quote the wording if stated.' },
  entryRequirements:{ type: 'string', description: 'Degree, language test and any other entry conditions' },
  applicationOpens:{ type: 'string' },
  deadline:   { type: 'string', description: 'Label "PRIOR CYCLE - confirm new date" if only an old date is published' },
  facilities: { type: 'string', description: 'Studios, consoles, Atmos/immersive rooms, industry links, notable alumni or staff — or UNVERIFIED' },
  fitNotes:   { type: 'string', description: 'One or two lines: how well this serves a CS grad who wants to be a DJ/producer, and the main obstacle' },
  sourceUrl:  { type: 'string', description: 'Official programme page URL' },
}
const DISC = { type:'object', properties:{ programs:{ type:'array', items:{ type:'object', properties:F,
  required:['program','university','city','country','focus','sourceUrl'] } } }, required:['programs'] }
const VER = { type:'object', properties:{ programs:{ type:'array', items:{ type:'object', properties:{
  ...F, verified:{type:'string',description:'Verified / Partial / Unverified'},
  verificationNotes:{type:'string',description:'What was confirmed on the official page and what could not be'},
  rating:{type:'string',description:'A / B / C — A = excellent fit AND realistically attainable for him; B = good with a caveat; C = weak fit or blocked'},
} , required:['program','university','sourceUrl','verified','rating'] } } }, required:['programs'] }

const COUNTRIES = [
  ['de', 'GERMANY — every Hochschule, Musikhochschule, HAW, art school and private academy with a sound-design, music-production, Tonmeister, electronic-composition or game-audio master. Search in German too. Cover at least: HfM Detmold (Tonmeister), TU Berlin, UdK Berlin, Filmuniversität Babelsberg KONRAD WOLF (film sound!), HFF München, Popakademie Baden-Württemberg, Hochschule Darmstadt (Sound & Music Production), SAE Institute (DE), dBs, Deutsche POP, HAW Hamburg, Folkwang, HMTM Hannover, Robert Schumann Düsseldorf, ICEM Essen, Trossingen. Note that German public tuition is very low — say so explicitly.'],
  ['at-ch', 'AUSTRIA + SWITZERLAND — mdw Vienna, Universität für Musik Graz / IEM (computer music!), Anton Bruckner Linz, Kunstuniversität Linz, FH St. Pölten (Digital Media / audio), SAE Vienna, JAM MUSIC LAB; Switzerland: ZHdK Zürich (Sound Arts / Music & Media), HEM Genève, HKB Bern, HSLU Luzern (Music & Media / electronic music), Lausanne. Note Swiss Government Excellence Art Scholarships.'],
  ['fr', 'FRANCE — search in French. Cover: ENS Louis-Lumière (son), La Fémis (son — film sound), INA sup, CNSMD Paris & Lyon (électroacoustique / MAO / métiers du son), ATIAM (IRCAM/Sorbonne, note it is more technical), Le Fresnoy, ENSATT, ISTS, universities with "master son"/"création sonore"/"musiques appliquées" (Paris 8, Saint-Etienne, Toulouse, Marseille, Lille, Brest, Bourges), plus private: ISART Digital, SAE Paris, ESRA/ISTS, Studio M, 3iS. Note the candidate is FLUENT IN FRENCH so French-taught programmes are fully viable and often nearly free.'],
  ['uk-ie', 'UK + IRELAND — Surrey (Music & Media / Sound Recording Tonmeister-style), York (Postproduction/Sound Design), Edinburgh (Sound Design), Glasgow, Leeds, UWE Bristol, Bournemouth (Post Production Sound), NFTS (National Film & Television School — Sound Design for Film & TV), Goldsmiths, SOAS, QMUL (more technical), Salford, Huddersfield, plus specialist: LIPA, BIMM, ICMP, dBs Institute, Point Blank, SAE UK, Abbey Road Institute. Ireland: IADT (ReSound), DkIT, TU Dublin, Univ of Limerick. Be realistic about funding for non-EU students.'],
  ['nl-be', 'NETHERLANDS + BELGIUM — HKU Utrecht (Music Design), Institute of Sonology (Royal Conservatoire The Hague), Conservatorium van Amsterdam (Live Electronics, Immersive Audio), Codarts Rotterdam, ArtEZ, Fontys, Utrecht School of the Arts, SAE Amsterdam, Herman Brood Academie; Belgium: KASK Ghent (Music Production!), LUCA School of Arts, Koninklijk Conservatorium Brussel/Antwerpen/Gent, IPEM Ghent, ARTS² Mons. Note the Flemish Master Mind scholarship and NL Scholarship.'],
  ['nordic', 'NORDICS — Denmark: Rhythmic Music Conservatory Copenhagen (electronic music/production!), DIS, Royal Danish Academy of Music, Aalborg (Sound & Music Computing). Sweden: Royal College of Music Stockholm (KMH — electroacoustic composition), Luleå/Piteå School of Music (Audio Technology!), Malmö/Lund, Göteborg (HSM). Norway: NTNU (Music Technology!), NMH Oslo, Univ of Agder (popular music/production), Westerdals/Kristiania. Finland: Sibelius Academy (Music Technology), Aalto (Sound in New Media!), Metropolia (music production). Iceland: Iceland University of the Arts. Flag which charge non-EU tuition and which are free.'],
  ['baltic-pl', 'BALTICS + POLAND — Estonian Academy of Music and Theatre (sound engineering/recording), Estonian Academy of Arts, Baltic Film Media and Arts School (Tallinn — film sound!), Latvian Academy of Music (Jazeps Vitols — sound engineering), Vilnius Academy of Music and Theatre (LMTA, a ReSound partner), Lithuanian film schools. Poland: search "rezyseria dzwieku" — Chopin University of Music Warsaw (sound engineering), Lodz Film School (film sound!), AGH Krakow (sound engineering), Katowice (Kieslowski Film School), Gdansk. Note NAWA Banach funding.'],
  ['cz-sk-hu', 'CZECHIA + SLOVAKIA + HUNGARY — search "zvukova skladba", "zvukova tvorba", "hangmesteri". FAMU Prague (Sound Design — world-famous film school!), HAMU Prague (Sound Design/Zvukova tvorba), JAMU Brno, VSMU Bratislava (Film & TV Faculty — Sound Design), Liszt Academy Budapest, SZFE Budapest (Univ of Theatre and Film Arts — sound), MOME Budapest. Note Stipendium Hungaricum and Slovak Government Scholarships.'],
  ['es-pt', 'SPAIN + PORTUGAL — search in Spanish and Portuguese. Spain: ESMUC Barcelona, UPF Barcelona, Berklee Valencia (Music Production, Scoring), SAE Madrid/Barcelona, Microfusa, Trazos, CEV, ECAM Madrid (film sound), Universidad Carlos III, Politecnica Valencia. Portugal: Universidade Catolica Porto (Sound & Image!), Universidade de Aveiro, ESMAE Porto, ESML Lisbon, Universidade Lusofona (a ReSound partner!), Universidade Nova, Restart, ETIC. Note low Portuguese/Spanish public fees.'],
  ['it-mt-gr', 'ITALY + MALTA + GREECE + CYPRUS — Italy: search "biennio musica elettronica" and "sound design" — Conservatori (Santa Cecilia Roma, Milano, Torino, Bologna, Venezia, Firenze, Padova, Cuneo), NABA Milano (Sound Design!), IED, Politecnico di Milano (Music & Acoustic Engineering — more technical), Saint Louis Roma, RUFA. Malta: Univ of Malta. Greece: Ionian University Corfu (Audiovisual Arts / Sonic Arts!), Aristotle Univ Thessaloniki, Hellenic Mediterranean Univ. Cyprus: Univ of Nicosia, Cyprus Univ of Technology.'],
  ['see-tr', 'SOUTH-EAST EUROPE + TURKEY — Slovenia (Univ of Ljubljana AGRFT — film sound), Croatia (ADU Zagreb — film sound), Serbia (FDU Belgrade — Sound Recording and Design), Bosnia, North Macedonia, Albania, Romania (UNATC Bucharest — Film Sound Art / Arta Sunetului de Film, Univ of Music Bucharest), Bulgaria (NATFA Sofia, National Academy of Music). Turkey: ITU MIAM Istanbul (Sonic Arts / Sound Engineering & Design), Bilkent, Bahcesehir, Istanbul Bilgi, Anadolu. Note Turkiye Burslari full funding and Romanian/Bulgarian state scholarships.'],
]

const NICHES = [
  ['film-schools', 'EUROPEAN FILM SCHOOLS with a dedicated SOUND master (this is where the best sound-design training in Europe lives, and the first sweep under-covered it). Sweep the CILECT / GEECT member schools for sound programmes: NFTS (UK), La Fémis (FR), Filmuniversität Babelsberg (DE), HFF München, FAMU Prague, Lodz Film School (PL), VSMU Bratislava, AGRFT Ljubljana, ADU Zagreb, FDU Belgrade, UNATC Bucharest, NATFA Sofia, Baltic Film School Tallinn, National Film School of Denmark, Norwegian Film School (Lillehammer), Stockholm Univ of the Arts, ELIA/ELO Helsinki, Netherlands Film Academy, RITCS Brussels, ESCAC/ECAM (ES), Centro Sperimentale di Cinematografia (IT). For each: does it have a sound-design master, is it in English, what is the portfolio/entrance test, and is a non-film/non-music background accepted?'],
  ['game-audio', 'GAME AUDIO & INTERACTIVE SOUND masters in Europe — the fastest-growing paid niche and one that directly rewards his programming skills (Wwise, FMOD, Unity/Unreal, procedural audio). Look for dedicated programmes or strong specialisations: Abertay Dundee, Staffordshire, Univ of Hertfordshire, Bournemouth, Breda Univ of Applied Sciences (NL), Saxion, HKU, Aalborg, Uppsala Campus Gotland (SE), Futuregames (SE), DADIU (DK), Cologne Game Lab / TH Köln (DE), SAE, Politecnico di Milano, Univ of Malta. State clearly which are true masters vs short courses.'],
  ['private-academies', 'PRIVATE / SPECIALIST AUDIO ACADEMIES in Europe offering master-level or postgraduate qualifications in music production, electronic music production, DJing or audio engineering: Abbey Road Institute (all campuses), SAE Institute (all EU campuses), dBs Institute (UK), Point Blank Music School (London/Ibiza), ICMP London, LIPA, BIMM (UK/DE/IE), Deutsche POP, Berklee Valencia, Catalyst Berlin, Pyramind, Music Production Academy, Noise Academy, EIM. For each: is the award a real master-level qualification (and recognised where), what does it cost, is any scholarship open to non-EU students, and what is the entry requirement? Be explicit and sceptical about non-accredited "diplomas".'],
  ['electroacoustic', 'CONSERVATOIRE ELECTROACOUSTIC / COMPUTER-MUSIC / ELECTRONIC-COMPOSITION masters in Europe that are PRACTICE-heavy (studio composition, live electronics, Max/MSP, modular, spatialisation) rather than purely theoretical — these are often overlooked routes into production. Cover at minimum: IEM Graz (KUG), Institute of Sonology (NL), IRCAM/CNSMDP (FR), KMH Stockholm, NTNU (NO), Sibelius Academy (FI), ICEM Essen (DE), HSLU Luzern (CH), ZHdK (CH), Conservatori italiani (musica elettronica), Univ of Huddersfield, Birmingham (BEAST), City Univ London, Univ of Manchester (NOVARS), Trinity Laban, Univ of Edinburgh, Aveiro/Porto (PT), ESMUC (ES). Flag which explicitly accept applicants WITHOUT a music degree — that is decisive here.'],
  ['immersive-djing', 'IMMERSIVE / SPATIAL AUDIO and DJ/ELECTRONIC-PERFORMANCE oriented masters in Europe. Immersive: Dolby Atmos / ambisonics / 3D audio programmes (CvA Amsterdam Immersive Audio, FH St. Pölten, Detmold, York, Surrey, Berlin, HSLU, Barcelona). Electronic performance/DJ-adjacent: Rhythmic Music Conservatory Copenhagen, Univ of Agder, RMC/Kristiania, Codarts, HKU, KASK, Catalyst Berlin, Point Blank Ibiza, plus any master that explicitly mentions DJing, club music, turntablism or electronic performance practice. This is the closest thing in Europe to a "become a better DJ/producer" master — say plainly which ones actually deliver that.'],
  ['funded-consortia', 'FUNDED CONSORTIA & SCHEMES for sound/film/media production in Europe, beyond the obvious ReSound: sweep the official EACEA Erasmus Mundus catalogue for any current EMJM touching sound, film, animation, games, media arts or digital creativity (e.g. ReSound, DIGICREA, REPLAY, RE:Anima, FilmMemory, MediaAC, DOCNOMADS, Kino Eyes). Also cover: Nordplus/Nordic Master programmes in music technology, CIVIS/EUTOPIA/FilmEU alliance joint masters, and any national scheme that would fund a NON-EU student on a sound-design master (DAAD artistic scholarships, Campus France/Eiffel, Master Mind Flanders, NAWA Banach, Stipendium Hungaricum, Turkiye Burslari, Swiss Excellence Art Scholarship, Government of Ireland IES). For each state clearly whether a Tunisian national is eligible.'],
]

function discover(slice, phase) {
  const [label, brief] = slice
  return agent(
`You are a specialist research agent. Find the BEST master's programmes in Europe for SOUND DESIGN and MUSIC PRODUCTION.

${PROFILE}

${SCOPE}

YOUR SLICE: ${brief}

${RULES}

Return ONLY the structured object.`,
    { label: `find:${label}`, phase, agentType: 'general-purpose', schema: DISC })
    .then(r => (r && r.programs) ? r.programs.map(p => ({ ...p, _slice: label })) : [])
}

phase('Countries')
const found = await pipeline(
  [...COUNTRIES.map(s => ['Countries', s]), ...NICHES.map(s => ['Niches', s])],
  ([ph, slice]) => discover(slice, ph),
  // verify each slice's findings as soon as that slice returns
  (progs, [ph, slice]) => {
    if (!progs || !progs.length) return []
    const batches = []
    for (let i = 0; i < progs.length; i += 6) batches.push(progs.slice(i, i + 6))
    return parallel(batches.map((b, i) => () => agent(
`You are the VERIFICATION agent. Re-check each programme below against its OFFICIAL page and correct every field.

${PROFILE}

For EACH programme:
1. Open sourceUrl with WebFetch (use WebSearch to find the official page if the URL is weak or wrong — and fix it).
2. Confirm: the programme exists and is at master level, city, language, duration/ECTS, non-EU tuition,
   funding available to a Tunisian, the EXACT portfolio spec, whether there is a LIVE audition or on-site test,
   and whether a non-music (software-engineering) bachelor is accepted. Quote wording where it matters.
3. Deadlines: if only a past cycle's date exists, write "PRIOR CYCLE - confirm new date". Today is July 2026.
4. Set verified = Verified | Partial | Unverified, explain in verificationNotes.
5. Set rating: A = genuinely excellent for HIM and realistically attainable (accepts non-music backgrounds,
   affordable or funded, strong production/sound-design craft); B = good but with a real caveat
   (expensive, or needs a portfolio he must build, or language/audition hurdle); C = weak fit or effectively blocked
   (needs a music degree, live performance audition, professional experience, or a language he lacks).
Never invent. Drop any programme you cannot confirm exists at all.

PROGRAMMES (batch ${i + 1}/${batches.length} of slice ${slice[0]}):
${JSON.stringify(b, null, 1)}

Return ONLY the structured object.`,
      { label: `verify:${slice[0]}-${i + 1}`, phase: 'Verify', agentType: 'general-purpose', schema: VER })
      .then(r => (r && r.programs) ? r.programs : [])))
      .then(a => a.filter(Boolean).flat())
  }
)

const all = found.filter(Boolean).flat()
log(`Deep sound-design sweep: ${all.length} verified programme records`)
const byRating = all.reduce((m, p) => { m[p.rating] = (m[p.rating] || 0) + 1; return m }, {})
log(`ratings: ${JSON.stringify(byRating)}`)
return { count: all.length, byRating, programs: all }
