# Path Drift Report

Audit date: 2026-03-29 (Australia/Sydney)

## Executive verdict

The current public install story is not launch-safe. Users are sent to dead domains, the shell installers are still an `OpenFang` fork, the website docs path is missing, and the desktop updater path advertised in code and docs is not live.

## P0: Must fix before public-alpha install push

### 1. Dead install domains are advertised as primary paths

- `README.md` tells users to run `curl -fsSL https://clawreform.sh/install | sh` and `irm https://clawreform.sh/install.ps1 | iex`.
- `docs/getting-started.md` promotes `https://clawreform.sh`.
- `docs/cli-reference.md` promotes `https://get.clawreform.ai | sh`.
- On 2026-03-29, `clawreform.sh`, `clawreform.sh/install`, `clawreform.sh/install.ps1`, and `get.clawreform.ai` did not resolve.

Impact:
- New users following the README or docs hit a dead end immediately.
- Any marketing copy that references shell install is currently false.

### 2. Both public install scripts still install `OpenFang`, not `clawreform`

- `scripts/install.sh` still says `OpenFang installer`, targets `RightNow-AI/openfang`, downloads `openfang-$PLATFORM.tar.gz`, installs to `~/.openfang/bin`, and ends with `openfang init`.
- `scripts/install.ps1` still targets `RightNow-AI/openfang`, downloads `openfang-*.zip`, copies `openfang.exe`, and writes to `.openfang\\bin`.

Impact:
- Even after DNS is fixed, these scripts install the wrong product and wrong binary name.
- The shell path is not merely stale; it is functionally incorrect.

### 3. The public website has no working docs or install front door

- `README.md` top nav links to `https://clawreform.com/docs`.
- On 2026-03-29, `https://clawreform.com/docs` returned `404`.
- `https://clawreform.com/install` also returned `404`.
- The live homepage is up, but it does not expose a canonical install flow.

Impact:
- The brand site cannot serve as the source of truth.
- README navigation currently sends users into a broken docs path.

### 4. Desktop update and macOS install promises do not match the live release

- `crates/clawreform-desktop/tauri.conf.json` points updater clients to `https://github.com/aegntic/clawreform/releases/latest/download/latest.json`.
- On 2026-03-29, that `latest.json` URL returned `404`.
- `docs/getting-started.md` says the latest release includes a macOS `.dmg`.
- The live `v0.3.0` release published on 2026-03-07 exposes Windows installers, Linux desktop packages, and CLI archives, but no macOS desktop bundle and no updater manifest.

Impact:
- Desktop auto-update is effectively dead.
- macOS desktop install is publicly promised without a matching downloadable artifact.

## P1: High-priority drift that undermines trust

### 5. The repo/org identity is split across `aegntic`, `RightNow-AI`, and `OpenFang`

- Live repo, release assets, npm package, and website source code use `aegntic/clawreform`.
- `docs/getting-started.md`, `docs/production-checklist.md`, `docs/troubleshooting.md`, and generated config comments in `crates/clawreform-cli/src/main.rs` still reference `RightNow-AI/clawreform`.
- Install scripts still reference `RightNow-AI/openfang`.

Impact:
- Users cannot tell which GitHub org is canonical.
- Search, trust, and copy-paste success all degrade.

### 6. npm is ahead of GitHub Releases, so the version story is already split

- npm registry latest is `0.3.5`.
- Workspace, desktop config, README badge, SDK package, and latest GitHub release are all `0.3.0`.
- `packages/clawreform-npm/lib/install.js` handles this by trying the package version first, then falling back to the latest GitHub release tag if assets are missing.

Impact:
- `npm install -g clawreform` can deliver a launcher package at `0.3.5` that fetches a `v0.3.0` binary.
- Users and support docs will disagree about the installed version.

### 7. The website’s primary CTA does not lead to a real install decision

- The repo website source (`sota-fullstack-suite/packages/web-app/src/components/Navigation.tsx`, `HeroSection.tsx`, `CTASection.tsx`) points “Get Started” to the GitHub repo.
- Footer “Documentation” also points to the GitHub repo, not docs.
- The live site does not provide platform selection or an install landing page.

Impact:
- Homepage traffic is dumped into repo browsing instead of a crisp install flow.
- Non-technical users have no guided path.

### 8. Release workflow messaging and live release messaging are out of sync

- `.github/workflows/release.yml` includes an installation section in the release body and claims `includeUpdaterJson: true`.
- The live `v0.3.0` release body is a short changelog summary and does not include the install instructions from the workflow.

Impact:
- Operators cannot trust the workflow file as the description of what users actually see.

## P2: Cleanup items that still matter

### 9. Public version copy is inconsistent

- README badge shows `0.3.0`.
- npm package is `0.3.5`.
- CLI docs still show sample output with `v0.1.0`.

Impact:
- Support and screenshots will age badly fast.
- Version mismatch makes install troubleshooting noisier than necessary.

### 10. CLI help and docs still point users to GitHub instead of one canonical install page

- `crates/clawreform-cli/src/main.rs` points `Docs:` to the GitHub repo.
- The fallback hint for desktop suggests `cargo install clawreform-desktop`, which is a developer path, not a public download story.

Impact:
- Even after fixing the site, command-line affordances will keep spraying users across multiple surfaces unless updated.

## Priority summary

1. Kill or fix every dead domain reference.
2. Rewrite both installers from `OpenFang` to `clawreform`.
3. Restore a real docs/install front door on `clawreform.com`.
4. Make desktop promises true: ship `latest.json` and stop claiming macOS desktop until a bundle is live.
5. Collapse repo/org/version references onto one canonical identity and release line.
