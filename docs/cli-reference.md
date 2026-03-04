# clawREFORM by aegntic.ai CLI Reference

Complete command-line reference for `clawreform`, the CLI tool for the clawREFORM by aegntic.ai.

## Overview

The `clawreform` binary is the primary interface for managing the clawREFORM by aegntic.ai. It supports two modes of operation:

- **Daemon mode** -- When a daemon is running (`clawreform start`), CLI commands communicate with it over HTTP. This is the recommended mode for production use.
- **In-process mode** -- When no daemon is detected, commands that support it will boot an ephemeral in-process kernel. Agents spawned in this mode are not persisted and will be lost when the process exits.

Running `clawreform` with no subcommand launches the interactive TUI (terminal user interface) built with ratatui, which provides a full dashboard experience in the terminal.

## Installation

### From source (cargo)

```bash
cargo install --path crates/clawreform-cli
```

### Build from workspace

```bash
cargo build --release -p clawreform-cli
# Binary: target/release/clawreform (or clawreform.exe on Windows)
```

### Docker

```bash
docker run -it clawreform/clawreform:latest
```

### Shell installer

```bash
curl -fsSL https://get.clawreform.ai | sh
```

## Global Options

These options apply to all commands.

| Option | Description |
|---|---|
| `--config <PATH>` | Path to a custom config file. Overrides the default `~/.clawreform/config.toml`. |
| `--help` | Print help information for any command or subcommand. |
| `--version` | Print the version of the `clawreform` binary. |

**Environment variables:**

| Variable | Description |
|---|---|
| `RUST_LOG` | Controls log verbosity (e.g. `info`, `debug`, `clawreform_kernel=trace`). |
| `CLAWREFORM_AGENTS_DIR` | Override the agent templates directory. |
| `EDITOR` / `VISUAL` | Editor used by `clawreform config edit`. Falls back to `notepad` (Windows) or `vi` (Unix). |

---

## Command Reference

### clawreform (no subcommand)

Launch the interactive TUI dashboard.

```
clawreform [--config <PATH>]
```

The TUI provides a full-screen terminal interface with panels for agents, chat, workflows, channels, skills, settings, and more. Tracing output is redirected to `~/.clawreform/tui.log` to avoid corrupting the terminal display.

Press `Ctrl+C` to exit. A second `Ctrl+C` force-exits the process.

---

### clawreform init

Initialize the clawREFORM by aegntic.ai workspace. Creates `~/.clawreform/` with subdirectories (`data/`, `agents/`) and a default `config.toml`.

```
clawreform init [--quick]
```

**Options:**

| Option | Description |
|---|---|
| `--quick` | Skip interactive prompts. Auto-detects the best available LLM provider and writes config immediately. Suitable for CI/scripts. |

**Behavior:**

- Without `--quick`: Launches an interactive 5-step onboarding wizard (ratatui TUI) that walks through provider selection, API key configuration, and optionally starts the daemon.
- With `--quick`: Auto-detects providers by checking environment variables in priority order: Groq, Gemini, DeepSeek, Anthropic, OpenAI, OpenRouter. Falls back to Groq if none are found.
- File permissions are restricted to owner-only (`0600` for files, `0700` for directories) on Unix.

**Example:**

```bash
# Interactive setup
clawreform init

# Non-interactive (CI/scripts)
export GROQ_API_KEY="gsk_..."
clawreform init --quick
```

---

### clawreform start

Start the clawREFORM by aegntic.ai daemon (kernel + API server).

```
clawreform start [--config <PATH>]
```

**Behavior:**

- Checks if a daemon is already running; exits with an error if so.
- Boots the clawREFORM by aegntic.ai kernel (loads config, initializes SQLite database, loads agents, connects MCP servers, starts background tasks).
- Starts the HTTP API server on the address specified in `config.toml` (default: `127.0.0.1:4332`).
- Writes `daemon.json` to `~/.clawreform/` so other CLI commands can discover the running daemon.
- Blocks until interrupted with `Ctrl+C`.

**Output:**

```
  clawREFORM by aegntic.ai v0.1.0

  Starting daemon...

  [ok] Kernel booted (groq/llama-3.3-70b-versatile)
  [ok] 50 models available
  [ok] 3 agent(s) loaded

  API:        http://127.0.0.1:4332
  Dashboard:  http://127.0.0.1:4332/
  Provider:   groq
  Model:      llama-3.3-70b-versatile

  hint: Open the dashboard in your browser, or run `clawreform chat`
  hint: Press Ctrl+C to stop the daemon
```

