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
