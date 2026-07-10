# clawREFORM Launch Commander

This pack is the parallel launch system for clawREFORM's public alpha.

Use it to split launch work across separate CLIs, separate worktrees, and separate branches without losing proof or coordination.

Design baseline for all visual work:

- [launch-metallic-baseline.md](/home/ae/clawreform/docs/design/launch-metallic-baseline.md)

## What Can Be Delegated Right Now

| ID | Task | Can Start Now | Depends On | Preferred CLI | Recommended Model / Provider | Why |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Pre-site deployment | Yes | None | codex | `gpt-5-codex` / OpenAI | deployment and code-path rigor |
| 2 | Audit download path | Yes | None | codex | `gpt-5-codex` / OpenAI | precise repo and link auditing |
| 3 | Release packaging proof | Partial | 2 | codex | `gpt-5-codex` / OpenAI | release artifact verification |
| 4 | Onboarding and first-run smoke | Yes | None | claude | `claude-sonnet-4-20250514` / Anthropic | UX judgment and crisp bug notes |
| 5 | Parallel proof screenshots | Yes | None | opencode | `gemini-2.5-pro` / Google Gemini | multimodal proof review |
| 6 | Public alpha go-live | No | 1,2,3,4,5 | pi | `gemini-2.5-pro` / Google Gemini | long-context synthesis |
| 7 | Twitter/X launch chain | Yes | 10 | claude | `claude-sonnet-4-20250514` / Anthropic | tight social copy |
| 8 | YouTube launch automation | Yes | 5,10 | opencode | `gemini-2.5-pro` / Google Gemini | video and script planning |
| 9 | Reddit, Medium, Quora chain | Yes | 10 | gemini | `gemini-2.5-pro` / Google Gemini | longform adaptation with breadth |
| 10 | Content creator | Yes | None | claude | `claude-sonnet-4-20250514` / Anthropic | voice, tone, and positioning |
| 11 | Content distributor | Yes | 7,8,9,10 | opencode | `gemini-2.5-pro` / Google Gemini | routing and calendar synthesis |
| 12 | Email list super sherlock | Yes | 10 | gemini | `gemini-2.5-pro` / Google Gemini | segmentation and outreach mapping |
| 13 | Launch control room | Yes | None | pi | `gemini-2.5-pro` / Google Gemini | cross-task summarization |
| 14 | Design system translation | Yes | None | claude | `claude-sonnet-4-20250514` / Anthropic | design rule extraction |
| 16 | Stitch Website Variations | Yes | None | claude | `glm-5.1` / Anthropic | website brand exploration |

## Standard Execution Contract

Every task uses its own branch, worktree, artifact root, and final handoff note.

- Branch format: `launch/NN-short-name`
- Worktree format: `../clawreform-launch-NN-short-name`
- Artifact root: `output/launch/NN-short-name/`
- Final report: `output/launch/NN-short-name/handoff.md`
- Screenshot folder: `output/launch/NN-short-name/screenshots/`

Every task owner must leave:

- a concise `handoff.md`
- a changelog or findings note
- commands run
- blockers
- screenshot evidence or explicit note that no UI existed to capture

## Shared Worktree Command Template

```bash
git worktree add ../clawreform-launch-NN-short-name -b launch/NN-short-name
mkdir -p output/launch/NN-short-name/screenshots
```

## Shared Agent Prompt Prefix

Use this prefix before the task-specific prompt chain:

```text
You own launch task NN for clawREFORM.
Work only inside your assigned worktree and branch.
Write all artifacts to output/launch/NN-short-name/.
Leave a concise handoff at output/launch/NN-short-name/handoff.md.
Capture screenshots for every meaningful UI or public-facing proof step.
If you hit a blocker, log it immediately instead of stalling.
```

Recommended models are best-fit defaults. If a given CLI is locked to a different house model in your environment, keep the task assignment and note the substitution in `handoff.md`.

## Shared Proof Rules

- Use `scripts/dashboard-proof.sh` when the local app on `127.0.0.1:4332` is part of the proof.
- Use `scripts/cli-swarm/proof-demo.sh http://127.0.0.1:4332/#agents` when demo video or richer proof is needed.
- If the task is website-only, capture desktop and mobile screenshots of the relevant public page.
- If the task is channel/content-only, capture draft previews, scheduler previews, or rendered assets.
- If a screenshot is impossible, include a precise explanation in `handoff.md`.

## Recommended Slash Commands

These global command references map cleanly onto the launch pack:

- `/coordination/swarm-init`
- `/coordination/task-orchestrate`
- `/github/release-manager`
- `/workflows/workflow-create`
- `/workflows/workflow-execute`
- `/monitoring/status`
- `/monitoring/swarm-monitor`
- `/obs-studio`

Use them when the operator CLI supports them. If a task runs in a CLI without these commands, mirror the intent with repo scripts and note the substitution in `handoff.md`.

## Coordination Notes

- Task 5 is the shared evidence historian. It documents what the other branches produced.
- Task 10 is the content source-of-truth agent. Tasks 7, 8, 9, and 12 should reuse its messaging.
- Task 13 is the war-room agent. It tracks blockers, assigns urgency, and keeps a running launch ledger.
- Task 6 should not go live until tasks 1 through 5 are materially complete.

## Recommended Parallel Start Order

Start these immediately:

- 1
- 2
- 4
- 5
- 10
- 13
- 14

Then start these as soon as task 10 has first-pass messaging:

- 7
- 8
- 9
- 12

Then start:

- 3
- 11

Finish with:

- 6
