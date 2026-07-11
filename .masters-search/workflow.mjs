export const meta = {
  name: 'masters-scholarship-sweep',
  description: "Exhaustive master's program + scholarship search for a Tunisian software-eng grad targeting sound/music-tech and music-business, Sept-2027 intake",
  phases: [
    { title: 'Wave1-Funding', detail: 'Erasmus Mundus + government scholarship schemes' },
    { title: 'Wave2-Tracks', detail: 'program-first by track' },
    { title: 'Wave3-Regions', detail: 'region sweep for private/specialist schools' },
    { title: 'Verify', detail: 'confirm deadlines/tuition/eligibility vs official URLs' },
  ],
}

const PROFILE = `CANDIDATE PROFILE (do not invent facts about the candidate):
- Nationality: Tunisian (this drives scholarship eligibility — check it explicitly).
- Degree: Software Engineering, SMU MedTech, Tunisia, graduating now. CS/software background is an ASSET for computing-heavy audio programs.
- Languages: Arabic (native), French (fluent), English (working; IELTS/TOEFL NOT yet taken).
- Target track 1 (PRIMARY): sound / music technology — sound engineering, music technology, sound & music computing, audio DSP, music production, sound design.
- Target track 2: business — music business, entertainment/arts management, general business/MBA.
- Career goal: become an international DJ and music producer. Value programs that build production skills, audio-tech skills, industry network, or music-business knowledge.
- Funding: STRONG preference for fully funded; partial acceptable; self-pay only as a labeled fallback.
- Primary intake: September 2027 (apps typically open Oct-Nov 2026, close Dec 2026-Jan 2027). Also surface still-open 2026 intakes.
- TODAY IS JULY 2026: most Sept-2027 deadlines are NOT published yet. When you can only find a past cycle's date, label the deadline "PRIOR CYCLE - confirm new date". Never present an old date as current.`

const RULES = `RESEARCH RULES:
- Use the WebSearch and WebFetch tools for all discovery and checking. Do NOT call the firecrawl CLI (credits are scarce and reserved for the verification phase).
- Prefer OFFICIAL sources: the university's own program page, the scholarship's official site, the Erasmus+ / EACEA catalogue. Treat blogs/aggregators (mastersportal, etc.) as LEADS to confirm on the official page, not as truth.
- Capture the official source URL for every entry. If a fact is not on an official page you can read, set that field to "UNVERIFIED".
- Note language of instruction, and whether an artistic PORTFOLIO or AUDITION is required (critical for arts-leaning options).
- For Erasmus Mundus, note the rules: mobility across >=2 countries, and the constraint that a student cannot hold another EU-funded scholarship for the same study period.
- Do NOT hallucinate program names, deadlines, or amounts. Quantity of VERIFIED options is the goal. Missing data => "UNVERIFIED" or "Check".`

