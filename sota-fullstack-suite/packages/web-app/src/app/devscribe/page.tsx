import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@sota/shared-ui';

const chromeStoreUrl = 'https://chromewebstore.google.com/search/devscribe';

const heroStats = [
  { value: '1 click', label: 'Capture the active page state' },
  { value: 'Markdown', label: 'Turn notes into clean dev briefs' },
  { value: 'Chrome', label: 'Install where your team already works' },
];

const features = [
  {
    title: 'Live page capture',
    description:
      'Freeze the current route, viewport, and page metadata before something changes underneath the team.',
  },
  {
    title: 'Annotation layers',
    description:
      'Pin comments to visible UI, describe regressions, and mark severity without switching to a separate QA tool.',
  },
  {
    title: 'Engineering-ready output',
    description:
      'Export structured notes that read like a real handoff instead of a stack of screenshots and Slack fragments.',
  },
  {
    title: 'Context-first summaries',
    description:
      'Bundle repro steps, expected behavior, and observed behavior into one reviewable record.',
  },
  {
    title: 'Fast share loops',
    description:
      'Hand a captured brief to product, design, or engineering without re-explaining the page state every time.',
  },
  {
    title: 'Built for browser work',
    description:
      'Stay inside Chrome while reviewing staging, production, docs, or support flows that need precise notes.',
  },
];

const screenshots = [
  {
    title: 'Capture the live interface',
    eyebrow: 'Screenshot 01',
    summary:
      'Lock the visible state, attach a short brief, and keep the UI highlight anchored to the page the team saw.',
    url: 'staging.clawreform.com/checkout',
    chips: ['Capture', 'Pinned note', 'Viewport state'],
    callout: 'Primary CTA broken after coupon apply',
    lines: [
      'Observed: button disables after total updates.',
      'Expected: remain active while recalculating.',
      'Scope: desktop checkout, signed-in flow.',
    ],
  },
  {
    title: 'Write a clean dev brief',
    eyebrow: 'Screenshot 02',
    summary:
      'Convert messy page notes into a readable handoff with repro steps, severity, and expected behavior.',
    url: 'brief://devscribe/export',
    chips: ['Markdown export', 'Severity', 'Repro steps'],
    callout: 'Bug brief ready for Linear / GitHub / Slack',
    lines: [
      '1. Open checkout with promo code already applied.',
      '2. Change shipping option.',
      '3. Observe CTA stays disabled after totals settle.',
    ],
  },
  {
    title: 'Share without re-explaining',
    eyebrow: 'Screenshot 03',
    summary:
      'Give product, design, and engineering the same record so triage starts from the same source of truth.',
    url: 'team://review/devscribe',
    chips: ['Share link', 'Team review', 'Source of truth'],
    callout: 'One capture, one review thread, fewer follow-up pings',
    lines: [
      'Product: confirms expected checkout behavior.',
      'Design: checks copy and spacing against spec.',
      'Engineering: gets exact route context and issue summary.',
    ],
  },
];

const ctaLinkClasses =
  'inline-flex items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold transition-colors';

export const metadata: Metadata = {
  metadataBase: new URL('https://clawreform.com'),
  title: 'DevScribe',
  description:
    'DevScribe is the browser capture layer for turning live product feedback into engineering-ready notes, screenshots, and installable workflow inside Chrome.',
  alternates: {
    canonical: '/devscribe',
  },
  openGraph: {
    title: 'DevScribe | ClawReform',
    description:
      'Capture live product context, write clearer dev briefs, and install DevScribe directly from the Chrome Web Store.',
    url: 'https://clawreform.com/devscribe',
    siteName: 'ClawReform',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevScribe | ClawReform',
    description:
      'Turn live browser review into clean engineering handoff with DevScribe.',
  },
};

