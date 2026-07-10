# Missing Worktrees Manual Kickoff

This sheet reconstructs the missing immediate-wave launch tasks from the restore bundle.

These tasks do not currently exist under `.worktrees/`, but their intended branches, prompt files, and artifact targets are preserved in the launch manifest and restore prompts.

## Recommended order

1. `13` Launch Control Room
2. `10` Content Creator
3. `05` Proof Screenshots
4. `02` Download Audit
5. `14` Design System Translation
6. `04` First Run Smoke

Note: task `01` already exists at `.worktrees/01-pre-site-deployment`. If you also reopen it manually, place it between `05` and `02`.

## Shared read set

Every task should read:

- `docs/launch-tasks/0_clawREFORM_launch-commander.md`
- its task brief under `docs/launch-tasks/`
- `docs/design/launch-metallic-baseline.md`

Use `opencode` with `openrouter/openrouter/hunter-alpha`.

## Task map

| Order | Task | Branch | Intended worktree | Restore prompt file | Task brief | Intended output folder |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `13` Launch Control Room | `launch/13-launch-control-room` | `.worktrees/13-launch-control-room` | `docs/session-restore/2026-03-13-launch-alpha/prompts/13-launch-control-room.md` | `docs/session-restore/2026-03-13-launch-alpha/launch-tasks/13_clawREFORM_launch-control-room.md` | `.worktrees/13-launch-control-room/output/launch/13-launch-control-room/` |
| 2 | `10` Content Creator | `launch/10-content-creator` | `.worktrees/10-content-creator` | `docs/session-restore/2026-03-13-launch-alpha/prompts/10-content-creator.md` | `docs/session-restore/2026-03-13-launch-alpha/launch-tasks/10_clawREFORM_content-creator.md` | `.worktrees/10-content-creator/output/launch/10-content-creator/` |
| 3 | `05` Proof Screenshots | `launch/05-parallel-proof-screenshots` | `.worktrees/05-parallel-proof-screenshots` | `docs/session-restore/2026-03-13-launch-alpha/prompts/05-parallel-proof-screenshots.md` | `docs/session-restore/2026-03-13-launch-alpha/launch-tasks/5_clawREFORM_parallel-proof-screenshots.md` | `.worktrees/05-parallel-proof-screenshots/output/launch/05-parallel-proof-screenshots/` |
| 4 | `02` Download Audit | `launch/02-audit-dl-path` | `.worktrees/02-audit-dl-path` | `docs/session-restore/2026-03-13-launch-alpha/prompts/02-audit-dl-path.md` | `docs/session-restore/2026-03-13-launch-alpha/launch-tasks/2_clawREFORM_audit_dl-path.md` | `.worktrees/02-audit-dl-path/output/launch/02-audit-dl-path/` |
| 5 | `14` Design System Translation | `launch/14-design-system-translation` | `.worktrees/14-design-system-translation` | `docs/session-restore/2026-03-13-launch-alpha/prompts/14-design-system-translation.md` | `docs/session-restore/2026-03-13-launch-alpha/launch-tasks/14_clawREFORM_design-system-translation.md` | `.worktrees/14-design-system-translation/output/launch/14-design-system-translation/` |
| 6 | `04` First Run Smoke | `launch/04-onboarding-first-run-smoke` | `.worktrees/04-onboarding-first-run-smoke` | `docs/session-restore/2026-03-13-launch-alpha/prompts/04-onboarding-first-run-smoke.md` | `docs/session-restore/2026-03-13-launch-alpha/launch-tasks/4_clawREFORM_onboarding-first-run-smoke.md` | `.worktrees/04-onboarding-first-run-smoke/output/launch/04-onboarding-first-run-smoke/` |

## What each task was for

- `13`: war-room status board, blocker log, escalation rules, launch-day watchlist.
- `10`: source-of-truth messaging pack for every outbound channel.
- `05`: screenshot and proof ledger for all active launch work.
- `02`: audit all public download and install paths and define one canonical install story.
- `14`: turn the metallic reference image pack into practical launch design rules.
- `04`: run the product like a zero-context new user and record onboarding friction.

## Source of truth

If any detail conflicts, prefer:

1. `.swarm/launch-alpha/visible-launch-manifest.json`
2. `docs/session-restore/2026-03-13-launch-alpha/prompts/`
3. `docs/session-restore/2026-03-13-launch-alpha/launch-tasks/`