const OPP_FIELDS = {
  program: { type: 'string', description: 'Program / degree name' },
  university: { type: 'string', description: 'Institution name' },
  country: { type: 'string' },
  publicPrivate: { type: 'string', description: 'Public, Private, Conservatory, or Consortium' },
  track: { type: 'string', description: 'Which candidate track: Sound/Music-Tech, Sound-Design/Production, Acoustics/Audio-Eng, Music-Business, or General-Business/MBA' },
  language: { type: 'string', description: 'Language of instruction' },
  tuitionIntl: { type: 'string', description: 'International tuition (with currency) or UNVERIFIED' },
  scholarshipName: { type: 'string', description: 'Scholarship/funding scheme name, or "None found"' },
  fundingLevel: { type: 'string', description: 'Full, Partial, None, or UNVERIFIED' },
  stipendCoverage: { type: 'string', description: 'What the funding covers (stipend/tuition/travel) or UNVERIFIED' },
  tunisianEligible: { type: 'string', description: 'Y, N, or Check — is a Tunisian national eligible?' },
  portfolioReq: { type: 'string', description: 'Portfolio/audition required? Y/N/Check' },
  entryRequirements: { type: 'string', description: 'Key entry requirements (degree, language test, prerequisites)' },
  applicationOpens: { type: 'string', description: 'Application open date or UNVERIFIED' },
  deadline: { type: 'string', description: 'Deadline; label "PRIOR CYCLE - confirm new date" if only an old date is found' },
  sourceUrl: { type: 'string', description: 'Official source URL' },
  fitNotes: { type: 'string', description: 'One line on fit for THIS candidate (DJ/producer goal, CS background, funding)' },
}
const DISCOVERY_SCHEMA = {
  type: 'object',
  properties: { opportunities: { type: 'array', items: { type: 'object', properties: OPP_FIELDS, required: ['program','university','country','track','sourceUrl'] } } },
  required: ['opportunities'],
}
const VERIFY_SCHEMA = {
  type: 'object',
  properties: { opportunities: { type: 'array', items: { type: 'object', properties: {
    ...OPP_FIELDS,
    verified: { type: 'string', description: 'Verified, Partial, or Unverified' },
    verificationNotes: { type: 'string', description: 'What was confirmed vs. could not be confirmed on the official page' },
  }, required: ['program','university','sourceUrl','verified'] } } },
  required: ['opportunities'],
}