**Example:**

```bash
# Start with default config
clawreform start

# Start with custom config
clawreform start --config /path/to/config.toml
```

---

### clawreform status

Show the current kernel/daemon status.

```
clawreform status [--json]
```

**Options:**

| Option | Description |
|---|---|
| `--json` | Output machine-readable JSON for scripting. |

**Behavior:**

- If a daemon is running: queries `GET /api/status` and displays agent count, provider, model, uptime, API URL, data directory, and lists active agents.
- If no daemon is running: boots an in-process kernel and shows persisted state. Displays a warning that the daemon is not running.

**Example:**

```bash
clawreform status

clawreform status --json | jq '.agent_count'
```

---

### clawreform doctor

Run diagnostic checks on the clawREFORM by aegntic.ai installation.

```
clawreform doctor [--json] [--repair]
```

**Options:**

| Option | Description |
|---|---|
| `--json` | Output results as JSON for scripting. |
| `--repair` | Attempt to auto-fix issues (create missing directories, config, remove stale files). Prompts for confirmation before each repair. |

**Checks performed:**

1. **clawREFORM by aegntic.ai directory** -- `~/.clawreform/` exists
2. **.env file** -- exists and has correct permissions (0600 on Unix)
3. **Config TOML syntax** -- `config.toml` parses without errors
4. **Daemon status** -- whether a daemon is running
5. **Port 4332 availability** -- if daemon is not running, checks if the port is free
6. **Stale daemon.json** -- leftover `daemon.json` from a crashed daemon
7. **Database file** -- SQLite magic bytes validation
8. **Disk space** -- warns if less than 100MB available (Unix only)
9. **Agent manifests** -- validates all `.toml` files in `~/.clawreform/agents/`
10. **LLM provider keys** -- checks env vars for 10 providers (Groq, OpenRouter, Anthropic, OpenAI, DeepSeek, Gemini, Google, Together, Mistral, Fireworks), performs live validation (401/403 detection)
11. **Channel tokens** -- format validation for Telegram, Discord, Slack tokens
12. **Config consistency** -- checks that `api_key_env` references in config match actual environment variables
13. **Rust toolchain** -- `rustc --version`

**Example:**

```bash
clawreform doctor

clawreform doctor --repair

clawreform doctor --json
```

---

### clawreform dashboard

Open the web dashboard in the default browser.

```
clawreform dashboard
```

**Behavior:**

- Requires a running daemon.
- Opens the daemon URL (e.g. `http://127.0.0.1:4332/`) in the system browser.
- Copies the URL to the system clipboard (uses PowerShell on Windows, `pbcopy` on macOS, `xclip`/`xsel` on Linux).

**Example:**

```bash
clawreform dashboard
```

---

### clawreform completion

Generate shell completion scripts.

```
clawreform completion <SHELL>
```

**Arguments:**

| Argument | Description |
|---|---|
| `<SHELL>` | Target shell. One of: `bash`, `zsh`, `fish`, `elvish`, `powershell`. |

**Example:**

```bash
# Bash
clawreform completion bash > ~/.bash_completion.d/clawreform

# Zsh
clawreform completion zsh > ~/.zfunc/_clawreform

# Fish
clawreform completion fish > ~/.config/fish/completions/clawreform.fish

# PowerShell
clawreform completion powershell > clawreform.ps1
```

---

## Agent Commands

### clawreform agent new

Spawn an agent from a built-in template.

```
clawreform agent new [<TEMPLATE>]
```

**Arguments:**

| Argument | Description |
|---|---|
| `<TEMPLATE>` | Template name (e.g. `coder`, `assistant`, `researcher`). If omitted, displays an interactive picker listing all available templates. |

**Behavior:**

- Templates are discovered from: the repo `agents/` directory (dev builds), `~/.clawreform/agents/` (installed), and `CLAWREFORM_AGENTS_DIR` (env override).
- Each template is a directory containing an `agent.toml` manifest.
- In daemon mode: sends `POST /api/agents` with the manifest. Agent is persistent.
- In standalone mode: boots an in-process kernel. Agent is ephemeral.

**Example:**

```bash
# Interactive picker
clawreform agent new

# Spawn by name
clawreform agent new coder

# Spawn the assistant template
clawreform agent new assistant
```

