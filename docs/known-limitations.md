# Known limitations

- **Vendored-skill sync pushes straight to `main`.** `.github/workflows/sync-external.yml` runs on
  a daily cron with the default `GITHUB_TOKEN` and `contents: write`. When cloudflare/security-audit-skill
  changes upstream, it commits the vendored copy to `main` after `cli.mjs validate` only. It does not
  run the test suite and opens no pull request. Its actions are pinned by tag (`@v4`), not by commit
  SHA. This behaviour is carried over unchanged from the source repository and is a documented
  supply-chain trust point: upstream content reaches installs through `update`.
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