const wave1 = [
  ['em-arts', 'Erasmus Mundus Joint Masters in SOUND, MUSIC, AUDIO, MEDIA, film-sound, digital creativity, and creative-tech. Search the official EACEA Erasmus Mundus catalogue (erasmus-plus.ec.europa.eu / eacea) plus known ones (e.g. ReSound, Media Arts Cultures, etc.). List every relevant consortium with the coordinating institution and scholarship (full EMJM scholarship).'],
  ['em-cs-biz', 'Erasmus Mundus Joint Masters that are COMPUTING-heavy or BUSINESS/management-oriented and relevant to audio/media/creative industries or that a software engineer could leverage toward music tech (e.g. data/AI/HCI/interactive media, cultural/creative-industries management). Use the official EACEA catalogue.'],
  ['daad', 'GERMANY: DAAD scholarships open to Tunisians (esp. EPOS/Development-Related, Study Scholarships for graduates in arts/music, WISE) AND German masters in music technology, sound, audio, Tonmeister, media, or music business (e.g. TU Berlin Audio Communication, Detmold/HfM Tonmeister, SRH/BIMM, Popakademie). Note DAAD portal + program pages.'],
  ['france', 'FRANCE: Eiffel Excellence Scholarship + Campus France schemes for Tunisians, and French masters/conservatoire programs in son/musique/MAO/ingénierie du son/musicology/music business (e.g. ENS Louis-Lumière, INA, Le Fresnoy, universities, ATIAM IRCAM/Sorbonne, business schools with music/creative-industries tracks).'],
  ['uk', 'UK: Chevening + Commonwealth + university scholarships open to Tunisians, and UK masters in music technology, sound, audio, music production, music business (e.g. Surrey, York, QMUL C4DM Sound & Music Computing, Leeds, UWE, Berklee Valencia is Spain-not-UK, BIMM, LIPA, ICMP). Note funding realistically.'],
  ['usa', 'USA: Fulbright Foreign Student Program (Tunisia) + university assistantships/funding, and US masters in music technology, sound recording, music engineering, sound & music computing, music business (e.g. NYU, Berklee, USC Thornton, Georgia Tech Music Technology, CCRMA Stanford, Miami Frost, CalArts, Carnegie Mellon). Flag which offer full funding.'],
  ['nl-au-nz', 'NETHERLANDS/AUSTRALIA/NEW ZEALAND: Holland Scholarship + Orange Tulip + Australia Awards + NZ scholarships (eligibility for Tunisians), and masters in sound/music tech/audio/music business at HKU Utrecht, Univ of Amsterdam, Sydney/Melbourne/RMIT/SAE, Auckland. '],
  ['other-gov', 'OTHER GLOBAL SCHEMES open to Tunisians: Swiss Government Excellence, Türkiye Bursları (Turkey), Hungary Stipendium Hungaricum, Italy (MAECI/university), Spain, Nordic (Sweden SI, Denmark, Norway, Finland), Ireland (Government of Ireland IES), Belgium (VLIR/ARES), Portugal, plus Islamic Development Bank and OFID scholarships. Match to sound/music-tech OR business masters where possible.'],
]
const wave2 = [
  ['t-smc', 'TRACK sound & music computing / audio tech / audio DSP / music informatics — COMPUTING-HEAVY masters worldwide that leverage a software-engineering background (e.g. UPF Barcelona SMC, QMUL, Aalborg, KTH, IRCAM ATIAM, Georgia Tech, Stanford CCRMA, Aalto). Note funding + portfolio needs.'],
  ['t-prod', 'TRACK sound design / music production / conservatory audio — production-focused masters and conservatoire/specialist-school programs (e.g. Berklee Valencia, LIPA, dBs, SAE, Abbey Road Institute, Conservatoires, Tonmeister). Note portfolio/audition requirements and any funding.'],
  ['t-acoustics', 'TRACK acoustics & audio engineering — masters in acoustics, audio engineering, electroacoustics, sound engineering (e.g. Salford, Southampton ISVR, KTH, DTU, Le Mans, Aachen). Funding + eligibility.'],
  ['t-musicbiz', 'TRACK music business / entertainment & arts management — masters in music business, music management, entertainment/arts/cultural management worldwide (e.g. Berklee, NYU, Univ of the Arts, HKU, business schools, Popakademie Music & Creative Industries). Funding + eligibility for Tunisians.'],
  ['t-mba', 'TRACK general business / MBA with FUNDING that could serve a music-industry entrepreneur (creative-industries MBAs, funded management masters). Prioritize scholarships open to Tunisians / North Africa / Africa.'],
]
// EUROPE: near per-country coverage — the candidate wants EVERY European country, miss nothing.
// Each agent must sweep EVERY university, conservatory, Hochschule/academy of music, art school, and
// private/specialist audio or business school in its country(ies), public AND private, and not skip small ones.
const EU_TAIL = ' — sweep EVERY university, conservatory/academy of music, art school, and private/specialist audio OR business school (public and private, big and small). Find all masters relevant to the two tracks (sound/music-tech AND music-business). Note tuition (flag if tuition-free/low for public), scholarships, Tunisian eligibility, language of instruction, and portfolio/audition needs.'
const wave3 = [
  ['r-de', 'EUROPE Germany' + EU_TAIL + ' Include TU Berlin, Detmold/HfM Tonmeister, Popakademie Baden-Württemberg, HAW/Hochschulen, SRH Berlin, BIMM Berlin, Darmstadt, plus every Musikhochschule.'],
  ['r-at', 'EUROPE Austria' + EU_TAIL + ' Include IEM Graz (KUG), mdw Vienna, Anton Bruckner Linz, JAM MUSIC LAB, SAE Vienna.'],
  ['r-fr', 'EUROPE France' + EU_TAIL + ' (French fluency is an asset.) Include ENS Louis-Lumière, INA sup, Le Fresnoy, ATIAM (IRCAM/Sorbonne), CNSMD Paris/Lyon, universities, ISART, SAE, business schools with music/creative tracks.'],
  ['r-benelux', 'EUROPE Netherlands + Belgium + Luxembourg' + EU_TAIL + ' Include HKU Utrecht, Codarts Rotterdam, Univ of Amsterdam, Institute of Sonology (Royal Conservatoire The Hague), KASK/LUCA/Ghent, IPEM Ghent.'],
  ['r-ch', 'EUROPE Switzerland + Liechtenstein' + EU_TAIL + ' Include ZHdK Zurich, HEM Geneva, HKB Bern, EPFL/ETH audio-adjacent, plus Swiss Government Excellence scholarships.'],
  ['r-es', 'EUROPE Spain' + EU_TAIL + ' Include UPF Barcelona (Sound & Music Computing), ESMUC, Berklee Valencia, SAE, Univ conservatorios superiores.'],
  ['r-pt', 'EUROPE Portugal' + EU_TAIL + ' Include Univ of Lisbon, Univ of Aveiro, ESML, Univ Católica, Restart.'],
  ['r-it', 'EUROPE Italy + Malta' + EU_TAIL + ' Include Italian Conservatori (electronic music/music tech), Politecnico, Univ of Milan/Bologna, MET/Saint Louis, Univ of Malta.'],
  ['r-scan1', 'EUROPE Denmark + Sweden' + EU_TAIL + ' Include Aalborg Univ (Sound & Music Computing / Medialogy), KTH Stockholm, Royal College of Music Stockholm (KMH), Lund/Malmö, RITCS/DTU acoustics.'],
  ['r-scan2', 'EUROPE Norway + Finland + Iceland' + EU_TAIL + ' Include NTNU Trondheim, Univ of Oslo, Aalto Univ (Acoustics & Audio / Sound in New Media), Sibelius Academy (Uniarts Helsinki), Iceland Univ of the Arts.'],
  ['r-baltic', 'EUROPE Estonia + Latvia + Lithuania' + EU_TAIL + ' Include Estonian Academy of Music and Theatre, EKA, Vilnius/Latvian academies.'],
  ['r-central', 'EUROPE Poland + Czechia + Slovakia' + EU_TAIL + ' Include music academies (Kraków, Warsaw, Prague HAMU/JAMU), technical universities with acoustics.'],
  ['r-cee', 'EUROPE Hungary + Slovenia + Croatia + Serbia' + EU_TAIL + ' Include Liszt Academy (Budapest), Univ of Ljubljana, Zagreb academies, and note Stipendium Hungaricum.'],
  ['r-see', 'EUROPE Greece + Cyprus + Romania + Bulgaria + rest of the Balkans (Albania, North Macedonia, Bosnia, Montenegro, Kosovo)' + EU_TAIL + ' Include Ionian Univ (audiovisual arts / music tech), Aristotle Univ, national music academies.'],
  ['r-uk', 'EUROPE United Kingdom' + EU_TAIL + ' Include Surrey, York, QMUL C4DM, Salford, Southampton ISVR, Leeds, UWE, Edinburgh, Glasgow, plus BIMM, LIPA, ICMP, dBs, SAE, Point Blank, Abbey Road Institute.'],
  ['r-ie', 'EUROPE Ireland' + EU_TAIL + ' Include IADT (ReSound), DkIT, Univ of Limerick (Irish World Academy), TU Dublin, Maynooth, plus Government of Ireland IES.'],
  // Rest of world (still in scope, but Europe above is the exhaustive focus).
  ['r-us', 'REGION USA — universities + conservatories + specialist schools for music technology/recording/music engineering/business, emphasizing assistantships/FULL funding (NYU, Berklee, USC Thornton, Georgia Tech, Stanford CCRMA, Miami Frost, CalArts, CMU, Michigan, Peabody).'],
  ['r-ca', 'REGION Canada — McGill (music tech/sound recording), Univ de Montréal, Univ of Toronto, specialist schools; funding open to Tunisians (Quebec is francophone-friendly).'],
  ['r-au-nz', 'REGION Australia + New Zealand — universities + SAE/JMC/AIM for audio/music-tech/music-business; scholarships.'],
  ['r-me-asia', 'REGION UAE/Middle East + Asia (Singapore NUS/YST, Korea, Japan, Hong Kong) — strong sound/music-tech or music-business masters with international scholarships open to Tunisians.'],
]

