# ai-agent-skills

General-purpose agent skills in the open [`SKILL.md` standard](https://agentskills.io), with a
dependency-free installer for Windows, macOS and Linux. The skills are written for
[Claude Code](https://claude.com/claude-code) and install into OpenAI Codex, Gemini CLI, Google
Antigravity or any other tool that reads `SKILL.md` folders.

Each skill lives in `skills/<name>/` with a `SKILL.md` and optional `references/` or `scripts/`.
Nothing here depends on another repository.

## Skills (8)

| Skill | What it does |
|---|---|
| `design-prompts` | Structured design prompts for any digital product and design tool: a tool-neutral design system, an app map and per-section briefs, or one focused update brief. |
| `marketing-video` | Factual product videos from real screen recordings: claim-gated timeline, local Remotion render, measured QA and independent frame review. |
| `project-audit` | Evidence-backed audit of a built system on any stack or topology, with a coverage matrix, a remediation backlog and a release assessment. Assessment only. |
| `security` | Secure-by-default coding practices applied while writing code. |
| `security-audit` | Security review and vulnerability research for codebases. Vendored unmodified from [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) and synced daily. |
| `self-healing` | Turns a repeated mistake into a fix in the right skill or guideline. |
| `session-logger` | Appends a structured summary of the session to `session-log.md`. |
| `session-restore` | Restores context from the latest `session-log.md` entry. Pairs with `session-logger`. |

`node scripts/cli.mjs list` prints each skill's one-line description.

## Install

Needs `git` and Node 22+.

```bash
# one line: clone into ~/.ai-agent-skills, link every skill into ~/.claude/skills, turn on daily updates
curl -fsSL https://raw.githubusercontent.com/AhmedAbdelfattah0/ai-agent-skills/main/install.sh | bash

# no clone: copies the skills out of the npx cache
npx github:AhmedAbdelfattah0/ai-agent-skills install
npx github:AhmedAbdelfattah0/ai-agent-skills install session-logger session-restore

# from a clone: links by default, so a git pull is the update
git clone https://github.com/AhmedAbdelfattah0/ai-agent-skills.git
node ai-agent-skills/scripts/cli.mjs install                  # all skills
node ai-agent-skills/scripts/cli.mjs install --target all     # Claude Code, Codex, Gemini CLI, Antigravity

# bash, no Node needed (macOS, Linux, Git Bash, WSL)
./ai-agent-skills/scripts/install.sh --target codex
```

The curl installer takes `AI_AGENT_SKILLS_HOME`, `AI_AGENT_SKILLS_REF`, `AI_AGENT_SKILLS_TARGET`
and `AI_AGENT_SKILLS_NO_AUTOUPDATE=1`. Targets and per-tool notes are in
[docs/install.md](docs/install.md).

## Update

```bash
node scripts/cli.mjs update           # git pull --ff-only, then re-sync every skill it installed
node scripts/cli.mjs update --check   # report what would change; write nothing
node scripts/cli.mjs autoupdate       # is the daily job and SessionStart hook on?
```

`update` never overwrites a copy you edited (`--force`) or a directory it has no record of
installing (`--adopt`), and never deletes a skill unless you pass `--prune`.

## Uninstall

There is no `uninstall` command. The steps (turn off automatic updates, remove only what this
library installed, delete the clone) are in [docs/install.md](docs/install.md#uninstall).

## Living next to the Factory repository

This library was split out of the repository that now holds the ticket-delivery Factory
(`ship-ticket`, `vapt` and their companions). The two install side by side on one machine: each has
its own clone directory, manifest, CLI name, scheduled-job label and SessionStart hook entry. See
[docs/coexistence.md](docs/coexistence.md).

### Optional companions

`project-audit` routes some judgments to specialists that ship in that separate repository
(`code-quality`, `test-quality`, `docs-accuracy`, `vapt`; `generate-ticket` and `ship-ticket` for
follow-up work), and `marketing-video` follows `ship-ticket`'s cross-model method. Both name these
as optional companions. When a companion is not installed, each skill uses the fallback it
documents and marks that coverage `DEGRADED`.

## Contributing

Add `skills/<name>/SKILL.md` whose frontmatter `name:` equals the folder name and has a
`description:`, then run `node scripts/cli.mjs validate` (CI runs the same check). The rules are in
[AGENTS.md](AGENTS.md).

## License

`package.json` declares MIT. `skills/security-audit` carries its upstream license
(`skills/security-audit/LICENSE`).
