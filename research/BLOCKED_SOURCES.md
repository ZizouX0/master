# Sources this environment cannot reach — 15 rows needing a human browser

Verified 2026-08-22. Of 161 rows verified in Wave 3, **15 (9%) are held back by a
server that refuses automated access** — Cloudflare challenges, proof-of-work bot
walls, or JavaScript-only pages. These are not dead links and not missing programmes.
The information exists; this environment simply cannot read it.

**Every one of these was tried at least three ways** — the fetch tool, `curl` with full
browser headers, and (where relevant) a text proxy or an alternate subdomain — before
being recorded as blocked. None was left wearing a verification badge it had not earned.

**Each takes about two minutes in a normal browser.** That is the single highest-value
manual task in this project.

## The one that matters most

**UPF Barcelona (A-011 Intelligent Interactive Systems, A-013 Sound and Music Computing).**
`upf.edu` returned 403 to every method across two separate waves, including `mtg.upf.edu`
and the English mirror; even `robots.txt` is refused, and the Internet Archive is
egress-blocked from here. UPF hosts the Music Technology Group, and its Sound and Music
Computing master is on paper the closest fit in this entire dataset to a software engineer
who wants to work in music. **Its tuition, its 2027 deadline and its access-profile list
are all unread.** Check these by hand before ranking Barcelona.

## Full list

| id | Programme | Institution | Domain | Status | What is unread |
|---|---|---|---|---|---|
| A-010 | Creative Intelligence & Technology (MSc) - formerly  | Leiden University - Leiden Institute o | `universiteitleiden.nl` | PARTIALLY_VERIFIED | partial detail |
| A-019 | Master de formacion permanente en Musica y Sonido pa | ENTI-UB - Escola de Noves Tecnologies  | `enti.cat` | PARTIALLY_VERIFIED | tuition, deadline |
| AC-036 | MSc Marketing Management | Tilburg University (Tilburg School of  | `tilburguniversity.edu` | PARTIALLY_VERIFIED | deadline, entry reqs |
| AC-037 | MSc Marketing Analytics | Tilburg University (Tilburg School of  | `tilburguniversity.edu` | PARTIALLY_VERIFIED | deadline |
| H-099 | Master de Produccion de Sonido y Musica para Cine, V | SONTIC Digital School (accredited thro | `sontic.es` | PARTIALLY_VERIFIED | tuition, deadline |
| L-128 | MSc in Innovation and Entrepreneurship (Master's in  | Esade Business School (Universitat Ram | `esade.edu` | PARTIALLY_VERIFIED | tuition, deadline |
| N-144 | Executive Master Media Innovation (online) | Breda University of Applied Sciences ( | `buas.nl` | PARTIALLY_VERIFIED | partial detail |
| A-011 | Master in Intelligent Interactive Systems (MIIS) | Universitat Pompeu Fabra (UPF) - Depar | `upf.edu` | UNVERIFIED | tuition, deadline, entry reqs, language |
| A-013 | Màster Universitari en Tecnologies del So i de la Mú | Universitat Pompeu Fabra (UPF) - Music | `upf.edu` | UNVERIFIED | tuition |
| A-027 | Computing and the Arts, M.A. | SRH Berlin University of Applied Scien | `hdpk.de` | UNVERIFIED | tuition, deadline |
| AD-054 | M.A. Medienwissenschaft (Media Studies) - existence  | Humboldt-Universitaet zu Berlin | `hu-berlin.de` | UNVERIFIED | deadline, entry reqs |
| G-087 | Master Intensivo en Posproduccion de Sonido (Intensi | ECAM - Escuela de Cinematografia y del | `ecam.es` | UNVERIFIED | tuition, entry reqs |
| G-088 | Master en Diseno de Sonido Cinematografico (Master's | ECIB - Escola de Cinema de Barcelona | `ecib.es` | UNVERIFIED | tuition, deadline, entry reqs |
| J-112 | Master Universitario en Gestion Empresarial en la In | UNIR - Universidad Internacional de La | `unir.net` | UNVERIFIED | tuition, deadline, entry reqs |
| R-168 | Experto en Luz y Sonido (Expert in Light and Sound) | Universidad San Jorge / CPA Online For | `usj.es` | UNVERIFIED | tuition, deadline |

## How these are treated downstream

Per the tooling rules, **an unverified fact never enters a tracker, a calendar or a
deadline.** These rows appear in the risk section of the Decision Brief and nowhere else
in the working layer — no `.ics` event, no Tracker row with a date that might be wrong.
A blocked source is a known unknown, and a known unknown that silently becomes a calendar
entry is how a cycle gets missed.
