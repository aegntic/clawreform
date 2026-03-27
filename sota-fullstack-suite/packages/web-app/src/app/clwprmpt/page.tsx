import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@sota/shared-ui';

const chromeStoreUrl =
  'https://chromewebstore.google.com/search/clawprompt';

const categoryColors: Record<string, string> = {
  coding: '#6366f1',
  writing: '#8b5cf6',
  analysis: '#ec4899',
  business: '#f59e0b',
};

const heroStats = [
  { value: '8 templates', label: 'Pre-built prompt templates ready to use' },
  { value: 'Ctrl+Shift+P', label: 'Open ClawPrompt from any text field' },
  { value: '6 platforms', label: 'Works across every major AI chat' },
];

const features = [
  {
    title: 'Template library',
    description:
      'Browse, search, and organize reusable prompt templates so you never start from a blank chat again.',
  },
  {
    title: 'One-click insert',
    description:
      'Select a template and paste it directly into the active text field with a single click or keyboard shortcut.',
  },
  {
    title: 'Works everywhere',
    description:
      'Claude, ChatGPT, Gemini, Copilot, Perplexity, OpenRouter — if it has a text field, ClawPrompt fills it.',
  },
  {
    title: 'Dynamic variables',
    description:
      'Use placeholders like {{cursor}}, {{selected}}, or {{date}} that resolve to real context at insert time.',
  },
  {
    title: 'Import and export',
    description:
      'Share template libraries with your team by exporting JSON and importing on another machine in seconds.',
  },
  {
    title: 'Fully private',
    description:
      'Everything runs locally in the browser. No data leaves your machine, no accounts, no telemetry.',
  },
];

const templates = [
  {
    name: 'Code Review',
    category: 'coding',
    tags: ['code', 'review', 'quality'],
    favorite: true,
    description:
      'Structured code review prompt covering quality, bugs, performance, and security.',
  },
  {
    name: 'Explain Code',
    category: 'coding',
    tags: ['explain', 'understand', 'code'],
    favorite: true,
    description:
      'Step-by-step explanation prompt for unfamiliar codebases and design patterns.',
  },
  {
    name: 'Refactor Request',
    category: 'coding',
    tags: ['refactor', 'clean', 'improve'],
    favorite: false,
    description:
      'Refactoring prompt targeting readability, maintainability, and complexity reduction.',
  },
  {
    name: 'Bug Report',
    category: 'coding',
    tags: ['bug', 'issue', 'debug'],
    favorite: false,
    description:
      'Structured bug report template with repro steps, expected behavior, and environment.',
  },
  {
    name: 'Git Commit Message',
    category: 'coding',
    tags: ['git', 'commit', 'message'],
    favorite: false,
    description:
      'Conventional commit message generator from staged or selected diff content.',
  },
  {
    name: 'Meeting Summary',
    category: 'business',
    tags: ['meeting', 'summary', 'notes'],
    favorite: false,
    description:
      'Meeting recap template with key points, action items, and next steps.',
  },
  {
    name: 'Professional Email',
    category: 'writing',
    tags: ['email', 'professional', 'communication'],
    favorite: false,
    description:
      'Email draft template with subject, greeting, body, and signature placeholders.',
  },
  {
    name: 'Data Analysis',
    category: 'analysis',
    tags: ['data', 'analysis', 'report'],
    favorite: true,
    description:
      'Data analysis prompt for trends, anomalies, insights, and recommendations.',
  },
];

const platforms = [
  { name: 'Claude', domain: 'claude.ai' },
  { name: 'ChatGPT', domain: 'chat.openai.com' },
  { name: 'Gemini', domain: 'gemini.google.com' },
  { name: 'Copilot', domain: 'copilot.microsoft.com' },
  { name: 'Perplexity', domain: 'perplexity.ai' },
  { name: 'OpenRouter', domain: 'openrouter.ai' },
];

const ctaLinkClasses =
  'inline-flex items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold transition-colors';

export const metadata: Metadata = {
  metadataBase: new URL('https://clawreform.com'),
  title: 'ClawPrompt',
  description:
    'ClawPrompt is a Chrome extension that inserts reusable prompt templates into any AI chat. Browse, customize, and one-click paste into Claude, ChatGPT, Gemini, Copilot, Perplexity, and OpenRouter.',
  alternates: {
    canonical: '/clwprmpt',
  },
  openGraph: {
    title: 'ClawPrompt | ClawReform',
    description:
      'Stop retyping the same prompts. ClawPrompt inserts reusable templates into any AI chat from any text field.',
    url: 'https://clawreform.com/clwprmpt',
    siteName: 'ClawReform',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClawPrompt | ClawReform',
    description:
      'Reusable prompt templates for every AI chat, directly from Chrome.',
  },
};

