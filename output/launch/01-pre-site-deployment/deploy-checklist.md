# Deploy Checklist

## Deployment Target Decision

Recommended target: `Cloudflare`

Why Cloudflare wins here:
- the live domain is already served through Cloudflare
- the real source repo already contains `wrangler.jsonc`
- the repo already includes `open-next.config.ts`
- `package.json` already exposes `npm run deploy:cloudflare`
- rollback stays within the current provider instead of introducing a second platform during launch prep

Why not Netlify first:
- `netlify.toml` is present, but the real repo is no longer in a clean Netlify-ready state
- the current config publishes `.next`, while the app currently mixes export mode, metadata routes, and API routes
- moving providers does not solve the actual source issues

Why not Vercel first:
- no Vercel config exists in the real source repo
- domain is already live on Cloudflare
- provider migration adds operational drag without removing the build/runtime blockers

## Release Gate

Do not deploy until every item below is green.

### A. Fix source blockers in `/home/ae/clawreform/openclaw-site`

1. Replace the recursive `/pricing` page.
2. Remove `output: 'export'` from `next.config.mjs`.
3. Stop marking POST route handlers as `force-static`.
4. Decide which metadata routes stay static and verify they still build under the Cloudflare OpenNext path.
5. Confirm the live host choice: `clawreform.com` or `www.clawreform.com`.
6. Update all site metadata to that canonical host.

### B. Set production environment variables

Minimum required for launch-safe metadata and lead capture:

```bash
NEXT_PUBLIC_SITE_URL=https://clawreform.com
NEXT_PUBLIC_GITHUB_URL=<real repo URL>
NEXT_PUBLIC_SUPABASE_URL=<if waitlist is live>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<if waitlist is live>
SUPABASE_SERVICE_ROLE_KEY=<if waitlist is live>
NEXT_PUBLIC_WAITLIST_MODE=supabase
STRIPE_SECRET_KEY=<if pricing checkout is live>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<if pricing checkout is live>
STRIPE_WEBHOOK_SECRET=<if pricing checkout is live>
NEXT_PUBLIC_STRIPE_STUDIO_PRICE_ID=<if pricing checkout is live>
NEXT_PUBLIC_STRIPE_STUDIO_PAYMENT_LINK=<if pricing checkout is live>
```

If pricing is not part of launch day, explicitly disable or remove checkout CTA behavior rather than shipping broken endpoints.

### C. Re-run local verification

From `/home/ae/clawreform/openclaw-site`:

```bash
npm ci
npm run build
npm run preview
curl -I http://127.0.0.1:8788/
curl -I http://127.0.0.1:8788/pricing
curl -I http://127.0.0.1:8788/robots.txt
curl -I http://127.0.0.1:8788/sitemap.xml
curl -I http://127.0.0.1:8788/api/health
```

Required outcomes:
- `/` returns `200`
- `/pricing` returns `200`
- `/robots.txt` returns `200` and includes the production sitemap
- `/sitemap.xml` returns `200`
- `/api/health` returns `200`
- no localhost URLs appear in page source, robots, sitemap, or checkout redirects

### D. Preview before production cutover

```bash
cd /home/ae/clawreform/openclaw-site
npm run deploy:cloudflare
```

Before binding production routes:
- inspect the generated `workers.dev` or preview URL
- verify homepage desktop
- verify homepage mobile
- verify waitlist POST behavior
- verify `/pricing`
- verify `/robots.txt`
- verify `/sitemap.xml`

### E. Promote on Cloudflare

1. Bind the fixed deployment to the production route(s).
2. Make one host canonical.
3. Redirect the non-canonical host.
4. Purge Cloudflare cache after route promotion.
5. Run a five-minute smoke test on the live domain.

## Production Smoke Test

Run immediately after promotion:

```bash
curl -I https://clawreform.com
curl -I https://www.clawreform.com
curl -I https://clawreform.com/pricing
curl -I https://clawreform.com/robots.txt
curl -I https://clawreform.com/sitemap.xml
```

Pass criteria:
- exactly one canonical host remains primary
- non-canonical host redirects
- `/pricing` works
- `/robots.txt` advertises the sitemap
- `/sitemap.xml` returns `200`

## Rollback

Cloudflare rollback plan:

1. Keep the current teaser deployment untouched until the fixed site passes smoke.
2. If the new deploy fails, revert production traffic to the previous Cloudflare deployment or route target.
3. Purge Cloudflare cache.
4. Re-run the live smoke test.

Rollback triggers:
- homepage returns non-200
- `/pricing` errors
- waitlist POST fails unexpectedly
- `/sitemap.xml` is not `200`
- both apex and `www` remain live with no redirect

## Operator Note

If launch must happen before the full site is fixed, the safest move is to keep the current teaser live on Cloudflare and defer cutover. Do not swap in `openclaw-site` until the build, sitemap, and canonical host issues are all resolved.