---

### clawreform agent spawn

Spawn an agent from a custom manifest file.

```
clawreform agent spawn <MANIFEST>
```

**Arguments:**

| Argument | Description |
|---|---|
| `<MANIFEST>` | Path to an agent manifest TOML file. |

**Behavior:**

- Reads and parses the TOML manifest file.
- In daemon mode: sends the raw TOML to `POST /api/agents`.
- In standalone mode: boots an in-process kernel and spawns the agent locally.

**Example:**

```bash
clawreform agent spawn ./my-agent/agent.toml
```

---

### clawreform agent list

List all running agents.

```
clawreform agent list [--json]
```

**Options:**

| Option | Description |
|---|---|
| `--json` | Output as JSON array for scripting. |

**Output columns:** ID, NAME, STATE, PROVIDER, MODEL (daemon mode) or ID, NAME, STATE, CREATED (in-process mode).

**Example:**

```bash
clawreform agent list

clawreform agent list --json | jq '.[].name'
```

---

### clawreform agent chat

Start an interactive chat session with a specific agent.

```
clawreform agent chat <AGENT_ID>
```

**Arguments:**

| Argument | Description |
|---|---|
| `<AGENT_ID>` | Agent UUID. Obtain from `clawreform agent list`. |

**Behavior:**

- Opens a REPL-style chat loop.
- Type messages at the `you>` prompt.
- Agent responses display at the `agent>` prompt, followed by token usage and iteration count.
- Type `exit`, `quit`, or press `Ctrl+C` to end the session.

**Example:**

```bash
clawreform agent chat a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

### clawreform agent kill

Terminate a running agent.

```
clawreform agent kill <AGENT_ID>
```

**Arguments:**

| Argument | Description |
|---|---|
| `<AGENT_ID>` | Agent UUID to terminate. |

**Example:**

```bash
clawreform agent kill a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## Workflow Commands

All workflow commands require a running daemon.

### clawreform workflow list

List all registered workflows.

```
clawreform workflow list
```

**Output columns:** ID, NAME, STEPS, CREATED.

---

### clawreform workflow create

Create a workflow from a JSON definition file.

```
clawreform workflow create <FILE>
```

**Arguments:**

| Argument | Description |
|---|---|
| `<FILE>` | Path to a JSON file describing the workflow steps. |

**Example:**

```bash
clawreform workflow create ./my-workflow.json
```

---

### clawreform workflow run

Execute a workflow by ID.

```
clawreform workflow run <WORKFLOW_ID> <INPUT>
```

**Arguments:**

| Argument | Description |
|---|---|
| `<WORKFLOW_ID>` | Workflow UUID. Obtain from `clawreform workflow list`. |
| `<INPUT>` | Input text to pass to the workflow. |

**Example:**

```bash
clawreform workflow run abc123 "Analyze this code for security issues"
```

---

## Trigger Commands

All trigger commands require a running daemon.

### clawreform trigger list

List all event triggers.

```
clawreform trigger list [--agent-id <ID>]
```

**Options:**

| Option | Description |
|---|---|
| `--agent-id <ID>` | Filter triggers by the owning agent's UUID. |

**Output columns:** TRIGGER ID, AGENT ID, ENABLED, FIRES, PATTERN.

---

### clawreform trigger create

Create an event trigger for an agent.

```
clawreform trigger create <AGENT_ID> <PATTERN_JSON> [--prompt <TEMPLATE>] [--max-fires <N>]
```

**Arguments:**

| Argument | Description |
|---|---|
| `<AGENT_ID>` | UUID of the agent that owns the trigger. |
| `<PATTERN_JSON>` | Trigger pattern as a JSON string. |

**Options:**

| Option | Default | Description |
|---|---|---|
| `--prompt <TEMPLATE>` | `"Event: {{event}}"` | Prompt template. Use `{{event}}` as a placeholder for the event data. |
| `--max-fires <N>` | `0` (unlimited) | Maximum number of times the trigger will fire. |

**Pattern examples:**

```bash
# Fire on any lifecycle event
clawreform trigger create <AGENT_ID> '{"lifecycle":{}}'

# Fire when a specific agent is spawned
clawreform trigger create <AGENT_ID> '{"agent_spawned":{"name_pattern":"*"}}'

# Fire on agent termination
clawreform trigger create <AGENT_ID> '{"agent_terminated":{}}'

# Fire on all events (limited to 10 fires)
clawreform trigger create <AGENT_ID> '{"all":{}}' --max-fires 10
```

