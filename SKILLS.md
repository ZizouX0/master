# Installed Skills

This repository has **71 agent skills** installed from `skills-lock.json` using the
[`skills`](https://www.npmjs.com/package/skills) CLI (`npx skills experimental_install`).

## Grad-school application kit (`jurgendn/agent-skills`)

Added to help **search for and apply to a master's / research program** — find
fitting programs and supervisors, reach out, and build the application package:

| Skill | Use |
| --- | --- |
| `flow-phd-application` | Orchestrator — sequences the whole application, entry at your current stage |
| `apply-profile-reader` | Turn your CV/transcripts/writeups into one structured profile |
| `apply-program-fit-mapper` | Shortlist programs, labs, and faculty that fit your interests |
| `apply-research-direction-mapper` | Turn interests into searchable research themes |
| `apply-motivation-keeper` | Pin down the "why" before writing anything |
| `apply-cv-builder` | Build an academic CV |
| `apply-sop-writer` | Statement of purpose / motivation letter |
| `apply-cold-email-drafter` | Cold-email professors / prospective supervisors |
| `apply-recommendation-letter-strategist` | Plan and brief your recommenders |
| `apply-dossier-evaluator` | Eligibility + scholarship-fit (DAAD/Fulbright/Erasmus/MSCA) |
| `apply-package-auditor` | Final consistency check before submitting |

These pair with skills you already have: `firecrawl-*` (find programs, extract
requirements/deadlines), `xlsx` (track & compare programs), `pdf` (fill
application forms), and `docx` (final documents).

## Layout

- **`.agents/skills/<name>/`** — canonical store. Full skill contents (SKILL.md,
  scripts, references, assets, LICENSE) live here.
- **`.claude/skills/<name>`** — symlinks into the canonical store so Claude Code
  discovers each skill as a project skill.
- **`skills-lock.json`** — pins each skill's `source`, `skillPath`, and a
  `computedHash` (SHA-256 over the sorted `relativePath + fileContent` of every
  file in the skill folder).

## Verification

Every installed skill was verified to:

- have valid YAML frontmatter with `name` + `description` (60/60),
- contain all bundled files it references (scripts/references present),
- byte-compile cleanly for every Python script (72/72),
- contain only valid JSON,
- match its `computedHash` in `skills-lock.json` using the tool's own hash
  algorithm (60/60).

## Sources

| Source | Skills |
| --- | --- |
| `obra/superpowers-skills` | 31 |
| `anthropics/skills` | 17 |
| `firecrawl/cli` | 10 |
| `vercel-labs/skills` | 1 (`find-skills`) |
| `vercel-labs/agent-skills` | 1 (`web-design-guidelines`) |

## Note on version drift

`experimental_install` fetches current upstream content (the lockfile pins content
hashes, not commit SHAs). Six skills had been updated upstream since the original
lockfile was created; the install pulled the newer content and refreshed those
hashes in `skills-lock.json`:

`claude-api`, `find-skills`, `firecrawl`, `firecrawl-monitor`, `firecrawl-scrape`,
`frontend-design`.

The other 54 skills match their originally pinned hashes exactly.

## Managing skills

```bash
npx skills list                    # list installed skills
npx skills update                  # update to latest upstream versions
npx skills experimental_install    # restore from skills-lock.json
```
