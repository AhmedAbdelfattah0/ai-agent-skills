# Changes from the Factory repository

This library was split out of `AhmedAbdelfattah0/AI-Skills` at commit `bb6c054`.

- **Skills.** The eight skill folders, `external-skills.json`, `scripts/sync-external.mjs` and
  `.github/workflows/sync-external.yml` keep their history (git-filter-repo `--path`). At the split
  commit, every skill tree is byte-identical to `bb6c054:skills/<name>`, except for the one scrubbed
  line in `marketing-video` (next item). The commits after the split
  list every later edit.
- **Scrubbed history.** Before publication, a second git-filter-repo pass (`--replace-text`,
  `--replace-message`) replaced a private project name with "a private project" and a private ticket
  key with `TICKET-108`. This touched one line of `skills/marketing-video/SKILL.md` in the preserved
  file versions, one preserved commit message, and two lines of the verbatim tooling commit (a
  `cli.mjs` comment and a `cli.test.mjs` string; both lines are removed by the adaptation commit).
  Commit counts, authors, dates and every other byte are unchanged. Commit SHAs therefore differ
  from the source, and at the split commit `skills/marketing-video` differs from `bb6c054` by that
  one line. [SOURCE-MAP.md](SOURCE-MAP.md) maps every preserved commit to its source commit.
- **Tooling.** Commit `chore: import the shared installer tooling verbatim` copies the installer
  files byte-for-byte from `bb6c054`, apart from the scrubbed ticket key: commit `07257e0` differs from
  `bb6c054` only by `TICKET-108` → `TICKET-108` in two lines. The commit after it is the whole adaptation, so
  `git diff <verbatim> <adapted> -- scripts install.sh package.json .gitattributes` reproduces the
  list below. Anything not listed is unchanged.

## scripts/cli.mjs

| Line (source) | Change | Why |
|---|---|---|
| 5, 7 | header usage: `npx github:AhmedAbdelfattah0/ai-agent-skills`, bin `ai-agent-skills` | identifier |
| 170 | `MANIFEST = '.ai-agent-skills-manifest.json'` | identifier |
| 233 | state directory `<state>/ai-agent-skills/<key>` | identifier |
| 503-509 | `RETIRED_SKILLS` map emptied (`angular-code-quality`, `backend-code-quality` → `code-quality` removed); comment reworded. The successor mechanism that reads the map is unchanged. | Factory-only |
| 529 | comment: drops the `(code-quality)` example | Factory-only wording |
| 865 | comment example `security -> <repo>/skills/vapt` becomes `.../security-audit` | Factory-only wording |
| 1034, 1100 | staging directory `.ai-agent-skills-tmp` (both places) | identifier |
| 1199-1278, 1287-1316, 1331, 1453-1460 | validator check 8 removed: `RULE_ID_OWNERS`, `RULE_ID_DEFINING_FILES`, `RULE_ID_RE` and its helpers, `collectRuleDefinitions`, `undefinedCitations`, and the per-skill loop that reported undefined `BE/NG/TEST/DOC/VAPT` citations. Its owner skills are not in this library; emptying the owner table instead would have left a regex with an empty alternation. `skillDocs()` is kept unchanged. | Factory-only |
| 1418-1419 | comment on check 6 no longer cites ship-ticket | Factory-only wording |
| 1465-1466 | the library-level outcome-vocabulary rule changes from "exactly one owner" to "at most one owner". The only owner was `ship-ticket/references/ship.md`; no skill here defines one. The per-skill check (a defining file must list PASS, FAIL, NOT_TRIGGERED, NOT_APPLICABLE, DEGRADED; one owner per skill) is unchanged. | Factory-only |
| 1471-1474 | comment on the guidance-file check no longer cites ship-ticket | Factory-only wording |
| 1517-1628 | 112 `RETIRED_VOCABULARY` entries removed: 111 scoped only to `ship-ticket`, `vapt`, `generate-ticket`, `code-quality` or its aliases, plus the unscoped `GATE [12]` ("there was never a GATE 1 or GATE 2", Factory gate numbering). Kept: the 11 `design-prompts` entries and the unscoped `Claude Code's built-in review` entry. | Factory-only |
| 1633-1645, 1690-1697 | help text: CLI name `ai-agent-skills`, npx URLs, example `install session-logger session-restore` | identifier / example |

