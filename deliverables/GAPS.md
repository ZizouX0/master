# GAPS — what this sweep does not know
**Built 2026-08-22. 197 programmes · 139 funding schemes · 21 agents across four waves.**

Written so that a follow-up run knows exactly where to start, and so that nothing below is
mistaken for a fact. **Honest gaps beat false completeness** — the whole sweep was run on that rule.

---

## 1. The single most important unknown

### UPF Barcelona is unread, and it is probably the best programme in the dataset
`upf.edu` returned **HTTP 403 to every method** — the fetch tool, `curl` with full browser headers,
a text proxy, the English mirror, `mtg.upf.edu`, even `robots.txt`. The Internet Archive is
egress-blocked from this environment. Two separate verification waves failed, and so did the
orchestrator directly, across five UPF hosts.

UPF hosts the **Music Technology Group**. Its **Master in Sound and Music Computing** is, on every
description outside its own site, the closest thing in Europe to a degree built for a software
engineer who wants to work in music. Its **tuition, its 2027 deadline, and its access-profile list
are all unknown.**

**Do this first, by hand, in a normal browser.** It could displace the #2 entry on the shortlist.
Also unread at UPF: the Master in Intelligent Interactive Systems (A-011).

---

## 2. Blocked sources — 15 rows, 13 domains

Full list with what is unread per row: **`research/BLOCKED_SOURCES.md`**.
Each was attempted at least three ways. Notable beyond UPF:

| Domain | Row | Consequence |
|---|---|---|
| `tilburguniversity.edu` | AC-036/037 | Fee recovered from the institutional PDF, but a reported **12-ECTS marketing prerequisite** is unread — if real it flips the row to `no`. |
| `unir.net` | J-112 | 403 across five regional mirrors. May be Spain's only *official* music-business master. Also 100% online, which likely fails the visa test regardless. |
| `hu-berlin.de` | AD-054 | Anubis proof-of-work wall. Its `tuition = 0` is an inference from Berlin practice, **not a read fact**. |
| `ecam.es`, `ecib.es`, `usj.es`, `hdpk.de`, `esade.edu`, `enti.cat`, `sontic.es` | 7 rows | Prices and entry text unread. |

---

## 3. Field-level holes across all 197 rows

| Field | TBC | Why it matters |
|---|---|---|
| `scholarship_names` | **95** | Wave 2 catalogued funding by *region*, not by *programme*. The join is partial — a programme showing `none_found` often means "not yet matched", not "no money exists". **Do not read `none_found` as a negative finding.** |
| `intake_2027_confirmed` | **74** | Most institutions had not published 2027 cycles when swept. Dates marked "2026 cycle — 2027 TBC" are *comparators*, never commitments. |
| `application_deadline` | 53 | Same cause. |
| `english_level_required` | 38 | Matters because no test has been sat yet; the spread runs B1 to TOEFL 100. |
| `tuition_non_eu_eur_per_year` | 33 | Concentrated in private academies that publish no prices at all — a red flag in itself. |

---

## 4. Thin paths, and one that does not exist

- **Path R (Live Sound & Event Systems) — no viable master's exists in scope.** The Netherlands has
  none (AHK stops at bachelor; everything else is MBO niveau 4). Spain has none (vocational CFGS or
  private certificates only). BHT Berlin's M.Eng. is real, accredited and free — and admits
  **summer semester only**, so September 2027 is impossible. This is a settled negative, not thin data.
- **Path H (Immersive/Spatial) — 20 rows, mostly tracks rather than degrees.** The genuine
  full-degree options reduce to TU Berlin and the Sonology double degree.
- **Andalusia has no music provision at all.** The keyword *SONIDO* returns **zero** results across
  the entire regional catalogue — 208 masters, 41 programme pages opened. Andalusia offers price and
  access, never subject.
- **Berlin has zero Erasmus Mundus partners.** EMJM and Berlin are alternative strategies, not
  combinable.

---

## 5. Known unresolved conflicts

| Row | The conflict |
|---|---|
| **AC-035 RSM Rotterdam** | The same page states €25,800 (non-EEA) in its fee chip and *"approximately €15,200 for non-EEA students"* for 2027-28 in its text. €10,600 apart, in your own intake year. |
| **N-151 EIT Digital** | *Resolved* — logged here because the resolution reversed a Wave 1 verdict. Waivers are open to all nationalities; only the living-allowance award is EU-only. |
| **AND-002 UGR acoustics** | Programme page still cites the superseded Decreto 329/2010 (€27.60/credit). The current decree gives €13.68. The stale figure is on the university's own site. |
| **L-125 / AD-059 RUG** | The URL serves a different track than its title claims; the named track is absent from RUG's current list of six. Rename, absorption or replacement — undetermined. |
| **AD-053 Macromedia** | No "Medienmanagement" master exists; the catalogue names **M.A. Digital Media Business**. Refilled from the real programme but flagged as a different degree. |

---

## 6. What a follow-up run should chase, in order

1. **UPF Barcelona, by hand.** Two programmes, twenty minutes, potentially the top of the shortlist.
2. **Re-sweep the EACEA Erasmus Mundus catalogue in October 2026.** An aggregator reports **37 new
   EMJM projects selected 16 July 2026** for September 2027 starts. The official catalogue listed
   only selection years 2017–2025 when checked, so this could not be confirmed — but if true, the
   2027 field is materially larger than anything recorded here.
3. **Join Wave 2 funding onto Wave 1 programmes properly.** 95 rows lack scholarship names while 139
   schemes sit un-joined in `research/wave2/`. This is the largest single quality win available.
4. **Andalusian scholarships were never investigated** — the sweep there was fee-focused by design.
   At €821 tuition the marginal value is low, but living costs are not zero.
5. **The 11 remaining `unclear` Spanish schemes** (of 46) — Spain's funding picture is the least
   resolved of the four regions, with only MAEC-AECID confirmed open at full+stipend.
6. **Email, do not re-scrape:** UV Valencia (is the non-EU rate €2,120 or €4,240? — one email
   settles whether it is the cheapest official master in the sweep), Tilburg's marketing
   prerequisite, and RUG on whether a 300-ECTS engineering diploma counts as "closely related".

---

## 7. Method limits worth stating plainly

- **Aggregator error is real and quantified.** Mastersportal listed €19,448 for a programme whose
  official rate is €23,030. Every figure here comes from an institution's own domain; none was taken
  from an aggregator.
- **`accepts_engineering_bachelor` changed on roughly 40% of rows during verification** — 15 of 34 in
  one slice, 13 of 33 in another. Any eligibility claim sourced from Wave 1 alone should be
  distrusted; the field is only reliable post-verification.
- **Three agents were killed mid-task by API session limits**, two before writing anything. Later
  agents checkpointed every five rows. Nothing in the final dataset comes from a truncated run.
- **The ranking orders candidates; it does not choose them.** Its first output put a suspended
  Erasmus Mundus, a film academy awarding no degree, and a five-month private course in the top five,
  and sixteen generic Spanish CS masters above every music programme in the sweep. Both were fixed —
  a viability gate the score cannot override, and path weights modulated by actual audio evidence —
  but the episode is the argument for reading `SHORTLIST.md`'s four strategies rather than the raw
  score column.
