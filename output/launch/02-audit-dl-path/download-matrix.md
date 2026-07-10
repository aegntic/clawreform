# Download Matrix

Audit date: 2026-03-29 (Australia/Sydney)

Current public install surfaces do not tell one consistent story. The table below captures the live and repo-backed entry points that a user can realistically encounter.

| Surface | Public URL or repo path | Platform | Artifact or action | Owner / source of truth | Current status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| GitHub latest release page | `https://github.com/aegntic/clawreform/releases/latest` | all | Primary public release landing page | GitHub Releases | Live | Redirects to `v0.3.0` on 2026-03-29 |
| GitHub latest release assets | `https://github.com/aegntic/clawreform/releases/tag/v0.3.0` | all | Desktop installers and CLI archives | GitHub Releases + `.github/workflows/release.yml` | Live, but incomplete vs promises | API shows 19 assets on `2026-03-07`, including Windows installers, Linux AppImage/deb/rpm, and CLI tarballs/zips |
| Desktop updater feed | `https://github.com/aegntic/clawreform/releases/latest/download/latest.json` | desktop | Auto-update manifest for Tauri app | `crates/clawreform-desktop/tauri.conf.json` | Broken | Returns `404`; updater endpoint is configured to expect it |
| Desktop release promise | `docs/getting-started.md` | desktop | `.msi`, `.dmg`, `.AppImage`, `.deb` | docs + release workflow | Drifted | Docs promise macOS `.dmg`; live release assets do not include any macOS desktop bundle |
| README install section | `README.md` | all | Shell, PowerShell, npm install | repo README | Broken / drifted | Promotes `clawreform.sh/install` and `clawreform.sh/install.ps1`; domain does not resolve |
| Website homepage | `https://clawreform.com` | all | “Get Started” marketing CTA | live website deployment | Drifted | Homepage is live, but current public site does not expose a canonical install or docs path |
| Website docs path | `https://clawreform.com/docs` | all | Docs landing page | website deployment | Broken | Returns `404`; README top nav links here |
| Website install path | `https://clawreform.com/install` | all | Install landing page | website deployment | Broken | Returns `404`; several marketing assets reference it |
| Shell install domain | `https://clawreform.sh` and `https://clawreform.sh/install` | Linux / macOS | One-line shell installer | infra + `scripts/install.sh` | Broken | Domain does not resolve |
| PowerShell install domain | `https://clawreform.sh/install.ps1` | Windows | One-line PowerShell installer | infra + `scripts/install.ps1` | Broken | Domain does not resolve |
| Shell installer implementation | `scripts/install.sh` | Linux / macOS | Downloads release archive and installs binary | repo scripts | Critically drifted | Still branded `OpenFang`; points to `RightNow-AI/openfang`; installs into `~/.openfang/bin`; expects `openfang-*` assets |
| PowerShell installer implementation | `scripts/install.ps1` | Windows | Downloads zip and installs binary | repo scripts | Critically drifted | Still branded `OpenFang`; points to `RightNow-AI/openfang`; installs `openfang.exe` into `.openfang\\bin` |
| npm package | `https://registry.npmjs.org/clawreform` | Linux / macOS / Windows | `npm install -g clawreform` launcher | npm package `packages/clawreform-npm` | Live, but version-skewed | Registry latest is `0.3.5`; published 2026-03-07 |
| npm launcher implementation | `packages/clawreform-npm/lib/install.js` | Linux / macOS / Windows | Downloads matching binary from GitHub Releases | npm package + GitHub Releases | Works with fallback, but drifted | Prefers package version, then silently falls back to latest GitHub tag if release asset missing |
| npm package README | `packages/clawreform-npm/README.md` | Linux / macOS / Windows | CLI install guidance | npm package | Mostly coherent | Correct repo and product name; still inherits version skew from package vs releases |
| Getting started guide | `docs/getting-started.md` | all | Full install decision tree | repo docs | Drifted | Uses `RightNow-AI/clawreform`, dead `clawreform.sh`, and promises desktop assets not present in latest release |
| CLI reference install section | `docs/cli-reference.md` | CLI users | Shell install guidance | repo docs | Broken | Promotes `https://get.clawreform.ai`, which does not resolve |
| CLI help text | `crates/clawreform-cli/src/main.rs` | CLI users | Docs URL in `--help` | repo code | Drifted | Sends users to GitHub repo, not a canonical docs/install page |
| Release workflow promise | `.github/workflows/release.yml` | all | Release body, assets, updater JSON | CI/CD | Drifted from live output | Workflow comments and config promise `.dmg` and `latest.json`; live release does not expose them |

## Live proof captured

- `output/launch/02-audit-dl-path/screenshots/clawreform-home.png`
- `output/launch/02-audit-dl-path/screenshots/github-releases.png`
- `output/launch/02-audit-dl-path/screenshots/npm-registry-clawreform.png`
