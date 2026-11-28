# CLI Swarm Setup

This repo now includes a repo-local swarm harness under [`scripts/cli-swarm/launch.py`](../scripts/cli-swarm/launch.py) and [`scripts/cli-swarm/proof-demo.sh`](../scripts/cli-swarm/proof-demo.sh).

When running the Python entrypoints with `uv` on a locked-down sandbox, set a writable cache dir first:

```bash
export UV_CACHE_DIR=/tmp/uv-cache
```

The goal is simple:

- split `N` worker sessions across `gemini`, `opencode`, `codex`, and `claude`
- use `pi` as the declared coordinator
- keep state and logs under `.swarm/`
- reuse the existing dashboard proof and Remotion/demo path already in this repo
- run each launched session inside a bounded `bwrap` filesystem view by default

## What it prepares

Running the launcher creates:

- `.swarm/<name>/manifest.json`
- `.swarm/<name>/control/mission.md`
- `.swarm/<name>/control/tasks.json`
- `.swarm/<name>/logs/*.log`
- `.swarm/<name>/prompts/*.txt`
- `.swarm/<name>/state/...`

Each session gets a detached `screen` command plus a repo-local state root. This avoids the home-directory write failures seen with `pi` and `gemini` in sandboxed Linux runs.

By default, each detached session is launched through `bwrap` with:

- `/` mounted read-only
- the repo mounted read-write
- `/tmp` as a private tmpfs

If the current machine refuses `bwrap` user namespace setup, the launcher now records the reason and falls back to direct execution unless you pass `--require-sandbox`.

Disable that only if you have a concrete reason:

```bash
uv run scripts/cli-swarm/launch.py --name sandbox-lab --count 8 --force --no-sandbox
uv run scripts/cli-swarm/launch.py --name sandbox-lab --count 8 --force --require-sandbox
```

## Example

Prepare eight workers round-robin across the four CLIs:

```bash
uv run scripts/cli-swarm/launch.py --name sandbox-lab --count 8 --force
```

Launch them as detached `screen` sessions:

```bash
uv run scripts/cli-swarm/launch.py --name sandbox-lab --count 8 --force --launch
```

That creates:

- one `pi` coordinator session
- eight worker sessions
- worker distribution in round-robin order across `gemini`, `opencode`, `codex`, `claude`

## Session control

List sessions:

```bash
screen -ls | grep swarm-sandbox-lab
```

Attach to the coordinator:

```bash
screen -r swarm-sandbox-lab-00-pi
```

Attach to a worker:

```bash
screen -r swarm-sandbox-lab-01-gemini
```

Summarize current logs:

```bash
uv run scripts/cli-swarm/status.py .swarm/sandbox-lab/manifest.json
```

## Provider/auth notes

The harness writes tool state under `.swarm/<name>/homes/...` by overriding `HOME` and related XDG paths for each launched session.

That fixes sandbox write issues for `pi` and `gemini`, but it also means CLI auth stored in your normal home directory is not reused automatically. Use API key env vars for reproducible runs:

- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `OPENCODE_API_KEY`
- `OPENROUTER_API_KEY`

If those env vars are present when you run the launcher, they are forwarded into the detached sessions.

## Proof and demo path

Once the target app is running, generate proof artifacts and an optional demo video:

```bash
scripts/cli-swarm/proof-demo.sh http://127.0.0.1:4332/#agents
```

This does three things:

1. runs the existing [`scripts/dashboard-proof.sh`](../scripts/dashboard-proof.sh)
2. renders the existing Remotion demo with `bun run render` if `remotion-demo/node_modules` already exists
3. adds a basic TTS voiceover when `espeak` and `ffmpeg` are installed

Artifacts land under:

- `output/playwright/`
- `output/demo/`

## Verification loop

For a machine-readable local verification pass with logs and a markdown report:

```bash
scripts/cli-swarm/verify.sh sandbox-lab
```

That writes:

- `.swarm/sandbox-lab/verification/report.md`
- `.swarm/sandbox-lab/verification/*.log`

The report also records whether the run used `bwrap` or had to fall back because the host blocked sandbox setup.

If you also want dashboard proof in that pass, set:

```bash
export DASHBOARD_PROOF_URL=http://127.0.0.1:4332/#agents
scripts/cli-swarm/verify.sh sandbox-lab
```

## Limits

- The harness sets `pi` as the nominal orchestrator, but it does not patch the CLIs to natively talk to each other.
- Detached sessions are created with `screen`; no separate queueing or RPC fabric is added here.
- Cross-CLI delegation is prompt-level and file-level, not a native shared RPC bus.
- Remotion rendering is skipped if dependencies are not already installed.
- The existing repo has proof and demo pieces already, so this setup composes those instead of replacing them.
