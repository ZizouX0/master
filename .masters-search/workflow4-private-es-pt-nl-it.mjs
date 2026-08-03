export const meta = {
  name: 'private-sound-schools-es-pt-nl-it',
  description: 'Exhaustive sweep of PRIVATE universities and specialist schools for sound design / music production masters in Spain, Portugal, Netherlands and Italy — with full fees, deadlines, accreditation status and verification',
  phases: [
    { title: 'Discover', detail: 'private universities + specialist academies, per country' },
    { title: 'Verify', detail: 'confirm fees, deadlines and accreditation on official pages' },
  ],
}

const PROFILE = `WHO THIS IS FOR (never invent facts about him):
- Tunisian national (NON-EU — this changes fees, visa and scholarship eligibility everywhere).
- BSc Software Engineering (SMU MedTech, Tunisia), graduating now. NO music degree, NO conservatory
  training, NO professional audio experience. Portfolio still being built. IELTS NOT yet taken.
- Goal: international DJ / music producer. Wants hands-on craft: music production, mixing,
  sound design, electronic music, live electronics, studio work.
- Budget-sensitive: he can consider self-pay but needs the REAL total cost, and any scholarship,
  discount or payment plan that exists.
- Target intake: SEPTEMBER 2027. TODAY IS JULY 2026 — most 2027 dates are not published yet.
  If only the previous cycle's date exists, label it "PRIOR CYCLE - confirm new date".`

const SCOPE = `SCOPE — STRICT:
- COUNTRIES: SPAIN, PORTUGAL, NETHERLANDS, ITALY only.
- INSTITUTIONS: PRIVATE only — private universities, private art/film/music schools, specialist
  audio academies, and international chains operating in these countries. EXCLUDE public
  universities and public conservatories (already covered elsewhere).
- SUBJECTS: sound design · music production · electronic music production · sound/audio engineering ·
  recording arts · music technology · film & game audio · immersive/spatial audio · DJ and
  electronic performance. Master level OR recognised postgraduate level.
- Include short/intensive postgraduate programmes ONLY if you clearly label them as not a full master.`

const CRITICAL = `THE MOST IMPORTANT THING TO CHECK — ACCREDITATION.
Private schools in these four countries issue very different things, and getting this wrong could
cost him his visa or leave him with a worthless certificate. For EVERY entry, establish and state:
- SPAIN: is it a "Máster Universitario OFICIAL" (accredited by ANECA, valid across the EHEA, valid
  for PhD entry and normally for a student visa) or a "Título Propio" / "Máster de Formación
  Permanente" (the school's OWN diploma, NOT an official degree)? This is the single most common
  trap in Spanish private education. Say which one it is, explicitly.
- ITALY: is it a MIUR/AFAM-recognised "Diploma Accademico di II livello" or "Laurea Magistrale"
  (official, 120 ECTS), or a "Master universitario di I/II livello" (usually 60 ECTS, a
  post-degree certificate, NOT equivalent to a magistrale), or a purely private certificate?
- NETHERLANDS: is it NVAO-accredited? Is the institution "bekostigd" (government-funded) or
  "niet-bekostigd" (private/unfunded)? Non-accredited programmes generally cannot support a
  student residence permit.
- PORTUGAL: is the "mestrado" accredited by A3ES/DGES, or is it a "pós-graduação" (a
  post-graduate course that is NOT a degree)?
Also state whether the institution can sponsor/host a NON-EU STUDENT VISA — for private schools
this is not automatic.`

const FEES = `FEES — BE EXHAUSTIVE AND EXACT. Do not settle for a headline number. Capture:
- Tuition for a NON-EU student, per year AND total for the programme, with the academic year it refers to.
- Application/admission fee, enrolment/matriculation fee, materials/equipment fee, exam fees,
  insurance, and any "comprehensive"/"services" fee.
- Whether a laptop, software licences or hardware must be bought (some audio schools require this).
- Payment plans / instalments, early-bird discounts, alumni or referral discounts.
- Any scholarship, bursary or fee waiver a NON-EU/Tunisian applicant could actually get, with the amount.
- If a figure is not published, write UNVERIFIED — never estimate a fee.`

