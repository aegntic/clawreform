import type { Metadata } from "next";
import Animate from "@/components/animate";
import Link from "next/link";
import SiteShell from "@/components/site-shell";
import { createPageMetadata, docsIndexSections } from "@/lib/site";

export const metadata: Metadata = createPageMetadata(
  "/docs",
  "Documentation",
  "clawREFORM documentation: getting started, core concepts, API reference, and configuration.",
);

export default function DocsPage() {
  return (
    <SiteShell>
        <div className="container-site max-w-3xl">
          <Animate preset="fade-up">
            <h1 className="heading-machined text-4xl md:text-5xl mb-4">
              Documentation
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-12">
              Everything you need to run, configure, and extend clawREFORM.
            </p>
          </Animate>

          <Animate
            preset="fade-up-stagger"
            stagger
            staggerAmount={0.08}
            className="space-y-4"
          >
            {docsIndexSections.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="metal-panel metal-panel-interactive p-6 block group"
              >
                <h2 className="font-bold text-lg group-hover:text-[var(--amber-core)] transition-colors">
                  {s.title}
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {s.desc}
                </p>
              </Link>
            ))}
          </Animate>

          <Animate preset="fade-up" delay={0.3}>
            <div className="mt-12 debossed p-6">
              <h3 className="font-semibold mb-2">Source code docs</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Inline Rust documentation is available via{" "}
                <code className="text-[var(--text-primary)]">cargo doc --workspace --open</code>.
                Every public API is documented in the source.
              </p>
            </div>
          </Animate>
        </div>
    </SiteShell>
  );
}
