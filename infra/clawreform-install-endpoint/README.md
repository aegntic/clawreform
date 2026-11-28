# Install endpoint (`get.clawreform.com`)

A Cloudflare Worker that serves the clawREFORM install scripts:

| Path                           | Serves                |
| ------------------------------ | --------------------- |
| `/`, `/install`, `/install.sh` | `scripts/install.sh`  |
| `/install.ps1`                 | `scripts/install.ps1` |

Users pipe these scripts into a shell, so the Worker reads the scripts from one
pinned commit of `aegntic/clawreform` and checks each script before it serves it.

## How the check works

The Worker serves a script only when the script:

- contains the text that the clawREFORM installer contains, and
- does not contain the text that the installer of a different product contains.

When the script at the pinned commit does not pass the check, the Worker serves
the last script that passed the check, or it returns `503`. It does not serve a
script that did not pass the check.

## Serve a new version of the scripts

1. Merge the change to the install scripts.
2. Copy the full commit hash of the commit that holds the new scripts.
3. Set `INSTALL_COMMIT` in `src/pin.ts` to that hash.
4. Run `npm test` in this directory.
5. Run `cf deploy` in this directory.

Use a full commit hash. A branch name can change without a new deployment.

## Check the endpoint

```bash
curl -fsSL https://get.clawreform.com/ | head -n 3
curl -fsSI https://get.clawreform.com/ | grep -i x-installer
```

`X-Installer-Commit` is the pinned commit. `X-Installer-Source` is `github`,
`cache` or `stale`.

## Develop

```bash
npm install        # install the dependencies
npm test           # run the tests in the Workers runtime
npm run check      # format, lint and types
cf deploy --dry-run  # build and check, with no deployment
```