const RULES = `METHOD:
- Use WebSearch and WebFetch. Do NOT call the firecrawl CLI.
- Search in the LOCAL LANGUAGE as well as English — this is where private schools are found:
  ES: "máster producción musical", "máster diseño de sonido", "máster ingeniería de sonido",
      "máster oficial vs título propio", "escuela superior audio"
  PT: "mestrado produção musical", "pós-graduação som", "escola de som privada"
  NL: "master muziekproductie", "opleiding sound design particulier", "niet-bekostigde opleiding"
  IT: "master produzione musicale", "diploma accademico musica elettronica", "scuola sound design"
- Use OFFICIAL institution pages. Aggregators and ranking sites are leads only.
- Be SCEPTICAL of marketing language. If a school calls something a "master" but it is not
  accredited, say so plainly.
- Also capture RECOMMENDATION signals: accreditation body, industry partnerships, notable alumni
  or teaching staff, studio/equipment list, graduate outcomes, and any published complaints or
  red flags about the school.
- If a fact is not on a page you read, write UNVERIFIED. Never guess.
- Aim for 10-20 entries per slice; completeness matters more than brevity here.`

const F = {
  program:{type:'string'}, institution:{type:'string'}, city:{type:'string'}, country:{type:'string'},
  institutionType:{type:'string',description:'Private university / Private art school / Specialist audio academy / International chain campus'},
  qualification:{type:'string',description:'Exact award, e.g. "Máster Universitario Oficial", "Título Propio", "Diploma Accademico II livello", "Master universitario I livello", "NVAO-accredited MA", "pós-graduação"'},
  accreditationStatus:{type:'string',description:'OFFICIAL / NOT OFFICIAL / UNVERIFIED, plus the accrediting body (ANECA, MIUR-AFAM, NVAO, A3ES) and what that means in practice'},
  visaEligible:{type:'string',description:'Can this programme support a non-EU student visa/residence permit? Yes / No / UNVERIFIED, with reasoning'},
  focus:{type:'string'}, whatYouStudy:{type:'string',description:'Concrete modules, studios, software, projects'},
  language:{type:'string'}, durationEcts:{type:'string'},
  tuitionTotal:{type:'string',description:'Total tuition for the whole programme for a NON-EU student, with year'},
  tuitionPerYear:{type:'string'},
  otherFees:{type:'string',description:'Application, enrolment, materials, equipment, insurance, exam fees — itemised'},
  equipmentRequired:{type:'string',description:'Laptop, software licences, hardware the student must buy'},
  paymentPlans:{type:'string',description:'Instalments, early-bird or other discounts'},
  scholarships:{type:'string',description:'Any award a Tunisian/non-EU applicant could get, with amount and deadline'},
  totalCostEstimate:{type:'string',description:'Best estimate of the full first-year outlay (tuition + fees + equipment), stated as a range if needed'},
  entryRequirements:{type:'string'},
  acceptsNonMusic:{type:'string',description:'Is a software-engineering/non-music bachelor accepted? Quote the wording.'},
  portfolioSpec:{type:'string',description:'Exact portfolio requirement as published'},
  auditionSpec:{type:'string',description:'Audition/interview/test, or "None"'},
  englishTest:{type:'string',description:'Is IELTS accepted, what score, or is the local language required?'},
  intakes:{type:'string',description:'How many intakes per year and when (private schools often have several)'},
  applicationOpens:{type:'string'}, deadline:{type:'string',description:'Label "PRIOR CYCLE - confirm new date" if only an old date exists'},
  facilities:{type:'string',description:'Studios, consoles, Atmos rooms, equipment, industry partners'},
  reputationSignals:{type:'string',description:'Accreditation, industry partnerships, notable alumni/staff, graduate outcomes, any red flags'},
  recommendation:{type:'string',description:'Your candid verdict for THIS candidate: is it worth the money, and why or why not'},
  sourceUrl:{type:'string'},
}
const DISC={type:'object',properties:{programs:{type:'array',items:{type:'object',properties:F,
  required:['program','institution','city','country','qualification','sourceUrl']}}},required:['programs']}
const VER={type:'object',properties:{programs:{type:'array',items:{type:'object',properties:{...F,
  verified:{type:'string',description:'Verified / Partial / Unverified'},
  verificationNotes:{type:'string'},
  valueVerdict:{type:'string',description:'WORTH IT / CONDITIONAL / AVOID — with the single decisive reason'},
  rating:{type:'string',description:'A / B / C for this candidate'},
}},required:['program','institution','sourceUrl','verified','rating']}},required:['programs']}

