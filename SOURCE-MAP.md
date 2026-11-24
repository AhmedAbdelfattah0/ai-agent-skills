# Source map

Each preserved commit in this repository came from a commit of `AhmedAbdelfattah0/AI-Skills`
(the repository now holding the Factory), split at `bb6c054`. git-filter-repo kept only the eight
skill folders and the vendored-skill sync files (`--path`). A second pass replaced one private
project name and one private ticket key in one file version and in commit messages
(`--replace-text`, `--replace-message`; see CHANGES.md). The SHAs below therefore differ from
the source.
Authors, dates, messages and trees are otherwise unchanged.

| Source commit (AI-Skills) | This repository | Date | Subject |
|---|---|---|---|
| `a4fa3798220f` | `3982e20338f1` | 2026-11-23 | ci: Node 22 only matrices and job timeouts (PR-B) |
| `bc173fb8829c` | `1e3d904588bf` | 2026-11-23 | chore: raise the minimum supported Node.js to 22 (OD-Q5, supported-runtime contract) |
| `0e41b224b01e` | `f2b9b1c68f7e` | 2026-11-18 | Merge pull request #75 from AhmedAbdelfattah0/feat/CI-0-pr-concurrency |
| `03f1c390a0f1` | `0165a9204fe2` | 2026-11-17 | chore(SC-2,SC-3): retire pr-review and ux-audit from the factory (scope consolidation) |
| `53be83341208` | `2f63c19a537c` | 2026-11-17 | ci(CI-0): keep sync-external.yml unchanged (Codex: queued-run replacement; not needed for the PR backlog) |
| `8c8310d4b756` | `cb137cc76313` | 2026-11-17 | ci(CI-0): cancel superseded pull-request runs with native concurrency; serialise sync-external |
| `bcd3c3479042` | `63a52e48d802` | 2026-11-11 | Merge pull request #57 from AhmedAbdelfattah0/feat/AIS-BENCH-1-wave-0-hygiene |
| `f25f6bfd83ba` | `bce7c22444ff` | 2026-11-11 | fix(AIS-BENCH-1): Wave 0: cited rule-ID check, CLI tests, session-restore fix |
| `f8ddaf696af3` | `7a2b0b97f10c` | 2026-11-03 | Merge pull request #33 from AhmedAbdelfattah0/feat/design-prompts-motion-finish |
| `8e298bda3140` | `8ff0518aa82d` | 2026-11-02 | design-prompts: address CodeRabbit review |
| `fc0cdd7bf053` | `ee4cd1872b21` | 2026-11-02 | design-prompts: core contract, tool adapters, and one assembled design system |
| `ebd6c724509b` | `d71774375901` | 2026-10-27 | feat: vendor cloudflare/security-audit-skill with daily upstream sync |
| `60565a207f34` | `aa3a70c44359` | 2026-10-27 | fix(project-audit): point to the external Cloudflare security-audit skill |
| `e7558bd237e8` | `fabc016491bd` | 2026-10-27 | chore: drop own security-audit skill in favour of cloudflare/security-audit-skill |
| `fb81eed28980` | `acbea3137ccd` | 2026-10-25 | Merge pull request #32 from AhmedAbdelfattah0/feat/marketing-video-crossfade |
| `c67e24406371` | `c717b4707438` | 2026-10-25 | marketing-video: crossfades, whole-screen-then-zoom camera, recording crop, background music |
| `5a3579f26b03` | `83b532a215e8` | 2026-10-25 | Merge pull request #31 from AhmedAbdelfattah0/feat/marketing-video-provider-authorization |
| `a66138445f75` | `eb1e50681d58` | 2026-10-25 | marketing-video: per-provider authorization for browser-operated providers (docs only) |
| `e5e23c6615d5` | `85fcc791fd9d` | 2026-10-25 | Merge pull request #30 from AhmedAbdelfattah0/feat/marketing-video |
| `666f09982ccc` | `f3f409ec1564` | 2026-10-25 | marketing-video: factual product videos from real captures (AI Marketing Studio Phase 1, first slice) |
| `7df9b6a6bd4e` | `a1bb62b2cb7c` | 2026-10-15 | Merge pull request #29 from AhmedAbdelfattah0/feat/design-prompts-motion-finish |
| `18c7af680090` | `03913dce5882` | 2026-10-11 | design-prompts: add motion and finish standard for every surface |
| `c46e1df5a96b` | `fcc68583668b` | 2026-09-30 | Merge pull request #28 from AhmedAbdelfattah0/fix/design-prompts-diagnose-format |
| `280d90108337` | `839dedf968c1` | 2026-09-30 | design-prompts: baseline fallback and hypothesis-first environment diagnosis |
| `518a43227cc4` | `b2c2a4575473` | 2026-09-30 | design-prompts: diagnose Claude Design format deviations before editing prompts |
| `c400d1c5567a` | `7cac037cad53` | 2026-09-29 | Merge pull request #27 from AhmedAbdelfattah0/feat/design-prompts-component-format |
| `ad580360da63` | `e813d1b8fcd1` | 2026-09-29 | design-prompts: load data-2.js right after data.js in part-2 and update previews |
| `900cf305f3a2` | `cf035297fb39` | 2026-09-28 | design-prompts: Foundation is prompt 01 for every component-format set |
| `0be524ccd3f8` | `074c9f985b04` | 2026-09-28 | design-prompts: component + HTML preview format, Foundation prompt, codebase inventory |
| `7cc5dbf7be4e` | `629fa8e4feda` | 2026-09-28 | fix(project-audit): require exhaustive historical finding reconciliation |
| `e9b7464507c4` | `f0fffad6cd8b` | 2026-09-28 | Merge pull request #25 from AhmedAbdelfattah0/fix/project-audit-finding-problem-risk |
| `6811a8c25c8b` | `53190de0ed0f` | 2026-09-28 | project-audit: use placeholders in the reusable finding template |
| `91d94c5dccf0` | `c4f7f33e54d1` | 2026-09-28 | project-audit: every finding states the problem and the risk in plain language |
| `f79e48b2067b` | `a4e3d2972c5b` | 2026-09-23 | Project audit: always audit dependencies, stop runtime by recorded ID, respect concurrent runs |
| `7a2b3d5bc8ec` | `93b848026c85` | 2026-09-23 | fix: apply CodeRabbit audit fixes |
| `17ca24e0551f` | `c7363fd8cb04` | 2026-09-23 | Add tracker publishing to project audit |
| `5b0de959e5c3` | `3ad4ef38784f` | 2026-09-23 | Add governed whole-project audit skill |
| `cd069e46fa31` | `525f8a4af1ee` | 2026-09-15 | Bound ship-ticket review and add timing telemetry |
| `ec4d445510a3` | `a4d0719dbe3e` | 2026-09-14 | Changing a rule means proving the old one is gone |
| `7ea60bf9db02` | `7d1c48354b7d` | 2026-07-18 | Refine documentation for code-quality skills and enhance triggering conditions |
| `5c3fa59b59ea` | `88fcf9370002` | 2026-07-17 | Enhance skills documentation and introduce new references |
| `de3fc113d0a3` | `645bfb050054` | 2026-07-14 | Add initial project structure with skills and validation scripts |

Commits after `3982e20338f1` are new to this repository (tooling, docs, CI) and have no source commit.
