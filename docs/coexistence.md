# Coexistence with the Factory repository

This library was split out of the repository that holds the ticket-delivery Factory. Both use the
same installer design, so this one carries its own identifiers. Installed on one machine, neither
reads, updates or removes the other's records.

| | this library | Factory repository |
|---|---|---|
| clone directory (curl installer) | `~/.ai-agent-skills` (`AI_AGENT_SKILLS_HOME`) | `~/.ai-skills` (`AI_SKILLS_HOME`) |
| CLI name (`npm link`) | `ai-agent-skills` | `ai-skills` |
| manifest beside the skills | `.ai-agent-skills-manifest.json` | `.ai-skills-manifest.json` |
| staging directory beside the skills | `.ai-agent-skills-tmp` | `.ai-skills-tmp` |
| state, lock and log | `~/.local/state/ai-agent-skills/<key>` | `~/.local/state/ai-skills/<key>` |
| launchd label | `com.ai-agent-skills.update` | `com.ai-skills.update` |
| systemd unit | `ai-agent-skills-update` | `ai-skills-update` |
| Windows scheduled task | `AI Agent Skills Update` | `AI Skills Update` |
| SessionStart hook | `<this clone>/scripts/cli.mjs update --auto` | `<Factory clone>/scripts/cli.mjs update --auto` |

Each library recognises its own SessionStart hook by the absolute path of its own `cli.mjs`, so
`autoupdate --install` and `--remove` in one never add or remove the other's entry.

## Shared skill names

Skills are installed by folder name into the same directories, so one name can be installed by only
one library at a time. Until the Factory repository removes the skills that moved here, both ship
`design-prompts`, `marketing-video`, `project-audit`, `security`, `security-audit`, `self-healing`,
`session-logger` and `session-restore`.

This library's `install` never replaces the Factory's link to one of those names. It reports the link
and exits 1 (`--replace-foreign` backs the link up instead). The Factory's own installer does replace
this library's links. Each library's `update` leaves the other's links alone. To move the eight names
over from an existing Factory install, follow
[the migration in install.md](install.md#migrating-from-the-factory-install). Install these eight
skills from this library only.
