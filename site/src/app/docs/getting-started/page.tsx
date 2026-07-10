import type { Metadata } from "next";
import Animate from "@/components/animate";
import Link from "next/link";
import SiteShell from "@/components/site-shell";
import { createPageMetadata, docsGettingStartedSteps } from "@/lib/site";

export const metadata: Metadata = createPageMetadata(
  "/docs/getting-started",
  "Getting Started",
  "Install clawREFORM, start the daemon, and send your first agent message in under 5 minutes.",
);

export default function GettingStartedPage() {
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
              Getting Started
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-12">
              From zero to running agent in under 5 minutes.
            </p>
          </Animate>

          {/* Step 1 */}
          <Animate preset="fade-up" delay={0.1}>
            {docsGettingStartedSteps.slice(0, 1).map((step) => (
              <div key={step.title} className="mb-10">
                <h2 className="font-bold text-xl mb-3">1. {step.title}</h2>
                <div className="debossed p-4 mb-2">
                  <pre className="text-sm font-mono text-[var(--amber-core)] leading-loose overflow-x-auto">
{step.code}
                  </pre>
                </div>
                <p className="text-sm text-[var(--text-tertiary)]">{step.note}</p>
              </div>
            ))}
          </Animate>

          {/* Step 2 */}
          <Animate preset="fade-up" delay={0.15}>
            {docsGettingStartedSteps.slice(1, 2).map((step) => (
              <div key={step.title} className="mb-10">
                <h2 className="font-bold text-xl mb-3">2. {step.title}</h2>
                <div className="debossed p-4 mb-2">
                  <pre className="text-sm font-mono text-[var(--amber-core)] leading-loose overflow-x-auto">
{step.code}
                  </pre>
                </div>
                <p className="text-sm text-[var(--text-tertiary)]">
                  The daemon starts the API on <code>http://127.0.0.1:4332</code> and
                  the embedded dashboard at the same address.
                </p>
              </div>
            ))}
          </Animate>

          {/* Step 3 */}
          <Animate preset="fade-up" delay={0.2}>
            {docsGettingStartedSteps.slice(2, 3).map((step) => (
              <div key={step.title} className="mb-10">
                <h2 className="font-bold text-xl mb-3">3. {step.title}</h2>
                <div className="debossed p-4 mb-2">
                  <pre className="text-sm font-mono text-[var(--amber-core)] leading-loose overflow-x-auto">
{step.code}
                  </pre>
                </div>
              </div>
            ))}
          </Animate>

          {/* Step 4 */}
          <Animate preset="fade-up" delay={0.25}>
            {docsGettingStartedSteps.slice(3, 4).map((step) => (
              <div key={step.title} className="mb-10">
                <h2 className="font-bold text-xl mb-3">4. {step.title}</h2>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Navigate to{" "}
                  <code className="text-[var(--amber-core)]">http://127.0.0.1:4332/</code>{" "}
                  in your browser. The embedded Alpine.js dashboard shows agents, budgets,
                  skills, and network status in real time.
                </p>
              </div>
            ))}
          </Animate>

          {/* Step 5 */}
          <Animate preset="fade-up" delay={0.3}>
            {docsGettingStartedSteps.slice(4, 5).map((step) => (
              <div key={step.title} className="mb-10">
                <h2 className="font-bold text-xl mb-3">5. {step.title}</h2>
                <div className="debossed p-4 mb-2">
                  <pre className="text-sm font-mono text-[var(--amber-core)] leading-loose overflow-x-auto">
{step.code}
                  </pre>
                </div>
                <p className="text-sm text-[var(--text-tertiary)]">{step.note}</p>
              </div>
            ))}
          </Animate>

          <Animate preset="fade-up" delay={0.35}>
            <div className="flex gap-4">
              <Link
                href="/docs/concepts"
                className="metal-button-primary px-6 py-3 text-sm rounded-lg"
              >
                Core concepts
              </Link>
              <Link
                href="/docs/api"
                className="metal-button px-6 py-3 text-sm rounded-lg"
              >
                API reference
              </Link>
            </div>
          </Animate>
        </div>
    </SiteShell>
  );
}
