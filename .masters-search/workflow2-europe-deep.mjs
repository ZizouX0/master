export const meta = {
  name: 'europe-deep-supplement',
  description: 'Supplementary deep-Europe sweep: NL standalone, ES/PT local-language pass, pan-EU directory catch-all, tuition-free options, foundation scholarships',
  phases: [
    { title: 'DeepEurope', detail: 'supplementary discovery agents' },
    { title: 'Verify', detail: 'official-source verification' },
  ],
}

const PROFILE = `CANDIDATE PROFILE (do not invent facts about the candidate):
- Nationality: Tunisian (drives scholarship eligibility — check explicitly).
- Degree: Software Engineering, SMU MedTech, Tunisia, graduating now. CS/software background is an ASSET for computing-heavy audio programs.
- Languages: Arabic (native), French (fluent), English (working; IELTS/TOEFL NOT yet taken).
- Track 1 (PRIMARY): sound / music technology — sound engineering, music technology, sound & music computing, audio DSP, music production, sound design.
- Track 2: business — music business, entertainment/arts management, general business/MBA.
- Career goal: international DJ and music producer. Value production skills, audio-tech skills, industry network, music-business knowledge.
- Funding: STRONG preference fully funded; partial acceptable; self-pay only as labeled fallback (tuition-free public unis count as viable).
- Primary intake: September 2027. Also surface still-open 2026 intakes.
- TODAY IS JULY 2026: most Sept-2027 deadlines are NOT published yet. If only a past cycle's date is found, label it "PRIOR CYCLE - confirm new date".`

const RULES = `RESEARCH RULES:
- Use WebSearch and WebFetch for all discovery. Do NOT call the firecrawl CLI (credits reserved).
- Prefer OFFICIAL sources (university program page, scholarship's own site, EACEA catalogue). Aggregators (mastersportal, findamasters) are LEADS — confirm on the official page before treating facts as true; if unconfirmed, mark "UNVERIFIED".
- Capture the official source URL for every entry.
- Note language of instruction and whether a PORTFOLIO or AUDITION is required.
- Do NOT hallucinate program names, deadlines, or amounts. Missing data => "UNVERIFIED"/"Check".`

const OPP_FIELDS = {
  program: { type: 'string' }, university: { type: 'string' }, country: { type: 'string' },
  publicPrivate: { type: 'string', description: 'Public, Private, Conservatory, or Consortium' },
  track: { type: 'string', description: 'Sound/Music-Tech, Sound-Design/Production, Acoustics/Audio-Eng, Music-Business, or General-Business/MBA' },
  language: { type: 'string' },
  tuitionIntl: { type: 'string', description: 'International tuition with currency, or UNVERIFIED' },
  scholarshipName: { type: 'string', description: 'Funding scheme name or "None found"' },
  fundingLevel: { type: 'string', description: 'Full, Partial, None, or UNVERIFIED' },
  stipendCoverage: { type: 'string' },
  tunisianEligible: { type: 'string', description: 'Y, N, or Check' },
  portfolioReq: { type: 'string', description: 'Y/N/Check' },
  entryRequirements: { type: 'string' },
  applicationOpens: { type: 'string' },
  deadline: { type: 'string', description: 'Label "PRIOR CYCLE - confirm new date" if only an old date found' },
  sourceUrl: { type: 'string' },
  fitNotes: { type: 'string', description: 'One line on fit for THIS candidate' },
}
const DISCOVERY_SCHEMA = { type: 'object', properties: { opportunities: { type: 'array', items: { type: 'object', properties: OPP_FIELDS, required: ['program','university','country','track','sourceUrl'] } } }, required: ['opportunities'] }
const VERIFY_SCHEMA = { type: 'object', properties: { opportunities: { type: 'array', items: { type: 'object', properties: { ...OPP_FIELDS, verified: { type: 'string' }, verificationNotes: { type: 'string' } }, required: ['program','university','sourceUrl','verified'] } } }, required: ['opportunities'] }

