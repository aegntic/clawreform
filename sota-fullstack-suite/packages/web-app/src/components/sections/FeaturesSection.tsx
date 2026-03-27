'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, useScrollAnimation } from '@sota/shared-ui';

const features = [
  {
    icon: '🧬',
    title: 'Self-Modification Kernel',
    description: 'Write, compile, and execute new code at runtime. Automatic rollback on failure keeps the system stable while it evolves.',
  },
  {
    icon: '🦀',
    title: 'Built for Performance',
    description: 'Written in Rust with 14 crates, 1,744+ tests, and zero clippy warnings. Memory-safe, fast, and battle-tested.',
  },
  {
    icon: '🔌',
    title: '23+ MCP Servers',
    description: 'GitHub, Playwright, Supabase, Notion, Chrome DevTools, and more. Connect to any tool through the Model Context Protocol.',
  },
  {
    icon: '🌐',
    title: 'Tailscale Mesh Networking',
    description: 'Encrypted peer-to-peer networking via Tailscale. Agents discover and communicate across machines with zero config.',
  },
  {
    icon: '🤝',
    title: 'Multi-Agent / A2A',
    description: 'Agent-to-agent protocol for delegation and collaboration. Agents hand off tasks, share context, and coordinate autonomously.',
  },
  {
    icon: '🔒',
    title: 'Enterprise Security',
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
                <div className="text-4xl mb-4">{feature.icon}</div>
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
