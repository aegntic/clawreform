# Handoff

Audit date: 2026-03-29 (Australia/Sydney)

## Outcome

Task 2 is complete. The requested artifacts are in this directory:

- `download-matrix.md`
- `path-drift-report.md`
- `canonical-install-story.md`

Proof captured:

- `screenshots/clawreform-home.png`
- `screenshots/github-releases.png`
- `screenshots/npm-registry-clawreform.png`

## Launch recommendation

Current verdict: **no-go for a clean public install push** until the P0 items in `path-drift-report.md` are addressed.

The safest public-alpha move today is:

1. Remove or suppress every reference to `clawreform.sh`, `get.clawreform.ai`, and `clawreform.com/docs`.
2. Point all public CTAs to `https://github.com/aegntic/clawreform/releases/latest`.
3. Keep `npm install -g clawreform` as the advanced CLI option.
4. Do not market shell install or desktop auto-update until the underlying paths work.

## Most important blockers for Task 3

1. **Installer rewrite:** `scripts/install.sh` and `scripts/install.ps1` must be converted from `OpenFang` to `clawreform`.
2. **Domain and routing:** `clawreform.sh` and `clawreform.com/docs` or `clawreform.com/install` must actually exist before any copy points there.
3. **Release truthfulness:** desktop packaging and updater feed need to match what the docs promise, especially macOS desktop artifacts and `latest.json`.
4. **Version alignment:** npm `0.3.5` is ahead of the latest GitHub release `v0.3.0`; decide whether to cut a matching release or roll npm back to the release line.
5. **Repo identity cleanup:** remove lingering `RightNow-AI` and `OpenFang` references from docs, scripts, CLI-generated config, and operational checklists.

## Suggested next sequence

1. Use this audit as the input to task 3’s release asset checklist.
2. Fix the install scripts and public URLs before polishing website copy.
3. Only after the artifact paths are trustworthy, introduce `clawreform.com/install` as the canonical front door.
