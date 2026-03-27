'use client';

import { Button, useScrollAnimation } from '@sota/shared-ui';
import Link from 'next/link';

export function CTASection() {
  const { ref, animationStyles } = useScrollAnimation({ delay: 300 });

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      style={animationStyles}
      className="py-20 sm:py-32 bg-surface-950"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1408] via-[#2a1f0a] to-[#1a1408] p-8 sm:p-16">
          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(212,175,55,0.5) 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative z-10 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Start building with clawREFORM
            </h2>
            <p className="max-w-2xl mx-auto text-surface-400 text-lg mb-10">
              An open-source Agent OS that evolves with you.
              Fork, extend, and deploy intelligent automation in minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="accent" size="xl" asChild>
                <Link href="https://github.com/aegntic/clawreform" target="_blank" rel="noopener noreferrer">
                  Get Started
                </Link>
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="border-white/30 text-white hover:bg-white/10"
                asChild
              >
                <Link href="https://www.skool.com/clawreform" target="_blank" rel="noopener noreferrer">
                  Join the Community
                </Link>
              </Button>
            </div>

            <p className="mt-8 text-sm text-surface-500">
              Built with Rust. 1,744+ tests. Zero clippy warnings.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