function discover(slice, phase) {
  const [label, brief] = slice
  const prompt = `You are a research subagent doing an exhaustive, VERIFIABLE sweep for a master's-program & scholarship database.

${PROFILE}

YOUR SLICE: ${brief}

${RULES}

Find as many relevant, real, official-source-backed opportunities in your slice as you can (aim 8-20). For each, fill every field you can verify from an official page; use "UNVERIFIED"/"Check" for the rest. Return ONLY the structured object.`
  return agent(prompt, { label: `discover:${label}`, phase, agentType: 'general-purpose', schema: DISCOVERY_SCHEMA })
    .then(r => (r && r.opportunities) ? r.opportunities.map(o => ({ ...o, _src: label })) : [])
}

// ---- Waves 1-3 discovery (barrier: need all before dedup) ----
const thunks = [
  ...wave1.map(s => () => discover(s, 'Wave1-Funding')),
  ...wave2.map(s => () => discover(s, 'Wave2-Tracks')),
  ...wave3.map(s => () => discover(s, 'Wave3-Regions')),
]
const raw = (await parallel(thunks)).filter(Boolean).flat()
log(`Discovery returned ${raw.length} raw opportunities across ${thunks.length} agents`)

// ---- Dedup by normalized (program + university) ----
const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const seen = new Map()
for (const o of raw) {
  const key = norm(o.program).slice(0, 40) + '|' + norm(o.university).slice(0, 30)
  if (!seen.has(key)) seen.set(key, o)
  else { // merge: prefer entry that names a scholarship / has a source url
    const ex = seen.get(key)
    if ((!ex.scholarshipName || ex.scholarshipName === 'None found') && o.scholarshipName && o.scholarshipName !== 'None found') seen.set(key, { ...ex, ...o })
  }
}
const unique = [...seen.values()]
log(`After dedup: ${unique.length} unique opportunities`)

