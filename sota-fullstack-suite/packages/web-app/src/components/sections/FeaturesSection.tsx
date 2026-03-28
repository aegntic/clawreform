'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, useScrollAnimation } from '@sota/shared-ui';

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        <polyline points="21 3 21 9 15 9" />
      </svg>
    ),
    title: 'Agent Lifecycle',
    description: 'Write, compile, and execute new code at runtime. Automatic rollback on failure keeps the system stable while it evolves.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v6l3-3" />
        <path d="M12 8l-3-3" />
        <path d="M12 8v14" />
        <path d="M12 22l3-3" />
        <path d="M12 22l-3-3" />
      </svg>
    ),
    title: 'Channel Adapters',
    description: 'GitHub, Playwright, Supabase, Notion, Chrome DevTools, and more. Connect to any tool through the Model Context Protocol.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="3" />
        <circle cx="16" cy="16" r="3" />
        <path d="M10.5 9.5L13.5 14.5" />
      </svg>
    ),
    title: 'Skill System',
    description: 'Written in Rust with 14 crates, 1,744+ tests, and zero clippy warnings. Memory-safe, fast, and battle-tested.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: 'Persistent Memory',
    description: 'Encrypted peer-to-peer networking via Tailscale. Agents discover and communicate across machines with zero config.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: 'Budget & Metering',
    description: 'Agent-to-agent protocol for delegation and collaboration. Agents hand off tasks, share context, and coordinate autonomously.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17L17 7" />
        <path d="M7 7h10v10" />
      </svg>
    ),
    title: 'A2A Protocol',
    description: 'Capability-based auth, approval workflows, and full audit logs. Control exactly what each agent can access and modify.',
  },
];

export function FeaturesSection() {
  const { ref, animationStyles } = useScrollAnimation({ delay: 100 });

  return (
    <section
      id="features"
      ref={ref as React.RefObject<HTMLElement>}
      style={animationStyles}
      className="py-20 sm:py-32 bg-surface-950"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-50 mb-4">
            Everything you need to build{' '}
            <span className="text-accent-gold">intelligent automation</span>
          </h2>
          <p className="max-w-2xl mx-auto text-surface-400 text-lg">
            A complete operating system for AI agents — from kernel to networking to security.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card
              key={feature.title}
              variant="default"
              padding="lg"
              hoverable
              className="group"
            >
              <CardHeader>
                <div className="mb-4 w-10 h-10 flex items-center justify-center">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-surface-400">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