The import of `sep` stays, though the removed check was its only user.

## scripts/autoupdate.mjs

| Change | Why |
|---|---|
| launchd label `com.ai-agent-skills.update`; systemd unit `ai-agent-skills-update`; schtasks name `AI Agent Skills Update` | identifier |
| systemd `Description=` lines name `ai-agent-skills` | identifier |
| settings.json temp file `.settings.json.ai-agent-skills-<pid>` | identifier |
| npx-refusal message: `~/.ai-agent-skills`; one comment: `AI_AGENT_SKILLS_HOME` | identifier |

The SessionStart hook is still identified by the absolute path of the installing clone's `cli.mjs`,
which already differs between the two libraries, so the hook logic is unchanged.

## Other files

| File | Change | Why |
|---|---|---|
| `install.sh` | repository and raw URLs → `ai-agent-skills`; `AI_SKILLS_*` → `AI_AGENT_SKILLS_*`; default clone `~/.ai-agent-skills` | identifier |
| `package.json` | `name` and `bin` `ai-agent-skills`; `description`; `repository.url` | identifier |
| `scripts/install.sh` | alias refusal for `angular/backend-code-quality` removed; manifest name in a comment; one example | Factory-only / identifier |
| `.gitattributes` | removed: all five rules pinned `skills/ship-ticket` or `skills/vapt` paths | Factory-only |
| `scripts/cli.test.mjs` | manifest name and `AI_AGENT_SKILLS_*` env; alias and cited-rule-ID tests removed; the code-quality row-header test removed; retired-term tests use the kept `Claude Code's built-in review` entry; outcome-vocabulary tests follow the at-most-one rule (zero owners is now accepted); CI-shape test expects jobs `validate` and `cli` | follows the changes above |
| `scripts/import.sh`, `scripts/package.sh`, `scripts/validate.sh`, `.gitignore` | unchanged | |
| `LICENSE` | new: MIT, copyright holder `AhmedAbdelfattah0` (the source repository has no LICENSE file; its `package.json` declares MIT) | new repository |
| `SOURCE-MAP.md` | new: source commit → this repository's commit for the 42 preserved commits | new repository |
| `CLAUDE.md` | rewritten as a short pointer to the new `AGENTS.md` | new repository |
| `README.md`, `AGENTS.md`, `docs/` | written for this repository | new repository |
| `.github/workflows/validate.yml` | new: the validator, the moved skills' tests and the CLI matrix, with the source's action versions | new repository |

Not carried over: `scripts/review-rounds.mjs` and its test, `KNOWN-ISSUES.md` and `.specs/`. They
belong to the Factory.

## Skill content changed after the split

| File | Change |
|---|---|
| `skills/project-audit/SKILL.md` and `references/{evidence,reconcile-report,scope-inventory}.md` | relative links to Factory skills become plain names; an "Optional companions (separate repository)" note is added. Fallbacks unchanged. |
| `skills/marketing-video/SKILL.md` | the link to `ship-ticket`'s `cross-model.md` becomes a plain name (fallback unchanged); a private project name is removed from the capability table |
| `skills/self-healing/references/skill-creation-guide.md` | the invariant list follows this validator (outcome vocabulary: at most one owner; the rule-ID check is described as the Factory library's); the review-standard path becomes a companion name |

## Behaviour change after the split: install never replaces what it does not own

Owner decision, before the first release. At the source, `install` (`cli.mjs` and
`scripts/install.sh`) replaced any entry under a skill's name. In this repository:

- **`cli.mjs install`** applies the ownership test `update` already uses (`successorCollision`) to
  every skill, not only to alias successors. An entry that is not ours is left alone and reported,
  and the command exits 1.
- **`--replace-foreign`** (new) moves such an entry to
  `<state>/ai-agent-skills/<key>/replaced/<stamp>/<target>/<name>` and then installs. It never deletes.
- **`scripts/install.sh`** applies the same rule to its own links and has the same flag.
- **`install.sh`** passes the flag when `AI_AGENT_SKILLS_REPLACE_FOREIGN=1`.
- **`update`**, the updater, hooks, manifests and identifiers are unchanged.
- **`scripts/cli.test.mjs`** gains 10 tests.