// ---- Verification pass: batch of 6 per agent, WebFetch-first, firecrawl only if needed ----
function chunk(a, n) { const out = []; for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n)); return out }
const batches = chunk(unique, 6)
const verified = await pipeline(
  batches,
  (batch, _orig, i) => agent(
`You are the VERIFICATION subagent. Re-check each opportunity below against its OFFICIAL page and correct/confirm the fields.

${PROFILE}

For EACH opportunity:
1. Open its sourceUrl with WebFetch (and WebSearch for the official page if the URL is weak). Confirm: program exists, language, international tuition, scholarship name + funding level + what it covers, whether a Tunisian national is eligible, portfolio/audition requirement, entry requirements, application-opens, and deadline.
2. Deadlines: if only a past cycle's date is found, set deadline to "PRIOR CYCLE - confirm new date". Never present an old date as current. (Today is July 2026.)
3. Set verified = "Verified" (all key facts confirmed on official page), "Partial" (some confirmed), or "Unverified" (could not confirm). Put specifics in verificationNotes.
4. If — and only if — the official page is JavaScript-gated and WebFetch returns no usable content for a FULLY-FUNDED or otherwise strong option, you MAY run ONE Bash command: \`firecrawl scrape "<url>" --formats markdown\` to read it. Do not use firecrawl for weak/self-pay options; credits are shared and limited.
Do not invent anything. Keep every field; correct wrong ones.

OPPORTUNITIES (batch ${i + 1}/${batches.length}):
${JSON.stringify(batch, null, 1)}

Return ONLY the structured object with the same opportunities, now with verified + verificationNotes.`,
    { label: `verify:batch-${i + 1}`, phase: 'Verify', agentType: 'general-purpose', schema: VERIFY_SCHEMA }
  ).then(r => (r && r.opportunities) ? r.opportunities : batch.map(o => ({ ...o, verified: 'Unverified', verificationNotes: 'verification agent returned nothing' })))
)
const allVerified = verified.filter(Boolean).flat()
log(`Verification complete: ${allVerified.length} opportunities`)

return {
  counts: { raw: raw.length, unique: unique.length, verified: allVerified.length },
  opportunities: allVerified,
}
