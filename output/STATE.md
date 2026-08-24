# Spain Master's Sweep — resume state

**Brief:** `output/BRIEF-original.md` (as uploaded). **Shared agent brief:** `output/AGENT-BRIEF.md`.
**Branch:** `claude/new-session-40ht82`.
**Started:** 2026-08-24.

## Prior work in this repo that this sweep builds on
`.masters-search/results/master-all.json` holds 1,839 opportunities from earlier
Europe-wide sweeps (Jul-Aug 2026), of which **132 are Country==Spain**, distributed:
Music business 54 · Other/adjacent 27 · Sound design/production 26 ·
Acoustics/audio engineering 23 · Music & sound technology 1 · Funding scheme 1.

Those records are **seed candidates only** for this sweep. They predate this brief's schema
and carry NONE of its starred fields — no RUCT code, no rate-year on fees, no non-EU
surcharge, no 300-ECTS credit-recognition check, no 2027 application window. They must be
re-enriched and re-verified, not copied.

Fields **AA (AI/ML), AB (data science), AC (cloud/DevOps), X (business analytics)** are
entirely absent from the prior work — genuinely new ground.

## Concurrency
Hard cap of **20 concurrent subagents** in this environment. Waves are sized to it.

## Wave status
| Wave | Agents | Status | Output |
|---|---|---|---|
| 1 Discovery | 20 (9 field + 9 institution + 2 registry) | LAUNCHED 2026-08-24 | `output/wave1/*.jsonl` |
| 2 Enrichment | ~12 | pending wave 1 | `output/wave2/*.jsonl` |
| 3 Funding | 8 (blocks 1-8) | pending free slots | `output/wave3/*.jsonl` |
| 4 Verification | ~10 | pending wave 2 | `output/wave4/*.jsonl` |
| 5 QA & assembly | 3 sequential | pending | `output/` deliverables |

## Deviation from the brief, recorded deliberately
Brief §5 says funding (wave 3) is a later wave. Funding blocks 1-4 and 6-8 are split by
funding source, not by programme, so they have **no data dependency on wave 1** and are run
as soon as slots free. Block 5 (university-internal schemes) genuinely does depend on having
a shortlist and is held until then.

## How to resume if this session dies
1. Read this file, then `ls output/wave*/` to see which slices landed.
2. Every `.jsonl` already on disk is DONE — do not re-run that slice.
3. Re-dispatch only the missing slices; the prompts are reconstructable from the slice names
   plus `output/AGENT-BRIEF.md` and the original brief's §3, §5, §7, §8.
4. Then run waves 4 and 5 and build the §9 deliverables.
