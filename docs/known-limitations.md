# Known limitations

- **`install` replaces same-named entries without a prompt or backup.** This covers `cli.mjs install`,
  `scripts/install.sh` (`rm -rf`) and the curl installer, and is inherited from the Factory installer.
  `update` does check ownership. The install-collision tests went with the retired-alias tests. The
  pre-flight check and backup are in [install.md](install.md#before-you-install).
- **npm names are taken by others.** The npm packages `ai-agent-skills` and `ai-skills` belong to
  other publishers. This repository is never published to npm: use
  `npx github:AhmedAbdelfattah0/ai-agent-skills`, a clone, or the curl installer.
- **Vendored-skill sync pushes straight to `main`.** `.github/workflows/sync-external.yml` runs on a
  daily cron with the default `GITHUB_TOKEN` and `contents: write`. When cloudflare/security-audit-skill
  changes upstream, it commits the vendored copy to `main` after `cli.mjs validate` only: no test suite
  and no pull request.
  - The synced content includes executable `.cjs` validators and agent instructions. It reaches every
    linked install through `git pull --ff-only`, because `main` is also the self-update release
    channel. Branch protection on `main` would block the bot's push.
  - The workflow has no fork guard.
  - `scripts/sync-external.mjs` copies upstream symlinks as symlinks, with no containment check.
  - The actions are pinned by tag (`@v4`), not by commit SHA.

  All of this is carried over unchanged from the source repository and is a documented supply-chain
  trust point.
- **`scripts/import.sh` copies every real-directory skill** from `~/.claude/skills` that is not
  already in `skills/` into the repository. That can include private or third-party skills, one
  `git add -A` away from being published. Review `git status` before committing after running it.
- **The `--force` hint can mislead.** When `update` skips a foreign or dangling link, its closing
  line can suggest re-running with `--force` (`scripts/cli.mjs`, the "up to date except for the
  skipped skill(s)" message). `--force` does not act on such links: a foreign link is never touched,
  and a dangling one needs `--prune` (or `--adopt` when unrecorded).
- **Dormant alias code.** `RETIRED_SKILLS` in `scripts/cli.mjs` is empty, so the successor/alias
  handling in `install` and `update` never runs here. It is kept unchanged from the shared installer.
- **Retired-vocabulary rule removed.** The unscoped `GATE [12]` term was dropped with the Factory-only
  terms. No file here uses it, so this has no effect today.
- **Limits of the pre-publication coexistence check** (a scratch script kept outside this repository,
  run against the Factory repository in one scratch HOME):
  - it checked only `~/.claude/skills`;
  - updates ran only as `update --check` and `update --no-pull`;
  - the manifests' `skills` and `source` fields were not compared;
  - the scheduler labels (launchd, systemd, schtasks) were verified by reading the code, not by
    installing jobs.
