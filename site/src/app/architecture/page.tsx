import type { Metadata } from "next";
import Animate from "@/components/animate";
import Link from "next/link";
import SiteShell from "@/components/site-shell";
import ArchitectureMap from "@/components/architecture-map";
import MessageFlow from "@/components/message-flow";
import AgentLifecycle from "@/components/agent-lifecycle";
import { createPageMetadata } from "@/lib/site";

export const metadata: Metadata = createPageMetadata(
  "/architecture",
  "Architecture",
  "How clawREFORM is built: 14 Rust crates, layered dependency graph, trait-bounded kernel, and zero circular dependencies.",
);

export default function ArchitecturePage() {
  return (
    <SiteShell>
        <div className="container-site">
          <Animate preset="fade-up">
            <div className="max-w-3xl mb-16">
              <h1 className="heading-machined text-4xl md:text-5xl mb-4">
                Architecture
              </h1>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                Built in Rust with six independent layers. Every piece has a single
                responsibility, every boundary is clearly defined, and nothing
                depends on anything it shouldn't.
              </p>
            </div>
          </Animate>

          {/* Crate diagram — interactive */}
          <Animate preset="draw-in">
            <div className="debossed p-6 md:p-8 mb-16">
              <ArchitectureMap />
            </div>
          </Animate>

          {/* Message Flow */}
          <div className="mt-20 mb-16">
            <Animate preset="fade-up">
              <div className="max-w-3xl">
                <div className="section-label">Message Pipeline</div>
                <h2 className="heading-machined mt-4 text-3xl md:text-5xl">
                  Nothing gets in without a stamp.
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
                  Every message passes through eight checkpoints before the agent sees it.
                  Click any stage to see what's being checked.
                </p>
              </div>
            </Animate>

            <Animate preset="fade-up" delay={0.15}>
              <div className="debossed p-6 md:p-8">
                <MessageFlow />
              </div>
            </Animate>
          </div>

          {/* Agent Lifecycle */}
          <div className="mb-16">
            <Animate preset="fade-up">
              <div className="max-w-3xl">
                <div className="section-label">Agent State Machine</div>
                <h2 className="heading-machined mt-4 text-3xl md:text-5xl">
                  Agents wake up, work, rest, and clock out.
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
                  Every agent follows the same four-step cycle. Click a state to see where
                  it can go next, or click a transition to see what happens.
                </p>
              </div>
            </Animate>

            <Animate preset="fade-up" delay={0.15}>
              <div className="debossed p-6 md:p-8">
                <AgentLifecycle />
              </div>
            </Animate>
          </div>

          {/* Key design decisions */}
          <Animate preset="fade-up" delay={0.2}>
            <div className="mt-16 max-w-3xl">
              <h2 className="heading-machined text-2xl md:text-3xl mb-6">
                Key design decisions
              </h2>
              <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
                <div className="debossed p-4">
                  <strong className="text-[var(--text-primary)]">KernelHandle trait</strong>{" "}
                  — Defined in clawreform-runtime, implemented on ClawReFormKernel in clawreform-kernel.
                  This inverts the dependency so the runtime can call kernel methods without importing the kernel crate.
                </div>
                <div className="debossed p-4">
                  <strong className="text-[var(--text-primary)]">AppState bridge</strong>{" "}
                  — The API layer wraps the kernel in an AppState struct with Arc pointers.
                  Routes never touch the kernel directly — they go through typed accessor methods.
                </div>
                <div className="debossed p-4">
                  <strong className="text-[var(--text-primary)]">Config as types</strong>{" "}
                  — Every config field lives in clawreform-types with serde defaults, making
                  the binary usable with zero configuration files on first run.
                </div>
              </div>
            </div>
          </Animate>

          <Animate preset="fade-up" delay={0.3}>
            <div className="mt-12 text-center">
              <Link
                href="https://github.com/aegntic/clawreform"
                className="metal-button px-6 py-3 text-sm rounded-lg inline-block"
              >
                Read the source
              </Link>
            </div>
          </Animate>
        </div>
    </SiteShell>
  );
}
