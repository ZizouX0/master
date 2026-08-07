# Master's Search — Resume State

**Purpose:** if this session dies (usage limit, container reclaim), a fresh Claude session
can resume from here without losing work.

## Mission
Run the exhaustive master's-program + scholarship sweep defined in the uploaded prompt
(profile: Tunisian software-engineering grad, tracks = sound/music-tech + music-business,
career goal = international DJ/producer, fully-funded preferred, Sept-2027 intake).
Deliverables: `opportunities.csv` (17 columns), ranked shortlist (12–15), action timeline,
could-not-verify list.

## Running workflows (this session)
| Run | Script | Run ID | Status |
| --- | --- | --- | --- |
| Main sweep (33 discovery agents: 8 funding + 5 tracks + 20 regions incl. every EU country) | `.masters-search/workflow.mjs` | `wf_115032de-39e` | running |
| Deep-Europe supplement (NL standalone, ES/PT local-language, pan-EU directories, tuition-free, foundations) | `.masters-search/workflow2-europe-deep.mjs` | `wf_f2cf9994-a1a` | running |

Journal transcripts live in
`/root/.claude/projects/-home-user-master/8f162b98-27f5-5264-a4b4-07668aac85f1/subagents/workflows/<run-id>/journal.jsonl`
and are **snapshotted into `.masters-search/checkpoints/` in this repo** by the
checkpoint loop, so partial results survive even if the container dies.

## How to resume in a NEW session
1. Read this file and the newest snapshots in `.masters-search/checkpoints/`.
2. Each `journal.jsonl` line with `"type":"result"` holds a completed agent's
   opportunities — parse those; that work is DONE, do not redo it.
3. If a workflow did not finish: same-session resume is impossible in a new session,
   so re-run only the MISSING slices — compare completed agent labels in the journal
   against the slice lists in the two workflow scripts, and author a continuation
   workflow with just the missing slices (same schemas/prompts, they're in the scripts).
4. Then: merge + dedup all opportunities from both runs, build `opportunities.csv`
   (+ xlsx + shortlist + timeline + could-not-verify list), commit and push.

## Environment to restore in a new session
- Firecrawl: `npm install -g firecrawl-cli@1.19.6`, then upgrade the NESTED axios
  (`cd $(npm root -g)/firecrawl-cli/node_modules/firecrawl && npm install axios@^1.18.1`)
  or requests fail with 405 via the agent proxy. Auth: user has a key (ask user;
  it is deliberately NOT stored in this repo). ~996/1000 credits remained.
- Skills: 71 installed under `.agents/skills/`, linked in `.claude/skills/`,
  verified against `skills-lock.json` (see SKILLS.md).

## Progress log
- 2026-07-11: 71 skills installed+verified+pushed. Both workflows launched.
  Checkpoint loop started (every 5 min → `.masters-search/checkpoints/`, auto-commit+push).
- 2026-07-11 ~18:40: SESSION USAGE LIMIT hit mid-run. Phase-1 results salvaged:
  **183 unique opportunities** saved to `.masters-search/results/phase1-opportunities.json`.
  - Main sweep `wf_115032de-39e` — COMPLETED slices: em-arts, em-cs-biz, daad, france,
    uk, usa, nl-au-nz, other-gov, t-smc (9/33). FAILED (need re-run): t-prod,
    t-acoustics, t-musicbiz, t-mba, and ALL 20 region slices, ALL verification batches.
  - Deep-Europe `wf_f2cf9994-a1a` — COMPLETED: nl-deep, es-deep, pt-deep,
    eu-directories (4/6). FAILED: eu-tuitionfree, eu-foundations, all verification.
- 2026-07-12 01:26: limit reset confirmed; resuming both workflows with
  resumeFromRunId (cached slices replay free; failed slices run live).

- 2026-07-13 23:0x: SEARCH COMPLETE. Both workflows 100% done (0 errors). 546 unique opportunities (272 Verified, 269 Partial, 5 Unverified; 121 fully-funded). FINAL DELIVERABLES built in ./deliverables/ (opportunities.csv/.xlsx/.json, SHORTLIST.md, ACTION-TIMELINE.md, COULD-NOT-VERIFY.md, README.md). Delivered to user.

---

## Europe gap sweep (workflow5) — status as of 7 Aug 2026

**Run ID:** `wf_c9f776ea-31d` · script `.masters-search/workflow5-europe-gapfill.mjs`
**Banked:** `.masters-search/results/europe-gapfill.json` — 85 records, 26 countries, 9 verified.

**DISCOVERY IS COMPLETE.** All 13 slices ran. Nothing outstanding on the search.

**OUTSTANDING: verification of the 76 unverified records.**
Blocked by the WEEKLY usage limit, which resets **15:00 UTC on Friday 8 August 2026**.

To resume after that time:
```
Workflow({scriptPath: '.masters-search/workflow5-europe-gapfill.mjs',
          resumeFromRunId: 'wf_c9f776ea-31d'})
```
All 13 discovery agents replay from cache for free; only the verify batches run.
Outstanding batches: fr-deep-1, uk-ie-deep-1/2, nordic-1/2, baltic-1, poland-cz-sk-1/2,
hu-ro-bg-1/2, balkans-1, at-ch-lu-1, benelux-public-1, med-1/2, iberia-it-public-1/2, east-1.

Then re-bank and rebuild:
```
python3 .masters-search/build_gapfill_workbook.py      # -> results/europe-gapfill.xlsx
```
(the bank step is the journal-extraction snippet used throughout: read every `type=="result"`
line, walk for dicts with both `program` and `institution`, dedupe on
(institution[:60], program[:60]) preferring records that carry `valueVerdict`).

**Also still outstanding:** verification of the private-schools dataset
(`private-es-pt-nl-it.json`, run `wf_800ea13c-692`) — 5 of 114 verified.

**Lesson worth keeping:** the workflow's own return value is not trustworthy for counts.
It reported "103 CONDITIONAL" when only 5 records had actually been verified (the rest were
the pipeline's fallback label), and its `byType` counted 15 private because it matched the
substring "priv" anywhere in a field that often reads "PUBLIC ... not a private institution".
Always re-derive counts from `journal.jsonl`.