---

### clawreform trigger delete

Delete a trigger by ID.

```
clawreform trigger delete <TRIGGER_ID>
```

**Arguments:**

| Argument | Description |
|---|---|
| `<TRIGGER_ID>` | UUID of the trigger to delete. |

---

## Skill Commands

### clawreform skill list

List all installed skills.

```
clawreform skill list
```

**Output columns:** NAME, VERSION, TOOLS, DESCRIPTION.

Loads skills from `~/.clawreform/skills/` plus bundled skills compiled into the binary.

---

### clawreform skill install

Install a skill from a local directory, git URL, or FangHub marketplace.

```
clawreform skill install <SOURCE>
```

**Arguments:**

| Argument | Description |
|---|---|
| `<SOURCE>` | Skill name (FangHub), local directory path, or git URL. |

**Behavior:**

- **Local directory:** Looks for `skill.toml` in the directory. If not found, checks for OpenClaw-format skills (SKILL.md with YAML frontmatter) and auto-converts them.
- **Remote (FangHub):** Fetches and installs from the FangHub marketplace. Skills pass through SHA256 verification and prompt injection scanning.

**Example:**

```bash
# Install from local directory
clawreform skill install ./my-skill/

# Install from FangHub
clawreform skill install web-search

# Install an OpenClaw-format skill
clawreform skill install ./openclaw-skill/
```

---

### clawreform skill remove

Remove an installed skill.

```
clawreform skill remove <NAME>
```

**Arguments:**

| Argument | Description |
|---|---|
| `<NAME>` | Name of the skill to remove. |

**Example:**

```bash
clawreform skill remove web-search
```

---

### clawreform skill search

Search the FangHub marketplace for skills.

```
clawreform skill search <QUERY>
```

**Arguments:**

| Argument | Description |
|---|---|
| `<QUERY>` | Search query string. |

**Example:**

```bash
clawreform skill search "docker kubernetes"
```

---

### clawreform skill create

Interactively scaffold a new skill project.

```
clawreform skill create
```

**Behavior:**

Prompts for:
- Skill name
- Description
- Runtime (`python`, `node`, or `wasm`; defaults to `python`)

Creates a directory under `~/.clawreform/skills/<name>/` with:
- `skill.toml` -- manifest file
- `src/main.py` (or `src/index.js`) -- entry point with boilerplate

**Example:**

```bash
clawreform skill create
# Skill name: my-tool
# Description: A custom analysis tool
# Runtime (python/node/wasm) [python]: python
```

---

## Channel Commands

### clawreform channel list

List configured channels and their status.

```
clawreform channel list
```

**Output columns:** CHANNEL, ENV VAR, STATUS.

Checks `config.toml` for channel configuration sections and environment variables for required tokens. Status is one of: `Ready`, `Missing env`, `Not configured`.

**Channels checked:** webchat, telegram, discord, slack, whatsapp, signal, matrix, email.

---

### clawreform channel setup

Interactive setup wizard for a channel integration.

```
clawreform channel setup [<CHANNEL>]
```

**Arguments:**

| Argument | Description |
|---|---|
| `<CHANNEL>` | Channel name. If omitted, displays an interactive picker. |

**Supported channels:** `telegram`, `discord`, `slack`, `whatsapp`, `email`, `signal`, `matrix`.

Each wizard:
1. Displays step-by-step instructions for obtaining credentials.
2. Prompts for tokens/credentials.
3. Saves tokens to `~/.clawreform/.env` with owner-only permissions.
4. Appends the channel configuration block to `config.toml` (prompts for confirmation).
5. Warns to restart the daemon if one is running.

**Example:**

```bash
# Interactive picker
clawreform channel setup

# Direct setup
clawreform channel setup telegram
clawreform channel setup discord
clawreform channel setup slack
```

---

### clawreform channel test

Send a test message through a configured channel.

```
clawreform channel test <CHANNEL>
```

**Arguments:**

| Argument | Description |
|---|---|
| `<CHANNEL>` | Channel name to test. |

Requires a running daemon. Sends `POST /api/channels/<channel>/test`.

**Example:**

```bash
clawreform channel test telegram
```

---

### clawreform channel enable

Enable a channel integration.

```
clawreform channel enable <CHANNEL>
```