function TemplateCard({
  name,
  category,
  tags,
  favorite,
  description,
}: (typeof templates)[number]) {
  const color = categoryColors[category] ?? '#6366f1';
  return (
    <Card
      className="overflow-hidden border border-[#2a2250] bg-[#0e0b1a]/85 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
      padding="none"
    >
      <div className="border-b border-[#221d45] bg-[#120e22]/95 px-5 py-4">
        <div className="flex items-center justify-between">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em]"
            style={{
              backgroundColor: `${color}18`,
              color,
              border: `1px solid ${color}40`,
            }}
          >
            {category}
          </span>
          {favorite && (
            <span className="text-[#f59e0b] text-sm" aria-label="Favorite">
              &#9733;
            </span>
          )}
        </div>
        <h3 className="mt-3 text-lg font-semibold text-[#f0eeff]">{name}</h3>
      </div>
      <CardContent className="p-5">
        <p className="text-sm leading-7 text-[#c4b5fd]">{description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#2a2250] bg-[#150f28] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[#a78bfa]"
            >
              {tag}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformCard({
  name,
  domain,
}: (typeof platforms)[number]) {
  return (
    <Card
      className="border border-[#2a2250] bg-[#0e0b1a]/80"
      padding="lg"
    >
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
        <div>
          <CardTitle className="text-lg text-[#f0eeff]">{name}</CardTitle>
          <p className="mt-1 font-mono text-xs text-[#a78bfa]">{domain}</p>
        </div>
      </div>
    </Card>
  );
}

export default function ClawPromptPage() {
  return (
    <div className="min-h-screen bg-[#0c0918] text-[#ede9fe]">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_38%),radial-gradient(circle_at_80%_10%,rgba(139,92,246,0.25),transparent_30%),linear-gradient(180deg,#150e28_0%,#0c0918_55%,#0a0712_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(99,102,241,0.7),transparent)]" />

        {/* ── Header ── */}
        <header className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-[#f0eeff]">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#3b2d6e] bg-[#150f28] text-[#a78bfa]">
              CP
            </span>
            <span className="flex flex-col">
              <span className="text-[11px] uppercase tracking-[0.28em] text-[#a78bfa]">ClawReform</span>
              <span className="text-base tracking-tight text-[#f0eeff]">ClawPrompt</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-[#a78bfa] sm:flex">
            <a href="#features" className="transition-colors hover:text-[#f0eeff]">
              Features
            </a>
            <a href="#templates" className="transition-colors hover:text-[#f0eeff]">
              Templates
            </a>
            <a href="#platforms" className="transition-colors hover:text-[#f0eeff]">
              Platforms
            </a>
            <a
              href={chromeStoreUrl}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-[#f0eeff]"
            >
              Chrome Store
            </a>
          </nav>
        </header>

        <main className="relative mx-auto max-w-7xl px-6 pb-24 pt-6 lg:px-10 lg:pb-28">
          {/* ── Hero ── */}
          <section className="grid gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-[#3b2d6e] bg-[#150f28]/80 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-[#a78bfa]">
                AI prompt templates for Chrome
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-[#f0eeff] sm:text-6xl">
                ClawPrompt inserts reusable prompt templates into any AI chat, from any text field.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#c4b5fd]">
                Browse a library of ready-made prompts, customize them with dynamic variables,
                and paste into Claude, ChatGPT, Gemini, or any other AI chat with one click.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={chromeStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${ctaLinkClasses} border-[#6366f1] bg-[#6366f1] text-white hover:bg-[#818cf8]`}
                >
                  Install from Chrome Web Store
                </a>
                <a
                  href="#templates"
                  className={`${ctaLinkClasses} border-[#3b2d6e] bg-[#0e0b1a] text-[#e0e7ff] hover:border-[#4c3d8e] hover:bg-[#150f28]`}
                >
                  See templates
                </a>
              </div>

              <p className="mt-4 text-sm text-[#8b7ec8]">
                Chrome Store link:{' '}
                <a
                  href={chromeStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[#c4b5fd] underline decoration-[#3b2d6e] underline-offset-4"
                >
                  {chromeStoreUrl}
                </a>
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[1.5rem] border border-[#2a2250] bg-[#0e0b1a]/75 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
                  >
                    <p className="text-sm uppercase tracking-[0.24em] text-[#a78bfa]">{stat.value}</p>
                    <p className="mt-3 text-sm leading-6 text-[#c4b5fd]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Popup Preview Card ── */}
            <Card
              className="overflow-hidden border border-[#2a2250] bg-[#0e0b1a]/85 shadow-[0_28px_90px_rgba(0,0,0,0.38)]"
              padding="none"
            >
              <CardHeader className="border-b border-[#221d45] bg-[#120e22]/95 px-6 py-5">
                <p className="text-xs uppercase tracking-[0.28em] text-[#a78bfa]">Extension preview</p>
                <CardTitle className="mt-2 text-2xl text-[#f0eeff]">
                  Popup with search, categories, and one-click insert.
                </CardTitle>
                <CardDescription className="mt-3 max-w-2xl text-sm leading-7 text-[#c4b5fd]">
                  ClawPrompt opens as a lightweight popup over any page. Search templates, pick a category,
                  and paste directly into the active text field.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 p-6">
                {/* Fake search bar */}
                <div className="rounded-[1.6rem] border border-[#2a2250] bg-[linear-gradient(180deg,#1a1432_0%,#0e0b1a_100%)] p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#f0eeff]">ClawPrompt popup</p>
                    <span className="rounded-full border border-[#3b2d6e] bg-[#150f28] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#a78bfa]">
                      ready
                    </span>
                  </div>

                  {/* Search mock */}
                  <div className="mt-4 rounded-xl border border-[#2a2250] bg-[#0a0816] px-4 py-3 text-sm text-[#6b5f8a]">
                    Search templates...
                  </div>

                  {/* Category tabs */}
                  <div className="mt-3 flex gap-2">
                    {['All', 'Favorites', 'Recent'].map((tab, i) => (
                      <span
                        key={tab}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                          i === 0
                            ? 'bg-[#6366f1] text-white'
                            : 'bg-[#150f28] text-[#a78bfa] border border-[#2a2250]'
                        }`}
                      >
                        {tab}
                      </span>
                    ))}
                  </div>

                  {/* Template items */}
                  <div className="mt-4 space-y-2">
                    {[
                      { name: 'Code Review', category: 'coding', fav: true },
                      { name: 'Explain Code', category: 'coding', fav: true },
                      { name: 'Professional Email', category: 'writing', fav: false },
                      { name: 'Data Analysis', category: 'analysis', fav: true },
                    ].map((tpl) => (
                      <div
                        key={tpl.name}
                        className="flex items-center justify-between rounded-xl border border-[#2a2250] bg-[#120e22]/80 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="h-8 w-8 rounded-lg"
                            style={{ backgroundColor: `${categoryColors[tpl.category]}18` }}
                          />
                          <div>
                            <p className="text-sm font-medium text-[#f0eeff]">
                              {tpl.name}
                              {tpl.fav && <span className="ml-2 text-[#f59e0b]">&#9733;</span>}
                            </p>
                            <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b7ec8]">
                              {tpl.category}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-[#6b5f8a]">Click to insert</span>
                      </div>
                    ))}
                  </div>

                  {/* Quick actions bar */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {['Paste Last', 'Import', 'Export'].map((action) => (
                      <div
                        key={action}
                        className="rounded-xl border border-[#2a2250] bg-[#0a0816] px-3 py-3 text-center text-xs text-[#c4b5fd]"
                      >
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ── Features ── */}
          <section id="features" className="mt-24 scroll-mt-24">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.32em] text-[#a78bfa]">Features</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#f0eeff] sm:text-4xl">
                Everything you need to stop retyping prompts across AI chats.
              </h2>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="border border-[#2a2250] bg-[#0e0b1a]/80"
                  padding="lg"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl text-[#f0eeff]">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-[#c4b5fd]">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* ── Template Library Preview ── */}
          <section id="templates" className="mt-24 scroll-mt-24">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.32em] text-[#a78bfa]">Templates</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#f0eeff] sm:text-4xl">
                8 pre-built templates for coding, writing, analysis, and business.
              </h2>
              <p className="mt-4 text-base leading-8 text-[#c4b5fd]">
                Each template ships with the extension and can be customized, duplicated, or replaced.
                Import and export your entire library as JSON.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {templates.map((template) => (
                <TemplateCard key={template.name} {...template} />
              ))}
            </div>
          </section>

          {/* ── Platforms ── */}
          <section id="platforms" className="mt-24 scroll-mt-24">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.32em] text-[#a78bfa]">Platforms</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#f0eeff] sm:text-4xl">
                Works on every major AI chat platform.
              </h2>
              <p className="mt-4 text-base leading-8 text-[#c4b5fd]">
                ClawPrompt injects into any text field via content scripts. If the site has an input,
                ClawPrompt can fill it.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {platforms.map((platform) => (
                <PlatformCard key={platform.name} {...platform} />
              ))}
            </div>
          </section>

          {/* ── Install CTA ── */}
          <section className="mt-24">
            <Card
              className="overflow-hidden border border-[#3b2d6e] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.2),transparent_36%),linear-gradient(180deg,#1a1432_0%,#0e0b1a_100%)]"
              padding="lg"
            >
              <CardContent className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="max-w-3xl">
                  <p className="text-xs uppercase tracking-[0.32em] text-[#a78bfa]">Install CTA</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#f0eeff] sm:text-4xl">
                    Install ClawPrompt and stop retyping the same prompts.
                  </h2>
                  <p className="mt-4 text-base leading-8 text-[#c4b5fd]">
                    Free, open-source, and fully local. ClawPrompt runs entirely in your browser with
                    no accounts, no cloud, and no data leaving your machine.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <a
                    href={chromeStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`${ctaLinkClasses} border-[#6366f1] bg-[#6366f1] text-white hover:bg-[#818cf8]`}
                  >
                    Install ClawPrompt
                  </a>
                  <a
                    href={chromeStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`${ctaLinkClasses} border-[#3b2d6e] bg-[#0e0b1a] text-[#ede9fe] hover:border-[#4c3d8e] hover:bg-[#150f28]`}
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
