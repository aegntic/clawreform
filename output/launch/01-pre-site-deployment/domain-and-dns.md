# Domain and DNS

## Current Live State

Verified on 2026-03-29:

- `https://clawreform.com` returns `200`
- `https://www.clawreform.com` returns `200`
- both hosts are served by Cloudflare
- `https://clawreform.com/sitemap.xml` returns `404`
- `https://clawreform.com/robots.txt` is Cloudflare-managed and does not include a sitemap line

This means DNS is already pointed at Cloudflare. The launch problem is not domain acquisition or nameserver setup. The problem is route/version/canonical correctness.

## Recommended Canonical Host

Recommended canonical host: `https://clawreform.com`

Reasoning:
- the source repo already centers metadata around a single `site.url`
- apex is already live
- a single canonical host simplifies metadata, robots, sitemap, and checkout redirect logic

Required redirect rule:
- `https://www.clawreform.com/*` -> `https://clawreform.com/$1`

## Required Production Environment Assumptions

These values must be correct before promotion:

```bash
NEXT_PUBLIC_SITE_URL=https://clawreform.com
NEXT_PUBLIC_GITHUB_URL=<real repo URL>
```

Optional but required if those features ship on launch day:

```bash
NEXT_PUBLIC_SUPABASE_URL=<real value>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<real value>
SUPABASE_SERVICE_ROLE_KEY=<real value>
NEXT_PUBLIC_WAITLIST_MODE=supabase

STRIPE_SECRET_KEY=<real value>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<real value>
STRIPE_WEBHOOK_SECRET=<real value>
NEXT_PUBLIC_STRIPE_STUDIO_PRICE_ID=<real value>
NEXT_PUBLIC_STRIPE_STUDIO_PAYMENT_LINK=<real value>
```

## Cloudflare Route Checklist

Because the zone is already on Cloudflare, use route promotion rather than a DNS migration.

1. Confirm the fixed deployment is available on a preview or `workers.dev` URL.
2. Bind `clawreform.com/*` to that deployment.
3. Bind `www.clawreform.com/*` to the same deployment only if the redirect is implemented there or at the Cloudflare rules layer.
4. Add an explicit redirect from `www` to apex.
5. Purge cache.

## DNS / Route Risks to Clear Before Launch

1. Canonical drift.
If both apex and `www` stay `200`, search engines will see duplicate hosts.

2. Localhost leakage.
If `NEXT_PUBLIC_SITE_URL` is missing, source code falls back to `http://localhost:3000` for metadata, robots, sitemap, and checkout redirects.

3. Mixed runtime assumptions.
The source repo currently mixes static-export configuration with API routes and metadata routes. Route bindings are only safe after that is corrected.

## Launch-Day Validation

```bash
curl -I https://clawreform.com
curl -I https://www.clawreform.com
curl -I https://clawreform.com/robots.txt
curl -I https://clawreform.com/sitemap.xml
curl -s https://clawreform.com | sed -n '/<head>/,/<\/head>/p'
```

Required outcomes:
- apex returns `200`
- `www` redirects to apex
- `robots.txt` returns `200`
- `robots.txt` advertises `https://clawreform.com/sitemap.xml`
- `sitemap.xml` returns `200`
- page source includes canonical metadata for the apex host