function ScreenshotCard({
  eyebrow,
  title,
  summary,
  url,
  chips,
  callout,
  lines,
}: (typeof screenshots)[number]) {
  return (
    <Card
      className="overflow-hidden border border-[#14414a] bg-[#071d24]/85 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
      padding="none"
    >
      <div className="border-b border-[#123740] bg-[#0a2730]/95 px-5 py-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#7ee2de]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#2f7f8d]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#1e4f58]" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#76c9c5]">{eyebrow}</p>
            <h3 className="mt-2 text-xl font-semibold text-[#ebfffb]">{title}</h3>
          </div>
          <div className="hidden rounded-full border border-[#1f515b] bg-[#06171d] px-4 py-2 font-mono text-[11px] text-[#9fc1bf] sm:block">
            {url}
          </div>
        </div>
      </div>

      <CardContent className="space-y-6 p-5">
        <p className="max-w-2xl text-sm leading-7 text-[#b8d3d0]">{summary}</p>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-[1.5rem] border border-[#1d5159] bg-[linear-gradient(180deg,#0e3137_0%,#0a1f25_100%)] p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#e9fffb]">Active capture</p>
              <span className="rounded-full border border-[#2a6873] bg-[#0d2c34] px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-[#8ed8d4]">
                live
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)]">
              <div className="space-y-3 rounded-[1.25rem] border border-[#24545a] bg-[#06161b]/75 p-3">
                <div className="rounded-2xl border border-dashed border-[#4ec8c1] bg-[#08232b] p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#74cfc9]">Highlighted issue</p>
                  <p className="mt-2 text-sm font-medium text-[#ebfffb]">{callout}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-10 rounded-2xl border border-[#183e46] bg-[#0a2530]" />
                  <div className="h-10 rounded-2xl border border-[#183e46] bg-[#0e2d37]" />
                  <div className="h-10 rounded-2xl border border-[#183e46] bg-[#0a2530]" />
                </div>
                <div className="h-28 rounded-[1.25rem] border border-[#183e46] bg-[radial-gradient(circle_at_top_left,rgba(126,226,222,0.18),transparent_42%),linear-gradient(180deg,#0b2027_0%,#07161c_100%)]" />
              </div>

              <div className="rounded-[1.25rem] border border-[#183f47] bg-[#07161b]/85 p-3">
                <div className="mb-3 flex flex-wrap gap-2">
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-[#225863] bg-[#0c2d35] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[#93ddd9]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <div className="space-y-2 rounded-[1rem] border border-[#103239] bg-[#061217] p-3 font-mono text-xs text-[#bbd3cf]">
                  {lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#184750] bg-[#071a20]/85 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-[#76c9c5]">What ships with it</p>
            <div className="mt-4 space-y-3">
              {chips.map((chip) => (
                <div
                  key={chip}
                  className="flex items-center justify-between rounded-2xl border border-[#163f47] bg-[#08161c] px-3 py-3"
                >
                  <span className="text-sm text-[#dff6f3]">{chip}</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#7ee2de]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DevScribePage() {
  return (
    <div className="min-h-screen bg-[#031419] text-[#e8f5f1]">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(77,214,206,0.18),transparent_38%),radial-gradient(circle_at_80%_10%,rgba(22,88,98,0.35),transparent_30%),linear-gradient(180deg,#052029_0%,#031419_55%,#041116_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(126,226,222,0.7),transparent)]" />

        <header className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-[#eefdf9]">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2c6f7d] bg-[#08232a] text-[#8de0dc]">
              DS
            </span>
            <span className="flex flex-col">
              <span className="text-[11px] uppercase tracking-[0.28em] text-[#79cfc9]">ClawReform</span>
              <span className="text-base tracking-tight text-[#eefdf9]">DevScribe</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-[#9dc0bd] sm:flex">
            <a href="#features" className="transition-colors hover:text-[#eefdf9]">
              Features
            </a>
            <a href="#screenshots" className="transition-colors hover:text-[#eefdf9]">
              Screenshots
            </a>
            <a
              href={chromeStoreUrl}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-[#eefdf9]"
            >
              Chrome Store
            </a>
          </nav>
        </header>

        <main className="relative mx-auto max-w-7xl px-6 pb-24 pt-6 lg:px-10 lg:pb-28">
          <section className="grid gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-[#215964] bg-[#08252d]/80 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-[#87d8d4]">
                Browser capture for engineering handoff
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-[#f0fffb] sm:text-6xl">
                DevScribe turns live browser review into cleaner dev briefs.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#b4d1ce]">
                Capture the current page, pin what matters, and hand engineering a brief that
                starts with real context instead of scattered screenshots.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={chromeStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${ctaLinkClasses} border-[#7ee2de] bg-[#7ee2de] text-[#04232b] hover:bg-[#95ece8]`}
                >
                  Install from Chrome Web Store
                </a>
                <a
                  href="#screenshots"
                  className={`${ctaLinkClasses} border-[#1c535d] bg-[#071920] text-[#d9f4f0] hover:border-[#2d717d] hover:bg-[#0a222a]`}
                >
                  See screenshots
                </a>
              </div>

              <p className="mt-4 text-sm text-[#8eb5b2]">
                Chrome Store link:{' '}
                <a
                  href={chromeStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[#b8efea] underline decoration-[#2d717d] underline-offset-4"
                >
                  {chromeStoreUrl}
                </a>
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[1.5rem] border border-[#163f47] bg-[#07181f]/75 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
                  >
                    <p className="text-sm uppercase tracking-[0.24em] text-[#79cfc9]">{stat.value}</p>
                    <p className="mt-3 text-sm leading-6 text-[#c1dad7]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card
              className="overflow-hidden border border-[#14414a] bg-[#071d24]/85 shadow-[0_28px_90px_rgba(0,0,0,0.38)]"
              padding="none"
            >
              <CardHeader className="border-b border-[#123740] bg-[#0a2730]/95 px-6 py-5">
                <p className="text-xs uppercase tracking-[0.28em] text-[#76c9c5]">Install flow</p>
                <CardTitle className="mt-2 text-2xl text-[#f0fffb]">
                  Everything the team needs in one browser-side capture.
                </CardTitle>
                <CardDescription className="mt-3 max-w-2xl text-sm leading-7 text-[#b4d1ce]">
                  DevScribe keeps the screenshot, the notes, and the exported brief in the same
                  motion so review stays grounded in the exact page state.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-5 p-6">
                <div className="rounded-[1.6rem] border border-[#184750] bg-[linear-gradient(180deg,#10333b_0%,#071a20_100%)] p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#f0fffb]">DevScribe overlay</p>
                    <span className="rounded-full border border-[#275f69] bg-[#0b2c34] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#8ddcd8]">
                      ready
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                    <div className="rounded-[1.3rem] border border-[#1b4c54] bg-[#082029]/90 p-4">
                      <div className="rounded-[1.2rem] border border-dashed border-[#54cfc8] bg-[#0d2831] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#87d8d4]">
                          Current page
                        </p>
                        <p className="mt-2 text-base font-medium text-[#eefdf9]">
                          Review the active UI and mark exactly what engineering should see first.
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="h-12 rounded-2xl border border-[#1a4650] bg-[#0b2430]" />
                        <div className="h-12 rounded-2xl border border-[#1a4650] bg-[#10313b]" />
                        <div className="h-12 rounded-2xl border border-[#1a4650] bg-[#0b2430]" />
                      </div>
                    </div>

                    <div className="rounded-[1.3rem] border border-[#163f47] bg-[#07161b]/90 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#79cfc9]">Brief output</p>
                      <div className="mt-3 space-y-2 rounded-[1rem] border border-[#103239] bg-[#061217] p-3 font-mono text-xs text-[#bbd3cf]">
                        <p>Route: /checkout</p>
                        <p>Severity: high</p>
                        <p>Issue: CTA remains disabled</p>
                        <p>Expected: purchase action returns</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {['Capture page state', 'Write precise notes', 'Ship a better handoff'].map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.4rem] border border-[#133b43] bg-[#07151b]/75 px-4 py-4 text-sm text-[#d9f4f0]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section id="features" className="mt-24 scroll-mt-24">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.32em] text-[#79cfc9]">Features</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#eefdf9] sm:text-4xl">
                Built for teams that need fewer vague bug reports and faster triage.
              </h2>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="border border-[#133b43] bg-[#07171d]/80"
                  padding="lg"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl text-[#eefdf9]">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-[#b7d2cf]">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section id="screenshots" className="mt-24 scroll-mt-24">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.32em] text-[#79cfc9]">Screenshots</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#eefdf9] sm:text-4xl">
                A dedicated landing page with product-style browser previews.
              </h2>
              <p className="mt-4 text-base leading-8 text-[#b4d1ce]">
                Each panel shows the same core loop: capture the page, turn the review into a dev
                brief, and share a single source of truth across the team.
              </p>
            </div>

            <div className="mt-8 grid gap-6">
              {screenshots.map((screenshot) => (
                <ScreenshotCard key={screenshot.title} {...screenshot} />
              ))}
            </div>
          </section>

          <section className="mt-24">
            <Card
              className="overflow-hidden border border-[#16505b] bg-[radial-gradient(circle_at_top_left,rgba(126,226,222,0.2),transparent_36%),linear-gradient(180deg,#0b2d34_0%,#071b22_100%)]"
              padding="lg"
            >
              <CardContent className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="max-w-3xl">
                  <p className="text-xs uppercase tracking-[0.32em] text-[#7bd6d1]">Install CTA</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#effffb] sm:text-4xl">
                    Install DevScribe in Chrome and keep product feedback attached to the page it came from.
                  </h2>
                  <p className="mt-4 text-base leading-8 text-[#c4ddda]">
                    DevScribe is designed for browser-first review. Open the Chrome Web Store,
                    install the extension, and start capturing cleaner handoff directly from the
                    pages your team is already testing.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <a
                    href={chromeStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`${ctaLinkClasses} border-[#7ee2de] bg-[#7ee2de] text-[#04232b] hover:bg-[#95ece8]`}
                  >
                    Install DevScribe
                  </a>
                  <a
                    href={chromeStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`${ctaLinkClasses} border-[#2a6873] bg-[#07181f] text-[#e8f5f1] hover:border-[#3a8794] hover:bg-[#0b252e]`}
                  >
                    Open Chrome Store link
                  </a>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
