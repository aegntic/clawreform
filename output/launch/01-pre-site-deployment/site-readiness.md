# Site Readiness Audit

## Verdict

Status: `NO-GO` for redeploy today.

The intended public-site source is not in the assigned worktree. The real launch source is the nested repo at `/home/ae/clawreform/openclaw-site`, and that source still fails build/export validation. The live domain `https://clawreform.com` is already on Cloudflare, but it is missing a healthy sitemap and canonical host handling.

## Audited Surfaces

### 1. Assigned task brief

- `docs/launch-tasks/1_clawREFORM_pre-site-deployment.md`
- `docs/design/launch-metallic-baseline.md`

### 2. Authoritative site source actually in use

- `/home/ae/clawreform/openclaw-site`

### 3. Current live public site

- `https://clawreform.com`
- `https://www.clawreform.com`

### 4. Broken fallback app inside this worktree

- `sota-fullstack-suite/packages/web-app`

This fallback app is not the launch target, but it is also not deployable.

## Critical Findings

### 1. Source-of-truth drift

The brief says to audit `openclaw-site/`, but that directory is absent from the assigned worktree. The actual source exists outside the worktree as a nested repo.

Impact:
- The assigned worktree is not sufficient for a trustworthy launch audit on its own.
- Any operator using only this worktree would inspect the wrong app.

### 2. `openclaw-site` build fails on `/pricing`

Verified locally:

```bash
cd /home/ae/clawreform/openclaw-site
npm run build
```

Observed result:
- compile succeeds
- static generation fails on `/pricing`
- exported error: `RangeError: Maximum call stack size exceeded`

Root cause in source:

```tsx
// app/pricing/page.tsx
import Page from "./page";

export default function Pricing() {
  return <Page />;
}
```

The page imports itself and recursively renders forever.

Proof:
- `screenshots/openclaw-site-pricing-desktop.png`

### 3. `output: 'export'` conflicts with the site shape

`/home/ae/clawreform/openclaw-site/next.config.mjs` currently forces static export:

```js
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true }
};
```

That conflicts with the current app design:
- App Router metadata routes are present: `app/robots.ts`, `app/sitemap.ts`
- API routes are present: `app/api/waitlist/route.ts`, `app/api/checkout/route.ts`, `app/api/health/route.ts`
- POST route handlers are incorrectly marked `dynamic = 'force-static'`

Observed effects:
- historical screenshot shows sitemap generation error under export mode
- live `https://clawreform.com/sitemap.xml` is `404`
- the current deploy shape is not aligned with the source repo’s runtime expectations

Proof:
- `screenshots/openclaw-site-sitemap.png`

### 4. Live SEO basics are incomplete

Verified live on 2026-03-29:
- `https://clawreform.com` returns `200`
- `https://www.clawreform.com` returns `200`
- neither host redirects to the other
- live homepage `<head>` has no canonical link
- `https://clawreform.com/sitemap.xml` returns `404`
- `https://clawreform.com/robots.txt` is Cloudflare-managed and does not advertise the sitemap

Impact:
- two production hosts are simultaneously live with no canonical decision
- sitemap-based discovery is broken
- robots behavior is platform-managed, not site-authored

Proof:
- `screenshots/live-clawreform-home-desktop.png`
- `screenshots/live-clawreform-home-mobile.png`

### 5. Domain and metadata assumptions are unstable

In source, `lib/site.ts` defaults the site URL to localhost:

```ts
url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
```

That value is consumed by:
- `app/layout.tsx` metadata base
- `app/robots.ts` sitemap URL
- `app/sitemap.ts` route URLs
- `app/api/checkout/route.ts` success and cancel URLs

Impact:
- any missing or incorrect production env var leaks localhost into metadata, robots, sitemap, or checkout redirects

### 6. Environment variables exist, but production readiness is partial

Documented env vars in `.env.example`:
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GITHUB_URL`
- `NEXT_PUBLIC_WAITLIST_MODE`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_STUDIO_PRICE_ID`
- `NEXT_PUBLIC_STRIPE_STUDIO_PAYMENT_LINK`

Readiness issues:
- live site clearly is not serving the current source repo yet
- checkout and waitlist routes need secrets if they are meant to be live
- README promises `.env.example`-driven setup, but the live site behaves like a separate teaser deployment

### 7. Repo docs overstate what actually exists

`openclaw-site/README.md` claims pages like `/platform`, `/architecture`, `/docs`, and `/contact`, but the app folder only contains:
- `/`
- `/pricing`
- `/robots.txt`
- `/sitemap.xml`
- three API routes

Impact:
- operator expectations and actual shipped scope are mismatched
- public launch copy is ahead of implementation

### 8. Metallic baseline is not yet the live visual system

The acceptance reference asks for a machined-metal, amber-under-glow launch surface.

The currently live site is instead a teal radar/control-room teaser. It is visually coherent, but it is not the metallic baseline described in `docs/design/launch-metallic-baseline.md`.

Impact:
- visual acceptance is not met, even before the build/config blockers are considered

## Secondary Finding: in-worktree fallback app is also broken

The Next app at `sota-fullstack-suite/packages/web-app` fails for separate reasons:
- clean root install fails on `@fastify/helmet@^11.2.2` in `packages/api-gateway`
- preview for `/` returns `500`
- production build fails on unresolved aliases and shared-ui export issues

Proof captured in this pass:
- `proof/homepage-desktop.png`
- `proof/homepage-mobile.png`
- `proof/build-proof.png`

This is not the launch target, but it confirms there is no backup deployable public site inside the assigned worktree.

## Readiness Matrix

| Area | Status | Notes |
| --- | --- | --- |
| Correct source identified | Partial | actual source found, but outside assigned worktree |
| Local build of real site | Blocked | `/pricing` recursion breaks build |
| Current live domain | Partial | serving teaser on Cloudflare |
| Canonical host handling | Blocked | apex and `www` both return `200` |
| Robots | Partial | Cloudflare-managed, no sitemap advertised |
| Sitemap | Blocked | live `404` |
| Waitlist route | Partial | source route exists, but deploy/runtime mismatch unresolved |
| Checkout route | Partial | source route exists, needs env + runtime fix |
| Env var readiness | Partial | documented, but production mapping unclear |
| Rollback path | Good | Cloudflare is already live, so rollback can stay inside one provider |
| Metallic baseline | Blocked | live visuals do not match acceptance reference |

## Recommended Decision

`NO-GO` for redeploy today.

The shortest safe path is:
1. Treat `/home/ae/clawreform/openclaw-site` as the only real launch source.
2. Fix the source blockers there first.
3. Keep Cloudflare as the deployment target because the live domain is already on Cloudflare and the repo already has `wrangler.jsonc`, `open-next.config.ts`, and a Cloudflare deploy script.

## Proof Inventory

- `screenshots/live-clawreform-home-desktop.png`
- `screenshots/live-clawreform-home-mobile.png`
- `screenshots/openclaw-site-pricing-desktop.png`
- `screenshots/openclaw-site-sitemap.png`
- `proof/homepage-desktop.png`
- `proof/homepage-mobile.png`
- `proof/build-proof.png`