const SLICES = [
  ['es-unis','SPAIN — PRIVATE UNIVERSITIES with sound/music-production/audio masters. Cover at least: Universidad Europea (Madrid/Valencia), Universidad Nebrija, Universidad Camilo José Cela (UCJC), Universidad Alfonso X el Sabio (UAX), Universidad Francisco de Vitoria, UNIR (online), Universidad Antonio de Nebrija, Universidad Ramon Llull / La Salle Barcelona (Enginyeria La Salle has audio/sound), Universitat Internacional de Catalunya, ESIC, Universidad Loyola, U-tad (Madrid, digital arts), Universidad Villanueva. For EACH state clearly whether the award is an official Máster Universitario or a Título Propio / Máster de Formación Permanente.'],
  ['es-schools','SPAIN — PRIVATE SPECIALIST AUDIO & MUSIC SCHOOLS. Cover at least: Berklee Valencia, Microfusa (Barcelona/Madrid), SAE Institute Madrid & Barcelona, Trazos (Madrid), CEV (Madrid), CICE (Madrid), ESCAC-adjacent sound courses, Taller de Músics (Barcelona), Aula Creactiva, Nocturna Escuela, Sonic Academy-style DJ/producer schools, Escuela Superior de Música Reina Sofía (private), Musikene-adjacent private options, Deusto Musical. Flag hard which of these issue an ACCREDITED master versus a private certificate, and whether they can host a non-EU student visa.'],
  ['pt','PORTUGAL — PRIVATE universities and schools for sound/music production. Cover at least: Universidade Católica Portuguesa (Porto — Escola das Artes, Som e Imagem), Universidade Lusófona (Lisbon — a ReSound partner, also its own programmes), Universidade Lusíada, Universidade Autónoma de Lisboa, ETIC (Escola de Tecnologias Inovação e Criação), Restart (Lisbon/Porto), EPI, IPAM, Universidade Europeia (Lisbon, Laureate), Escola Superior Artes e Design (ESAD Matosinhos, check status), Emme Escola de Música. Distinguish an A3ES-accredited MESTRADO from a PÓS-GRADUAÇÃO (not a degree). Portuguese fees are comparatively low — give exact numbers.'],
  ['nl','NETHERLANDS — PRIVATE / niet-bekostigde institutions for sound design and music production. Cover at least: SAE Institute Amsterdam, Herman Brood Academie (Utrecht), Abbey Road Institute Amsterdam, Media College / MediaCollege Amsterdam private tracks, Rockacademie-adjacent private options, DJ schools (DJ School Amsterdam / Dance Fabriek), Tio University of Applied Sciences, Wittenborg, Global School of Entertainment, plus any private art academy offering an audio master. CRITICAL for the Netherlands: state NVAO accreditation status and whether the institution is a recognised sponsor with the IND (Immigration Service) able to host a non-EU student residence permit — many private schools are NOT.'],
  ['it-unis','ITALY — PRIVATE universities and academies for sound design / music production. Cover at least: NABA (Nuova Accademia di Belle Arti, Milan/Rome — Sound Design), IED (Istituto Europeo di Design), RUFA (Rome University of Fine Arts), IULM (Milan, media), Università Cattolica adjacent media masters, Saint Louis College of Music (Rome), CPM Music Institute (Milan), Accademia di Belle Arti privates, SAE Institute Milan, Scuola Mohole (Milan), Accademia del Suono (Milan), NUOVA Accademia. State precisely whether each award is a MIUR/AFAM Diploma Accademico di II livello (official 120 ECTS), a Master universitario di I or II livello (usually 60 ECTS, NOT a magistrale), or a private certificate.'],
  ['chains','INTERNATIONAL PRIVATE CHAINS operating in Spain, Portugal, Netherlands or Italy — compare their campuses on price, accreditation and what you actually get. Cover: SAE Institute (all campuses in these 4 countries), Abbey Road Institute, Berklee (Valencia), Point Blank, dBs, Global/Icon chains, Deutsche POP if present, Pyramind partners. For each campus in scope: exact fee, exact award, accreditation status in THAT country, visa eligibility, intake dates, and whether the qualification is recognised outside the school. Be blunt about value for money — these are expensive and their awards vary hugely by country.'],
  ['money','SCHOLARSHIPS, DISCOUNTS AND PAYMENT ROUTES for PRIVATE study in Spain, Portugal, Netherlands and Italy specifically, available to a NON-EU / Tunisian student. Cover: institution-level scholarships at private universities (Universidad Europea, Nebrija, UCJC, NABA, IED, RUFA, UCP Porto, Lusófona, SAE, Berklee Valencia), Italian regional DSU/ISEE-based aid and whether private-university students qualify, Spanish autonomous-community aid and whether título propio students are excluded, Dutch Holland Scholarship participation by private institutions, Portuguese institutional bolsas, plus student-loan or instalment schemes marketed to internationals. State amounts, eligibility and deadlines. Be explicit where a scheme EXCLUDES private or título-propio students — that exclusion is exactly what he needs to know.'],
]

