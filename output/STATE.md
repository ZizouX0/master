# Spain Master's Sweep — resume state

**Brief:** `output/BRIEF-original.md` · **Shared agent brief:** `output/AGENT-BRIEF.md`
**Branch:** `claude/new-session-40ht82` · Updated 2026-08-25.

## Where the sweep stands
| Wave | Status |
|---|---|
| 1 Discovery | **DONE** — 19 of 20 slices landed, **970 unique candidates** in `output/raw_candidates.jsonl` |
| RUCT backbone | **DONE** — 1,056 registered titles, 561 active, `output/ruct-backbone.jsonl` |
| RUCT detail | **DONE** — 561 detail pages, 0 errors, `output/ruct-detail.jsonl` |
| 2 Enrichment | round 1 running: 12 agents x 15 = 180 highest-priority candidates |
| 3 Funding | 7 blocks running (all died once to a session limit; relaunched) |
| Enseñanzas Artísticas | running — the register RUCT cannot see |
| 4 Verification | not started |
| 5 QA & assembly | not started |

Candidates per path code: {'?': 6, 'A': 84, 'AA': 192, 'AB': 173, 'AC': 140, 'B': 24, 'C': 82, 'P': 84, 'S': 103, 'X': 152}

## The scale problem, stated plainly
970 candidates x 4 pages each is ~3,880 page fetches. That does not fit one
enrichment round. Round 1 takes the **180** where enrichment most changes the answer
(active official title, core field, corroborated by two discovery axes, real URL).
The remaining **790** are parked in `output/deferred_candidates.jsonl` — parked,
not dropped, and `gaps.md` must say so.

## Hard limits found in this environment (do not re-litigate)
- **20 concurrent subagents.** Waves are sized to it.
- **~200 tool calls per agent**; several wave-1 agents hit it mid-slice.
- **Session-wide usage limit** killed 11 agents at once on 2026-08-24 ~23:40 UTC.
  Agents are now told to write results incrementally rather than hold them.
- **No JS-capable fetch exists here.** Chromium cannot reach the session proxy for ANY
  host. Cloudflare-blocked domains (upf.edu, www.ub.edu, unir.net, il3.ub.edu,
  pointblankmusicschool.com, imep.es, ucjc.edu) are a hard limit, not a retry.
  See `output/logs/blocked-and-redo.md`.

## Corrections to the brief established by evidence
1. **Rule 6 is wrong for one category.** `Máster en Enseñanzas Artísticas` is official and
   absent from RUCT. Three-way distinction now documented in `AGENT-BRIEF.md`.
2. **The 300-ECTS premise is inverted in the business/events fields.** UB/CETT and UOC
   impose bridging credits on non-social-science entrants; no programme yet found grants
   advanced standing for the extra credits. It is an asset in the technical fields only.
3. **Non-EU surcharge is the norm for public universities, not the exception** — confirmed
   at UAM, UPC, UC3M, UB, UAH, UVic. Roughly double in several cases.

## How to resume
1. `ls output/wave2/*.jsonl output/wave3/*.jsonl` — anything present is DONE.
2. Re-dispatch only missing slices; prompts reconstruct from the slice name + `AGENT-BRIEF.md`.
3. `python3 .masters-search/spain/make_wave2_batches.py 15 <N>` for the next enrichment round
   (reads `raw_candidates.jsonl`; re-point at `deferred_candidates.jsonl` for round 2).
4. Then wave 4 verification, then `python3 .masters-search/spain/build_deliverables.py`.

