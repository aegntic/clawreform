# clawreform (npm CLI launcher)

Installs the native `clawreform` CLI from GitHub Releases and exposes it on your npm global PATH.

## Install

```bash
npm install -g clawreform
```

## Launch

```bash
clawreform
```

When run with no args in an interactive terminal, this npm launcher opens the web dashboard flow by default.
On first run, it also performs `clawreform setup --quick` automatically when config is missing.

## Verify

```bash
clawreform --version
```

## Notes

- This package downloads the matching binary for Linux, macOS, and Windows.
- No third-party runtime dependencies are used in this npm package.
- You can disable no-arg auto-dashboard behavior with `CLAWREFORM_NO_AUTO_DASHBOARD=1`.
