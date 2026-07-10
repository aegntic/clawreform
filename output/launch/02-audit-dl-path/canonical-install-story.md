# Canonical Install Story

Audit date: 2026-03-29 (Australia/Sydney)

## Final recommendation

Use a two-step decision:

1. **Immediate public-alpha front door:** make **GitHub Releases** the only public install landing page until the broken surfaces are repaired.
2. **Steady-state canonical front door:** move all public entry points to **`https://clawreform.com/install`**, with GitHub Releases kept as the artifact backend, not the user-facing story.

This is the least risky path because GitHub Releases is the only live surface that currently contains real downloadable artifacts. The shell installer domains, docs path, and updater path are not trustworthy enough to serve as the canonical story today.

## What “canonical” should mean

Every public CTA should answer the same question in the same order:

1. **Most users:** download the desktop app.
2. **CLI users:** install via npm.
3. **Advanced users:** use Docker or build from source.
4. **GitHub Releases:** remains the source of binaries, checksums, and historical versions.

Do **not** market shell or PowerShell install again until those scripts are fully rebranded and the domains are live.

## Ship-now copy

Use this copy immediately if the goal is to stop the public drift without waiting on a new website page.

### Website hero / primary CTA

Button label:

```text
Download clawREFORM
```

Button URL:

```text
https://github.com/aegntic/clawreform/releases/latest
```

Supporting line:

```text
Windows and Linux installers, plus CLI archives, are available from the latest GitHub Release. npm install is available for CLI users.
```

Secondary CTA:

```text
View the repo
```

### README install section

```md
## Install

The safest public install path today is the latest GitHub Release:

- Desktop app: download the installer for your platform from [GitHub Releases](https://github.com/aegntic/clawreform/releases/latest)
- CLI: `npm install -g clawreform`
- Advanced: build from source with Cargo

We do not currently recommend the shell installer until the new install domain is live.
```

### Docs install intro

```md
## Installation

For the public alpha, use the latest [GitHub Release](https://github.com/aegntic/clawreform/releases/latest) as the source of truth for downloadable artifacts.

- Desktop app: recommended for most users
- npm: recommended for CLI users
- Cargo / source builds: recommended for contributors

Do not use the shell installer until the `clawreform.sh` path is restored.
```

## Target-state copy after `/install` exists

Once `https://clawreform.com/install` is live, all surfaces should point there and use the same copy.

### Homepage CTA

Primary:

```text
Install clawREFORM
```

Secondary:

```text
View Docs
```

### Install page hero

```text
Install clawREFORM
Desktop first. CLI when you want it. One install page for every platform.
```

### Install page body copy

```md
### Desktop app
Recommended for most users. Download the latest installer for Windows, macOS, or Linux.

### CLI
Prefer the command line? Install the launcher with:

```bash
npm install -g clawreform
```

### Advanced installs
Use Docker or build from source if you are deploying or contributing.

### All releases
Need a previous version, checksums, or raw artifacts? Visit GitHub Releases.
```

### README top-nav change

Replace any direct `Docs` or install CTA that points at GitHub or a dead domain with:

```text
Website | Install | Docs | GitHub | Discussions
```

Where:

- `Install` -> `https://clawreform.com/install`
- `Docs` -> `https://clawreform.com/docs`

## What not to say until fixed

Do not use any of the following public claims yet:

- “Install in 30 seconds with `clawreform.sh`”
- “Desktop updates install automatically in the background”
- “Download the macOS `.dmg` from the latest release”
- “Docs are at `clawreform.com/docs`”

## Why this recommendation wins

- It matches the only live backend that already has downloadable artifacts.
- It removes dead domains from the user journey.
- It gives the website a single install narrative instead of dumping users into the repo.
- It preserves npm as a valid CLI path without pretending it is the simplest path for everyone.
