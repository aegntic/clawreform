import type { Metadata } from 'next';
import { HeroSection } from '@/components/sections/HeroSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { ExtensionsSection } from '@/components/sections/ExtensionsSection';
import { CTASection } from '@/components/sections/CTASection';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'clawREFORM by aegntic.ai — The Self-Evolving Agent OS',
  description:
    'An open-source Agent Operating System written in Rust. 14 crates, 60+ skills, 23+ MCP servers, self-modification kernel, and multi-agent orchestration.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <>
      <Navigation />

      <main className="relative">
        <HeroSection />
        <ExtensionsSection />
        <FeaturesSection />
        <CTASection />
      </main>

      <Footer />
    </>
  );
}