**Arguments:**

| Argument | Description |
|---|---|
| `<CHANNEL>` | Channel name to enable. |

In daemon mode: sends `POST /api/channels/<channel>/enable`. Without a daemon: prints a note that the change will take effect on next start.

---

### clawreform channel disable

Disable a channel without removing its configuration.

```
clawreform channel disable <CHANNEL>
```

**Arguments:**

| Argument | Description |
|---|---|
| `<CHANNEL>` | Channel name to disable. |

In daemon mode: sends `POST /api/channels/<channel>/disable`. Without a daemon: prints a note to edit `config.toml`.

---

## Config Commands

### clawreform config show

Display the current configuration file.

```
clawreform config show
```

Prints the contents of `~/.clawreform/config.toml` with the file path as a header comment.

---

### clawreform config edit

Open the configuration file in your editor.

```
clawreform config edit
```

Uses `$EDITOR`, then `$VISUAL`, then falls back to `notepad` (Windows) or `vi` (Unix).

---

### clawreform config get

Get a single configuration value by dotted key path.

```
clawreform config get <KEY>
```

**Arguments:**

| Argument | Description |
|---|---|
| `<KEY>` | Dotted key path into the TOML structure. |

**Example:**

```bash
clawreform config get default_model.provider
# groq

clawreform config get api_listen
# 127.0.0.1:4332

clawreform config get memory.decay_rate
# 0.05
```

---

### clawreform config set

Set a configuration value by dotted key path.

```
clawreform config set <KEY> <VALUE>
```

**Arguments:**

| Argument | Description |
|---|---|
| `<KEY>` | Dotted key path. |
| `<VALUE>` | New value. Type is inferred from the existing value (integer, float, boolean, or string). |

**Warning:** This command re-serializes the TOML file, which strips all comments.

**Example:**

```bash
clawreform config set default_model.provider anthropic
clawreform config set default_model.model claude-sonnet-4-20250514
clawreform config set api_listen "0.0.0.0:4332"
```

---

### clawreform config set-key

Save an LLM provider API key to `~/.clawreform/.env`.

```
clawreform config set-key <PROVIDER>
```

**Arguments:**

| Argument | Description |
|---|---|
| `<PROVIDER>` | Provider name (e.g. `groq`, `anthropic`, `openai`, `gemini`, `deepseek`, `openrouter`, `together`, `mistral`, `fireworks`, `perplexity`, `cohere`, `xai`, `brave`, `tavily`). |

**Behavior:**

- Prompts interactively for the API key.
- Saves to `~/.clawreform/.env` as `<PROVIDER_NAME>_API_KEY=<value>`.
- Runs a live validation test against the provider's API.
- File permissions are restricted to owner-only on Unix.

**Example:**

```bash
clawreform config set-key groq
# Paste your groq API key: gsk_...
# [ok] Saved GROQ_API_KEY to ~/.clawreform/.env
# Testing key... OK
```

---

### clawreform config delete-key

Remove an API key from `~/.clawreform/.env`.

```
clawreform config delete-key <PROVIDER>
```

**Arguments:**

| Argument | Description |
|---|---|
| `<PROVIDER>` | Provider name. |

**Example:**

```bash
clawreform config delete-key openai
```

---

### clawreform config test-key

Test provider connectivity with the stored API key.

```
clawreform config test-key <PROVIDER>
```

**Arguments:**

| Argument | Description |
|---|---|
| `<PROVIDER>` | Provider name. |

**Behavior:**

- Reads the API key from the environment (loaded from `~/.clawreform/.env`).
- Hits the provider's models/health endpoint.
- Reports `OK` (key accepted) or `FAILED (401/403)` (key rejected).
- Exits with code 1 on failure.

**Example:**

```bash
clawreform config test-key groq
# Testing groq (GROQ_API_KEY)... OK
```

---

## Quick Chat

### clawreform chat

Quick alias for starting a chat session.

```
clawreform chat [<AGENT>]
```

**Arguments:**

| Argument | Description |
|---|---|
| `<AGENT>` | Optional agent name or UUID. |

**Behavior:**

- **Daemon mode:** Finds the agent by name or ID among running agents. If no agent name is given, uses the first available agent. If no agents exist, suggests `clawreform agent new`.
- **Standalone mode (no daemon):** Boots an in-process kernel and auto-spawns an agent from templates. Searches for an agent matching the given name, then falls back to `assistant`, then to the first available template.