function discover([label, brief]) {
  return agent(
`You are a specialist researcher. Find PRIVATE-sector master's and postgraduate programmes in sound
design and music production, and report them with complete, exact financial and admissions detail.

${PROFILE}

${SCOPE}

YOUR SLICE: ${brief}

${CRITICAL}

${FEES}

${RULES}

Return ONLY the structured object.`,
    { label: `find:${label}`, phase: 'Discover', agentType: 'general-purpose', schema: DISC })
    .then(r => (r && r.programs) ? r.programs.map(p => ({ ...p, _slice: label })) : [])
}

const out = await pipeline(
  SLICES,
  slice => discover(slice),
  (progs, slice) => {
    if (!progs || !progs.length) return []
    const batches = []
    for (let i = 0; i < progs.length; i += 5) batches.push(progs.slice(i, i + 5))
    return parallel(batches.map((b, i) => () => agent(
`You are the VERIFICATION agent for PRIVATE-sector programmes. Money and accreditation claims here
must be exact — this candidate could waste tens of thousands of euros or lose a visa on a wrong fact.

${PROFILE}

For EACH programme below:
1. Open sourceUrl with WebFetch (find and FIX the URL via WebSearch if it is wrong or generic).
2. Verify the AWARD and ACCREDITATION precisely. ${CRITICAL}
3. Verify EVERY fee figure on the official fees page — tuition (non-EU), application fee, enrolment,
   materials, equipment, insurance. Correct anything wrong. Mark UNVERIFIED rather than guessing.
4. Verify intakes, application opening and deadline. If only a past cycle exists, write
   "PRIOR CYCLE - confirm new date". Today is July 2026; his target is September 2027.
5. Verify the portfolio/audition spec, the English-test requirement (does it accept IELTS?), and
   whether a non-music bachelor is accepted — quote the wording.
6. Set valueVerdict: WORTH IT / CONDITIONAL / AVOID, with the single decisive reason. Be blunt:
   if a school charges master-level money for a non-accredited certificate, say AVOID and say why.
7. Set rating A/B/C for this candidate and verified = Verified | Partial | Unverified.
Drop any programme you cannot confirm exists.

PROGRAMMES (batch ${i + 1} of slice ${slice[0]}):
${JSON.stringify(b, null, 1)}

Return ONLY the structured object.`,
      { label: `verify:${slice[0]}-${i + 1}`, phase: 'Verify', agentType: 'general-purpose', schema: VER })
      .then(r => (r && r.programs) ? r.programs : [])))
      .then(a => {
        const flat = a.filter(Boolean).flat()
        return flat.length ? flat : progs.map(p => ({ ...p, verified: 'Unverified',
          verificationNotes: 'verification did not run — confirm fees and accreditation yourself',
          valueVerdict: 'CONDITIONAL', rating: 'B' }))
      })
  }
)

const all = out.filter(Boolean).flat()
log(`private-school sweep: ${all.length} programmes`)
const byVerdict = all.reduce((m, p) => { m[p.valueVerdict] = (m[p.valueVerdict] || 0) + 1; return m }, {})
const byCountry = all.reduce((m, p) => { m[p.country] = (m[p.country] || 0) + 1; return m }, {})
log(`verdicts: ${JSON.stringify(byVerdict)} | countries: ${JSON.stringify(byCountry)}`)
return { count: all.length, byVerdict, byCountry, programs: all }
