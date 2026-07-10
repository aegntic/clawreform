import type { Metadata } from "next";
import Animate from "@/components/animate";
import Link from "next/link";
import SiteShell from "@/components/site-shell";
import { createPageMetadata, platformCapabilities } from "@/lib/site";

export const metadata: Metadata = createPageMetadata(
  "/platform",
  "Platform",
  "What clawREFORM does: agent lifecycle management, multi-provider LLM, budget governance, channel adapters, wire protocol, and skills.",
);

export default function PlatformPage() {
  return (
    <SiteShell>
        <div className="container-site">
          <Animate preset="fade-up">
            <div className="max-w-3xl mb-16">
              <h1 className="heading-machined text-4xl md:text-5xl mb-4">
                Platform
              </h1>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                clawREFORM is not a framework. It is a complete operating system for
                autonomous AI agents — from lifecycle management to inter-agent networking
                to cost governance. One binary. Self-hosted. Open source.
              </p>
            </div>
          </Animate>

          <div className="space-y-6">
            {platformCapabilities.map((c, i) => (
              <Animate key={c.title} preset="fade-up" delay={i * 0.06}>
                <div className="metal-panel p-6 md:p-8">
                  <h2 className="font-bold text-xl mb-2">{c.title}</h2>
                  <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
                    {c.desc}
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
                    {c.detail}
                  </p>
                </div>
              </Animate>
            ))}
          </div>

          <Animate preset="fade-up" delay={0.3}>
            <div className="mt-16 text-center">
              <Link
                href="/architecture"
                className="metal-button px-6 py-3 text-sm rounded-lg inline-block"
              >
                See how it fits together
              </Link>
            </div>
          </Animate>
        </div>
    </SiteShell>
  );
}
