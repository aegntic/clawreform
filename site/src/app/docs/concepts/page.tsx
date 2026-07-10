import type { Metadata } from "next";
import Animate from "@/components/animate";
import Link from "next/link";
import SiteShell from "@/components/site-shell";
import { createPageMetadata, docsConcepts } from "@/lib/site";

export const metadata: Metadata = createPageMetadata(
  "/docs/concepts",
  "Core Concepts",
  "Understand the building blocks of clawREFORM: agents, kernels, skills, channels, wire protocol, and budget governance.",
);

export default function ConceptsPage() {
  return (
    <SiteShell>
        <div className="container-site max-w-3xl">
          <Animate preset="fade-in">
            <Link
              href="/docs"
              className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] mb-4 inline-block"
            >
              &larr; Docs
            </Link>
          </Animate>

          <Animate preset="fade-up">
            <h1 className="heading-machined text-4xl md:text-5xl mb-4">
              Core Concepts
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-12">
              The building blocks of clawREFORM. Understand these and you can build
              anything on the platform.
            </p>
          </Animate>

          <Animate
            preset="fade-up-stagger"
            stagger
            staggerAmount={0.06}
            className="space-y-6"
          >
            {docsConcepts.map((c) => (
              <div key={c.term} className="metal-panel p-6">
                <h2 className="font-bold text-lg text-[var(--amber-core)] mb-2">
                  {c.term}
                </h2>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {c.definition}
                </p>
              </div>
            ))}
          </Animate>

          <Animate preset="fade-up" delay={0.3}>
            <div className="mt-12 flex gap-4">
              <Link
                href="/docs/api"
                className="metal-button-primary px-6 py-3 text-sm rounded-lg"
              >
                API reference
              </Link>
              <Link
                href="/docs/configuration"
                className="metal-button px-6 py-3 text-sm rounded-lg"
              >
                Configuration
              </Link>
            </div>
          </Animate>
        </div>
    </SiteShell>
  );
}
