# Spring / mid-year intake sweep — shared instructions

Read `/home/user/master/output/AGENT-BRIEF.md` FIRST for the candidate profile, the evidence
rules, the RUCT tooling and the blocked-domain list. This file adds only what is specific to
this question.

## The question
**Which master's programmes in Spain admit a cohort that STARTS between January and June,
rather than the September/October norm?** For each: the exact start month/date, how many
intakes a year, and the application deadline for that spring intake.

Why it matters: the candidate targets September 2027. A February or April 2027 start would
let them begin **six to eight months earlier**; a February 2028 start is a fallback if a 2027
autumn application fails. Both change the plan materially.

## Scope
The nine fields from the main brief (A sound/music computing · B MIR/AI-for-music ·
C signal processing/acoustics · AA artificial intelligence · AB data science ·
AC cloud/DevOps · X business analytics · P music industry · S events/live).
Include BOTH `máster universitario` and `título propio` — flag which, per the three-way
distinction in the main brief.

## What counts, and what does not
✅ **Counts:** a genuine second cohort starting Jan–Jun (e.g. IE's 9 February and 20 April
starts; VIU's April intake; UCJC's February online intake).
❌ **Does NOT count:** rolling admission with a single autumn start · an application window
that merely opens in spring · a January application deadline for a September start ·
"segundo cuatrimestre" module entry that is not a real cohort start.

That distinction is the whole job. Many pages advertise "several convocatorias" meaning
application rounds, not start dates. **Read for the START DATE, not the deadline.**

## Vocabulary
`inicio febrero` · `inicio enero` · `convocatoria de febrero` · `segunda convocatoria` ·
`doble convocatoria` · `inicio abril` · `matrícula de primavera` · `spring intake` ·
`February start` · `January intake` · `dos convocatorias al año` · `inicio: octubre y febrero` ·
`edición de primavera` · Catalan `inici febrer`, `matrícula de primavera`.

## Output — append AS YOU GO, one JSON per line
Write to the file named in your prompt. Never batch writes to the end: session limits have
repeatedly killed agents holding finished work.

{"institution":"","programme_name":"","path_codes":[],"official_status":"","ruct_code":"",
 "spring_intake":"YES|NO|NOT FOUND","start_date_verbatim":"","start_month":"",
 "intakes_per_year":"","other_intakes":"","application_deadline_for_spring_intake":"",
 "modality":"","language_of_instruction":"","tuition_total_eur":"","url":"",
 "evidence_verbatim":"","notes":"","sources":[{"field":"","url":"","accessed":"YYYY-MM-DD"}]}

**Record NO as well as YES.** A checked institution that runs only one autumn intake is a
useful result and stops the next pass re-checking it. `NOT FOUND` where the page does not
say. Never infer a spring intake from the existence of a spring application round.
