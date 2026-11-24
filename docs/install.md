# Install, update and uninstall

All commands below use `node scripts/cli.mjs` from a clone. After `npm link` in the clone the same
commands are available as `ai-agent-skills <command>`; through npx they are
`npx github:AhmedAbdelfattah0/ai-agent-skills <command>`.

## Targets

`SKILL.md` is an open standard, so the same folders work in every tool below; only the directory
differs. Pick it with `--target` (comma-separated) or `--dest <path>`.

| Target | Directory | Tool |
|---|---|---|
| `claude` (default) | `~/.claude/skills` | Claude Code |
| `codex`, `agents` | `~/.agents/skills` | OpenAI Codex and other standard-compliant tools |
| `gemini` | `~/.gemini/skills` | Gemini CLI (also reads `~/.agents/skills`) |
| `antigravity` | `~/.gemini/config/skills` | Google Antigravity (global skills) |
| `all` | all four of the above | |

From a clone, skills are symlinked (directory junctions on Windows), so a `git pull` or an edit is
live at once. From npx they are copied, because the npx cache is deleted between runs. `--copy` and
`--link` override the default.

## The curl installer

`install.sh` clones (or fast-forwards) the repository into `~/.ai-agent-skills`, links every skill
into the target directories, and turns on automatic updates. It refuses a directory that is not a
clone of this repository, a clone with uncommitted changes, and a Node older than 22.

| Variable | Default | Meaning |
|---|---|---|
| `AI_AGENT_SKILLS_HOME` | `~/.ai-agent-skills` | where the clone lives |
| `AI_AGENT_SKILLS_REF` | `main` | branch or tag to install |
| `AI_AGENT_SKILLS_TARGET` | `claude` | targets, as for `--target` |
| `AI_AGENT_SKILLS_NO_AUTOUPDATE` | unset | `1` installs without scheduling anything |

## Update

```bash
node scripts/cli.mjs update             # pull the source, then re-sync every skill it installed
node scripts/cli.mjs update --check     # what would change; writes nothing
node scripts/cli.mjs update --no-pull   # re-sync from the checkout as it stands
node scripts/cli.mjs update --prune     # also remove skills deleted upstream
```

`install` writes `.ai-agent-skills-manifest.json` beside the skills it installs: the source, its git
remote, the commit and a content hash for each copy. `update` uses it to tell a stale copy (refreshed)
from one you edited (left alone until `--force`) and from a directory it never installed (left alone
until `--adopt`). A manifest written by another library is never trusted. The source refresh is
`git pull --ff-only` from a clean checkout with an upstream; otherwise `update` says why and re-syncs
from the checkout as it stands.

### Automatic updates

```bash
node scripts/cli.mjs autoupdate             # status
node scripts/cli.mjs autoupdate --install   # daily job + Claude Code SessionStart hook
node scripts/cli.mjs autoupdate --remove    # turn both off
```

The daily job is a launchd agent `com.ai-agent-skills.update` (macOS), a systemd user timer
`ai-agent-skills-update` (Linux) or a scheduled task `AI Agent Skills Update` (Windows). The hook is
a SessionStart entry in `~/.claude/settings.json` that runs this clone's `scripts/cli.mjs update
--auto`. `--job-only` and `--hook-only` limit either flag to one of the two. An `--auto` run is
locked, throttled to once an hour, ignores `--force`, `--adopt` and `--prune`, and writes only to its
log under `~/.local/state/ai-agent-skills/` (`%LOCALAPPDATA%` on Windows).

## Uninstall

There is no `uninstall` command. For the default curl install (symlinks into
`~/.ai-agent-skills`, target `claude`):

```bash
CLONE="$HOME/.ai-agent-skills"; DEST="$HOME/.claude/skills"
node "$CLONE/scripts/cli.mjs" autoupdate --remove        # daily job + SessionStart hook
for l in "$DEST"/*; do                                   # only links that point into this clone
  [ -L "$l" ] && case "$(readlink "$l")" in "$CLONE/skills/"*) rm "$l" ;; esac
done
rm -f "$DEST/.ai-agent-skills-manifest.json"
rm -rf "$CLONE"
```

Repeat the loop for every target directory you installed into. For a copy install (npx or
`--copy`), delete the directories named under `skills` in `.ai-agent-skills-manifest.json`, then the
manifest. Links and folders that another library installed are left alone either way.

## Bash installer

`scripts/install.sh` mirrors `install` for macOS, Linux, Git Bash and WSL without Node. It writes no
manifest, so a copy made with it needs `update --force` once; symlink installs are unaffected.
`scripts/package.sh` builds `dist/<name>.skill` zip archives and `scripts/import.sh` folds skills
already installed in `~/.claude/skills` back into the repository.
