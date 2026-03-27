'use client';

import { Button } from '@sota/shared-ui';
import { useScrollAnimation } from '@sota/shared-ui';
import Link from 'next/link';

export function HeroSection() {
  const { ref: heroRef, animationStyles } = useScrollAnimation({ delay: 0 });

  return (
    <section
      ref={heroRef as React.RefObject<HTMLElement>}
      style={animationStyles}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
    >
      {/* Background gradient - gold tinted */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-surface-950 to-surface-950" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full border border-surface-700 bg-surface-900/50 px-4 py-1.5 text-sm text-surface-300 mb-8">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-gold opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-gold" />
            </span>
            Open source Agent OS in Rust
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-surface-50 mb-6">
            The Agent OS
            <br />
            <span className="text-accent-gold">that rewrites its own code</span>
          </h1>

          {/* Subheadline */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-surface-400 mb-10">
            clawREFORM is a self-evolving Agent Operating System written in Rust.
            14 crates, 60+ skills, 23+ MCP servers, and a kernel that can modify its own source code at runtime.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="accent" size="lg" asChild>
              <Link href="https://github.com/aegntic/clawreform" target="_blank" rel="noopener noreferrer">
                Get Started
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="https://github.com/aegntic/clawreform" target="_blank" rel="noopener noreferrer">
                View on GitHub
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { value: '14', label: 'Rust Crates' },
              { value: '60+', label: 'Skills' },
              { value: '23+', label: 'MCP Servers' },
              { value: 'MIT', label: 'Open Source' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-surface-50">
                  {stat.value}
                </div>
                <div className="text-sm text-surface-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="h-6 w-6 text-surface-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  );
}
