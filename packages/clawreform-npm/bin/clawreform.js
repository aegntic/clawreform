#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");
const { ensureBinaryInstalled } = require("../lib/install");

const API_KEY_VARS = [
  "OPENROUTER_API_KEY",
  "GROQ_API_KEY",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "DEEPSEEK_API_KEY",
  "MINIMAX_API_KEY",
  "MISTRAL_API_KEY",
  "TOGETHER_API_KEY",
  "FIREWORKS_API_KEY",
  "COHERE_API_KEY",
  "PERPLEXITY_API_KEY",
  "XAI_API_KEY"
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeArgs(argv) {
  const args = argv.slice(2);

  // UX default for npm installs:
  // In an interactive terminal, no-arg invocation should open the GUI dashboard.
  const noArgs = args.length === 0;
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const autoDashboardDisabled =
    process.env.CLAWREFORM_NO_AUTO_DASHBOARD === "1" ||
    process.env.CLAWREFORM_NO_AUTO_DASHBOARD === "true";

  if (noArgs && interactive && !autoDashboardDisabled) {
    process.stderr.write("No command provided. Launching web dashboard.\n");
    return ["dashboard"];
  }

  // Friendly aliases for non-technical users.
  if (args[0] === "gui" || args[0] === "web") {
    return ["dashboard", ...args.slice(1)];
  }

  return args;
}

function clawreformHome() {
  return path.join(os.homedir(), ".clawreform");
}

function configPath() {
  return path.join(clawreformHome(), "config.toml");
}

function daemonInfoPath() {
  return path.join(clawreformHome(), "daemon.json");
}

function dotEnvPath() {
  return path.join(clawreformHome(), ".env");
}

function daemonBaseUrlFromFile() {
  try {
    const raw = fs.readFileSync(daemonInfoPath(), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.listen_addr === "string" && parsed.listen_addr.trim()) {
      return `http://${parsed.listen_addr.replace("0.0.0.0", "127.0.0.1")}`;
    }
  } catch {
    // ignore
  }
  return null;
}

function hasConfiguredApiKey() {
  for (const key of API_KEY_VARS) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      return true;
    }
  }

  try {
    const content = fs.readFileSync(dotEnvPath(), "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const idx = trimmed.indexOf("=");
      if (idx <= 0) {
        continue;
      }
      const key = trimmed.slice(0, idx).trim();
      const rawValue = trimmed.slice(idx + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, "").trim();
      if (API_KEY_VARS.includes(key) && value) {
        return true;
      }
    }
  } catch {
    // ignore missing/unreadable .env
  }

  return false;
}

async function daemonHealthy(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: { "User-Agent": "clawreform-npm-launcher" }
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForDaemonReady(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const baseUrl = daemonBaseUrlFromFile();
    if (baseUrl && (await daemonHealthy(baseUrl))) {
      return baseUrl;
    }
    await sleep(500);
  }
  return null;
}

function runQuickSetup(binaryPath) {
  if (fs.existsSync(configPath())) {
    return true;
  }

  process.stderr.write("First run detected. Applying quick setup...\n");
  const result = spawnSync(binaryPath, ["setup", "--quick"], {
    stdio: "inherit",
    env: process.env
  });

  if (result.error) {
    process.stderr.write(`Quick setup failed: ${result.error.message}\n`);
    return false;
  }
  return result.status === 0;
}

function spawnDaemon(binaryPath, injectPlaceholderKeys) {
  const env = { ...process.env };
  if (injectPlaceholderKeys) {
    for (const key of API_KEY_VARS) {
      if (!env[key] || !String(env[key]).trim()) {
        env[key] = "clawreform-placeholder-key";
      }
    }
  }

  try {
    const child = spawn(binaryPath, ["start"], {
      detached: true,
      stdio: "ignore",
      env,
      windowsHide: true
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

function openBrowser(url) {
  try {
    if (process.platform === "darwin") {
      return spawnSync("open", [url], { stdio: "ignore" }).status === 0;
    }
    if (process.platform === "win32") {
      return (
        spawnSync("cmd.exe", ["/c", "start", "", url], {
          stdio: "ignore",
          windowsHide: true
        }).status === 0
      );
    }
    return spawnSync("xdg-open", [url], { stdio: "ignore" }).status === 0;
  } catch {
    return false;
  }
}

async function runDashboardFlow(binaryPath) {
  if (!runQuickSetup(binaryPath)) {
    process.stderr.write("Setup did not complete. Run: clawreform setup --quick\n");
    return 1;
  }

  let baseUrl = await waitForDaemonReady(2000);
  if (!baseUrl) {
    const injectPlaceholderKeys = !hasConfiguredApiKey();
    if (injectPlaceholderKeys) {
      process.stderr.write(
        "No API key found yet. Starting in setup mode so you can finish setup in the dashboard.\n"
      );
    }
    process.stderr.write("Starting background daemon...\n");
    if (!spawnDaemon(binaryPath, injectPlaceholderKeys)) {
      process.stderr.write("Could not start daemon process.\n");
      process.stderr.write("Run manually: clawreform start\n");
      return 1;
    }
    baseUrl = await waitForDaemonReady(45000);
  }

  if (!baseUrl) {
    process.stderr.write("Daemon did not become ready in time.\n");
    process.stderr.write("Run manually: clawreform start\n");
    return 1;
  }

  const url = `${baseUrl}/`;
  process.stderr.write(`Opening dashboard: ${url}\n`);
  if (!openBrowser(url)) {
    process.stderr.write(`Open this URL manually: ${url}\n`);
  }
  return 0;
}

async function main() {
  let binaryPath;
  try {
    binaryPath = await ensureBinaryInstalled();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`clawreform npm launcher failed to install runtime binary: ${message}`);
    process.exit(1);
  }

  const args = normalizeArgs(process.argv);

  if (args[0] === "dashboard") {
    process.exit(await runDashboardFlow(binaryPath));
  }

  const result = spawnSync(binaryPath, args, {
    stdio: "inherit",
    env: process.env
  });

  if (result.error) {
    console.error(`Failed to run clawreform binary: ${result.error.message}`);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

main();