const slices = [
  ['nl-deep', `NETHERLANDS — dedicated deep sweep. EVERY Dutch university, hogeschool, conservatory, and private school with masters in sound/music-tech, audio, music production, sonology, game audio, music business, or arts/creative-industries management. Must cover at minimum: HKU Utrecht (Music & Technology; MA Music Design), Institute of Sonology at Royal Conservatoire The Hague, Codarts Rotterdam, Conservatorium van Amsterdam, Univ of Amsterdam, Utrecht Univ, Erasmus Rotterdam (cultural economics / media), Leiden, Groningen, Fontys, ArtEZ, Hanze/Prince Claus, SAE Amsterdam. Include Holland Scholarship / Orange Tulip (Tunisia eligibility) and university-specific scholarships (e.g. Amsterdam Excellence, Utrecht Excellence, Holland-High-Potential).`],
  ['es-deep', `SPAIN — second-pass deep sweep IN SPANISH as well as English (search terms like "máster sonido", "máster tecnología musical", "máster producción musical", "máster industria musical", "máster gestión cultural"). Cover regional public universities and conservatorios superiores beyond the obvious: UPF/ESMUC/Berklee Valencia are already known — dig for Univ Complutense, Politécnica de Madrid/Valencia/Cataluña, Sevilla, Granada, Basque Country, SAE Madrid/Barcelona, CEV, Trazos, Microfusa, and business schools (ESIC, EAE) with music/entertainment management. Include Spanish government + regional scholarships open to non-EU/Tunisian students.`],
  ['pt-deep', `PORTUGAL — second-pass deep sweep IN PORTUGUESE as well as English ("mestrado som", "mestrado música", "engenharia de áudio", "produção musical", "gestão cultural"). Cover: Univ de Aveiro (music/tech), Univ Nova de Lisboa, Univ de Lisboa, Univ Católica (sound & image, Porto), Politécnico do Porto/ESMAE, Politécnico de Lisboa/ESML, Univ do Minho, Univ de Évora, Restart, ETIC, SAE, plus Erasmus Mundus programs hosted in Portugal. Include Portuguese scholarships open to non-EU students (FCT, university merit, IPDJ) and note low tuition levels.`],
  ['eu-directories', `PAN-EUROPE CATCH-ALL — sweep the major program directories to catch anything a per-country search would miss: mastersportal.com, findamasters.com, the official EACEA Erasmus Mundus catalogue, keystone masterstudies. Search for: music technology, sound engineering, audio engineering, sound design, music production, acoustics, music business, music management, arts management masters ANYWHERE in Europe (including small countries: Luxembourg, Malta, Cyprus, Iceland, Liechtenstein, Monaco, Andorra, Balkans, Moldova, Ukraine, Georgia, Armenia, Türkiye). These directory hits are LEADS — confirm each on the official university page before listing facts; keep only real programs.`],
  ['eu-tuitionfree', `TUITION-FREE / LOW-TUITION EUROPE for non-EU students — a funding-angle sweep. Cover: German public universities (no/low tuition even for non-EU except Baden-Württemberg's 1500 EUR/sem), Norway (now charges non-EU — verify current policy), Iceland public unis (registration fee only), Czech public unis (free if studying in Czech), Greece low fees, France public universities (low registration; note differentiated fees + exemptions), Belgium low fees, Italy income-based fees + DSU regional grants + Univ of Bologna/Padova study grants. For each, tie to a CONCRETE sound/music-tech or music-business master the candidate could attend nearly free. This is the self-pay-viable fallback layer.`],
  ['eu-foundations', `EUROPEAN FOUNDATION / NGO / MUSIC-INDUSTRY SCHOLARSHIPS beyond government schemes — e.g. Abbey Road Institute scholarships, AES (Audio Engineering Society) educational grants, She Is The Music / industry diversity funds (check male eligibility), Roberto Cimetta Fund (Arab-Mediterranean artist mobility — Tunisia-relevant), Anna Lindh Foundation, British Council programmes for MENA, Institut Français Tunisie funding, Erasmus+ credit mobility, Wells international foundation, university endowed scholarships in music tech (e.g. QMUL, Surrey bursaries). Verify each is real, current-ish, and note Tunisian eligibility.`],
]

function discover(slice) {
  const [label, brief] = slice
  return agent(`You are a research subagent doing an exhaustive, VERIFIABLE sweep for a master's-program & scholarship database.

${PROFILE}

YOUR SLICE: ${brief}

${RULES}

Find as many relevant, real, official-source-backed opportunities in your slice as you can (aim 10-20). Fill every field you can verify; use "UNVERIFIED"/"Check" for the rest. Return ONLY the structured object.`,
    { label: `deep:${label}`, phase: 'DeepEurope', agentType: 'general-purpose', schema: DISCOVERY_SCHEMA })
    .then(r => (r && r.opportunities) ? r.opportunities.map(o => ({ ...o, _src: 'deep-' + label })) : [])
}

const raw = (await parallel(slices.map(s => () => discover(s)))).filter(Boolean).flat()
log(`Deep-Europe discovery: ${raw.length} raw opportunities`)

const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const seen = new Map()
for (const o of raw) {
  const key = norm(o.program).slice(0, 40) + '|' + norm(o.university).slice(0, 30)
  if (!seen.has(key)) seen.set(key, o)
}
const unique = [...seen.values()]
log(`After dedup: ${unique.length} unique`)

function chunk(a, n) { const out = []; for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n)); return out }
const batches = chunk(unique, 6)
const verified = await pipeline(
  batches,
  (batch, _o, i) => agent(`You are the VERIFICATION subagent. Re-check each opportunity below against its OFFICIAL page and correct/confirm the fields.

${PROFILE}

For EACH opportunity: open sourceUrl with WebFetch (WebSearch for the official page if the URL is weak); confirm program existence, language, intl tuition, scholarship + funding level + coverage, Tunisian eligibility, portfolio/audition, entry requirements, opens/deadline. If only a past cycle's date exists, set deadline to "PRIOR CYCLE - confirm new date" (today is July 2026). Set verified = Verified | Partial | Unverified with specifics in verificationNotes. Only if a FULLY-FUNDED or strong option's official page is JS-gated and WebFetch fails, you MAY run ONE Bash command: firecrawl scrape "<url>" --formats markdown. Never invent.

OPPORTUNITIES (batch ${i + 1}/${batches.length}):
${JSON.stringify(batch, null, 1)}

Return ONLY the structured object.`,
    { label: `verify:deep-${i + 1}`, phase: 'Verify', agentType: 'general-purpose', schema: VERIFY_SCHEMA })
    .then(r => (r && r.opportunities) ? r.opportunities : batch.map(o => ({ ...o, verified: 'Unverified', verificationNotes: 'verification agent returned nothing' })))
)
const all = verified.filter(Boolean).flat()
log(`Deep-Europe verification complete: ${all.length}`)
return { counts: { raw: raw.length, unique: unique.length, verified: all.length }, opportunities: all }
