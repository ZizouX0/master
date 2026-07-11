# Installed Skills

This repository has **60 agent skills** installed from `skills-lock.json` using the
[`skills`](https://www.npmjs.com/package/skills) CLI (`npx skills experimental_install`).

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
