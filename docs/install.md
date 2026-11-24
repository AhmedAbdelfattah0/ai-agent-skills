# Install, update and uninstall

All commands below use `node scripts/cli.mjs` from a clone. After `npm link` in the clone, the same
commands are available as `ai-agent-skills <command>`. `npm link` links this clone and does not
download anything. Through npx they are `npx github:AhmedAbdelfattah0/ai-agent-skills <command>`.

**Never run a bare `npx ai-agent-skills` or `npm i -g ai-agent-skills`.** The npm package of that
name belongs to another publisher; the Factory repository's `ai-skills` name is also taken on npm by
someone else. This repository is never published to npm. The supported installs are
`npx github:AhmedAbdelfattah0/ai-agent-skills`, a git clone, and the curl installer.

## Before you install

`install` writes each skill under its folder name into the target directory. If an entry of that
name already exists, it is replaced without a prompt or a backup:
- `cli.mjs` moves it aside and deletes it once the new one is in place;
- `scripts/install.sh` runs `rm -rf` on it;
- the curl installer runs `install` unprompted.

This behaviour is inherited from the Factory installer. Only `update` checks ownership: it leaves
alone what it did not install. The tests that covered install collisions were removed with the
retired-alias tests: `scripts/cli.test.mjs` has 31 `test(` call sites here, against 68 in the
Factory's.

Check each target directory first, and back it up if anything is listed:

```bash
DEST="$HOME/.claude/skills"      # repeat for ~/.agents/skills, ~/.gemini/skills, ~/.gemini/config/skills
for n in design-prompts marketing-video project-audit security security-audit self-healing session-logger session-restore; do
  p="$DEST/$n"
  if [ -L "$p" ]; then echo "WILL REPLACE link $n -> $(readlink "$p")"
  elif [ -e "$p" ]; then echo "WILL REPLACE real directory $n"
  fi
done
cp -RP "$DEST" "$DEST.bak-$(date +%Y%m%d%H%M%S)"   # backup; -P keeps links as links
```

The list is the eight skills in the README; from a clone, `ls skills` gives the same names.

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
locked, throttled to once an hour, and ignores `--force`, `--adopt` and `--prune`. It prints nothing.

It is not passive:
- it runs `git pull --ff-only` in the clone;
- it installs skills newly added upstream when you installed the whole library;
- it refreshes untouched copies;
- it rewrites `.ai-agent-skills-manifest.json`.

Its lock, last-run stamp and log live under `~/.local/state/ai-agent-skills/<key>/`
(`$XDG_STATE_HOME`, or `%LOCALAPPDATA%` on Windows).

## Uninstall

There is no `uninstall` command. For the default curl install (symlinks into
`~/.ai-agent-skills`, target `claude`):

```bash
CLONE="$(cd "$HOME/.ai-agent-skills" && pwd -P)"; DEST="$HOME/.claude/skills"   # real path
node "$CLONE/scripts/cli.mjs" autoupdate --remove        # daily job + SessionStart hook
for l in "$DEST"/*; do                                   # only links whose real target is in this clone
  [ -L "$l" ] && case "$(cd "$l" 2>/dev/null && pwd -P)" in "$CLONE/skills/"*) rm "$l" ;; esac
done
rm -f "$DEST/.ai-agent-skills-manifest.json"
rm -rf "$CLONE"
rm -rf "${XDG_STATE_HOME:-$HOME/.local/state}/ai-agent-skills"   # lock, last-run stamp, update.log
```

Repeat the loop for every target directory you installed into. Links are compared by real path, so
the loop also works when `HOME` itself is a symlink. It removes only links that resolve into this
clone, so links another library installed stay. A link whose target no longer exists is not
removed; delete it by hand. On Windows the state directory is
`%LOCALAPPDATA%\ai-agent-skills`. For a copy install (npx or
`--copy`), delete the directories named under `skills` in `.ai-agent-skills-manifest.json`, then the
manifest; check first that each one is still this library's copy, since a folder of the same name
may since have been installed by another library.

## Bash installer

`scripts/install.sh` mirrors `install` for macOS, Linux, Git Bash and WSL without Node. It writes no
manifest, so a copy made with it needs `update --force` once; symlink installs are unaffected.
`scripts/package.sh` builds `dist/<name>.skill` zip archives and `scripts/import.sh` folds skills
already installed in `~/.claude/skills` back into the repository.