This is the simplest way to start chatting -- it works with or without a daemon.

**Example:**

```bash
# Chat with the default agent
clawreform chat

# Chat with a specific agent by name
clawreform chat coder

# Chat with a specific agent by UUID
clawreform chat a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## Migration

### clawreform migrate

Migrate configuration and agents from another agent framework.

```
clawreform migrate --from <FRAMEWORK> [--source-dir <PATH>] [--dry-run]
```

**Options:**

| Option | Description |
|---|---|
| `--from <FRAMEWORK>` | Source framework. One of: `openclaw`, `langchain`, `autogpt`. |
| `--source-dir <PATH>` | Path to the source workspace. Auto-detected if not set (e.g. `~/.openclaw`, `~/.langchain`, `~/Auto-GPT`). |
| `--dry-run` | Show what would be imported without making changes. |

**Behavior:**

- Converts agent configurations, YAML manifests, and settings from the source framework into clawREFORM by aegntic.ai format.
- Saves imported data to `~/.clawreform/`.
- Writes a `migration_report.md` summarizing what was imported.

**Example:**

```bash
# Dry run migration from OpenClaw
clawreform migrate --from openclaw --dry-run

# Migrate from OpenClaw (auto-detect source)
clawreform migrate --from openclaw

# Migrate from LangChain with explicit source
clawreform migrate --from langchain --source-dir /home/user/.langchain

# Migrate from AutoGPT
clawreform migrate --from autogpt
```

---

## MCP Server

### clawreform mcp

Start an MCP (Model Context Protocol) server over stdio.

```
clawreform mcp
```

**Behavior:**

- Exposes running clawREFORM by aegntic.ai agents as MCP tools via JSON-RPC 2.0 over stdin/stdout with Content-Length framing.
- Each agent becomes a callable tool named `clawreform_agent_<name>` (hyphens replaced with underscores).
- Connects to a running daemon via HTTP if available; otherwise boots an in-process kernel.
- Protocol version: `2024-11-05`.
- Maximum message size: 10MB (security limit).

**Supported MCP methods:**

| Method | Description |
|---|---|
| `initialize` | Returns server capabilities and info. |
| `tools/list` | Lists all available agent tools. |
| `tools/call` | Sends a message to an agent and returns the response. |

**Tool input schema:**

Each agent tool accepts a single `message` (string) argument.

**Integration with Claude Desktop / other MCP clients:**

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "clawreform": {
      "command": "clawreform",
      "args": ["mcp"]
    }
  }
}
```

---

## Daemon Auto-Detect

The CLI uses a two-step mechanism to detect a running daemon:

1. **Read `daemon.json`:** On startup, the daemon writes `~/.clawreform/daemon.json` containing the listen address (e.g. `127.0.0.1:4332`). The CLI reads this file to learn where the daemon is.

2. **Health check:** The CLI sends `GET http://<listen_addr>/api/health` with a 2-second timeout. If the health check succeeds, the daemon is considered running and the CLI uses HTTP to communicate with it.

If either step fails (no `daemon.json`, stale file, health check timeout), the CLI falls back to in-process mode for commands that support it. Commands that require a daemon (workflows, triggers, channel test/enable/disable, dashboard) will exit with an error and a helpful message.

**Daemon lifecycle:**

```
clawreform start          # Starts daemon, writes daemon.json
                        # Other CLI instances detect daemon.json
clawreform status         # Connects to daemon via HTTP
Ctrl+C                  # Daemon shuts down, daemon.json removed

clawreform doctor --repair  # Cleans up stale daemon.json from crashes
```

---

## Environment File

clawREFORM by aegntic.ai loads `~/.clawreform/.env` into the process environment on every CLI invocation. System environment variables take priority over `.env` values.

The `.env` file stores API keys and secrets:

```bash
GROQ_API_KEY=gsk_...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
```

Manage keys with the `config set-key` / `config delete-key` commands rather than editing the file directly, as these commands enforce correct permissions.

---

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success. |
| `1` | General error (invalid arguments, failed operations, missing daemon, parse errors, spawn failures). |
| `130` | Interrupted by second `Ctrl+C` (force exit). |

---

## Examples

### First-time setup

```bash
# 1. Set your API key
export GROQ_API_KEY="gsk_your_key_here"

# 2. Initialize clawREFORM by aegntic.ai
clawreform init --quick

# 3. Start the daemon
clawreform start
```

