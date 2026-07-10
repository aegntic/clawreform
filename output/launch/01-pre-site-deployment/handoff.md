# Handoff

## Final Recommendation

Do not redeploy the public site today.

The correct source of truth is `/home/ae/clawreform/openclaw-site`, not the broken Next app under `sota-fullstack-suite/packages/web-app`. That real source still fails build/export validation, and the live domain currently has SEO and host-canonical issues.

Recommended launch path:
- keep `Cloudflare` as the target
- fix `openclaw-site`
- preview on Cloudflare first
- promote only after sitemap, pricing, and canonical-host checks pass

## Exact Next Steps

1. In `/home/ae/clawreform/openclaw-site`, replace the recursive `/pricing` page.
2. Remove `output: 'export'` from `next.config.mjs`.
3. Remove `dynamic = 'force-static'` from POST route handlers.
4. Set `NEXT_PUBLIC_SITE_URL=https://clawreform.com` in production.
5. Rebuild locally with `npm ci && npm run build`.
6. Verify preview with `npm run preview`.
7. Confirm `/robots.txt` and `/sitemap.xml` both return `200` and use the apex host.
8. Deploy with `npm run deploy:cloudflare`.
9. Make `https://clawreform.com` canonical and redirect `www`.
10. Purge cache and run live smoke tests.

## Why Cloudflare

Cloudflare is already live for the domain, and the real site repo already includes Cloudflare-native deployment files:
- `wrangler.jsonc`
- `open-next.config.ts`
- `npm run deploy:cloudflare`

That makes Cloudflare the least disruptive path and the cleanest rollback path.

## Proof Pack

Live site proof:
- `screenshots/live-clawreform-home-desktop.png`
- `screenshots/live-clawreform-home-mobile.png`

Real source failure proof:
- `screenshots/openclaw-site-pricing-desktop.png`
- `screenshots/openclaw-site-sitemap.png`

Fallback in-worktree app failure proof:
- `proof/homepage-desktop.png`
- `proof/homepage-mobile.png`
- `proof/build-proof.png`

## Launch Call

Current call: `NO-GO`

Green-light conditions:
- `openclaw-site` builds cleanly
- `/pricing` works
- `/sitemap.xml` is live
- `robots.txt` points to the production sitemap
- only one canonical host remains live
- waitlist and checkout behavior match the chosen launch scope