### Daily usage

```bash
# Quick chat (auto-spawns agent if needed)
clawreform chat

# Chat with a specific agent
clawreform chat coder

# Check what's running
clawreform status

# Open the web dashboard
clawreform dashboard
```

### Agent management

```bash
# Spawn from a template
clawreform agent new assistant

# Spawn from a custom manifest
clawreform agent spawn ./agents/custom-agent/agent.toml

# List running agents
clawreform agent list

# Chat with an agent by UUID
clawreform agent chat <UUID>

# Kill an agent
clawreform agent kill <UUID>
```

### Workflow automation

```bash
# Create a workflow
clawreform workflow create ./review-pipeline.json

# List workflows
clawreform workflow list

# Run a workflow
clawreform workflow run <WORKFLOW_ID> "Review the latest PR"
```

### Event triggers

```bash
# Create a trigger that fires on agent spawn
clawreform trigger create <AGENT_ID> '{"agent_spawned":{"name_pattern":"*"}}' \
  --prompt "New agent spawned: {{event}}" \
  --max-fires 100

# List all triggers
clawreform trigger list

# List triggers for a specific agent
clawreform trigger list --agent-id <AGENT_ID>

# Delete a trigger
clawreform trigger delete <TRIGGER_ID>
```

### Skill management

```bash
# Search FangHub
clawreform skill search "code review"

# Install a skill
clawreform skill install code-reviewer

# List installed skills
clawreform skill list

# Create a new skill
clawreform skill create

# Remove a skill
clawreform skill remove code-reviewer
```

### Channel setup

```bash
# Interactive channel picker
clawreform channel setup

# Direct channel setup
clawreform channel setup telegram

# Check channel status
clawreform channel list

# Test a channel
clawreform channel test telegram

# Enable/disable channels
clawreform channel enable discord
clawreform channel disable slack
```

### Configuration

```bash
# View config
clawreform config show

# Get a specific value
clawreform config get default_model.provider

# Change provider
clawreform config set default_model.provider anthropic
clawreform config set default_model.model claude-sonnet-4-20250514
clawreform config set default_model.api_key_env ANTHROPIC_API_KEY

# Manage API keys
clawreform config set-key anthropic
clawreform config test-key anthropic
clawreform config delete-key openai

# Open in editor
clawreform config edit
```

### Migration from other frameworks

```bash
# Preview migration
clawreform migrate --from openclaw --dry-run

# Run migration
clawreform migrate --from openclaw

# Migrate from LangChain
clawreform migrate --from langchain --source-dir ~/.langchain
```

### MCP integration

```bash
# Start MCP server for Claude Desktop or other MCP clients
clawreform mcp
```

### Diagnostics

```bash
# Run all diagnostic checks
clawreform doctor

# Auto-repair issues
clawreform doctor --repair

# Machine-readable diagnostics
clawreform doctor --json
```

### Shell completions

```bash
# Generate and install completions for your shell
clawreform completion bash >> ~/.bashrc
clawreform completion zsh > "${fpath[1]}/_clawreform"
clawreform completion fish > ~/.config/fish/completions/clawreform.fish
```

---

## Supported LLM Providers

The following providers are recognized by `clawreform config set-key` and `clawreform doctor`:

| Provider | Environment Variable | Default Model |
|---|---|---|
| Groq | `GROQ_API_KEY` | `llama-3.3-70b-versatile` |
| Gemini | `GEMINI_API_KEY` or `GOOGLE_API_KEY` | `gemini-2.5-flash` |
| DeepSeek | `DEEPSEEK_API_KEY` | `deepseek-chat` |
| Anthropic | `ANTHROPIC_API_KEY` | `claude-sonnet-4-20250514` |
| OpenAI | `OPENAI_API_KEY` | `gpt-4o` |
| OpenRouter | `OPENROUTER_API_KEY` | `openrouter/auto` |
| Together | `TOGETHER_API_KEY` | -- |
| Mistral | `MISTRAL_API_KEY` | -- |
| Fireworks | `FIREWORKS_API_KEY` | -- |
| Perplexity | `PERPLEXITY_API_KEY` | -- |
| Cohere | `COHERE_API_KEY` | -- |
| xAI | `XAI_API_KEY` | -- |

Additional search/fetch provider keys: `BRAVE_API_KEY`, `TAVILY_API_KEY`.
