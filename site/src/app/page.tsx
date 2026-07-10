"use client";

import Image from "next/image";
import Link from "next/link";
import Animate from "@/components/animate";
import ArchitectureMap from "@/components/architecture-map";
import MessageFlow from "@/components/message-flow";
import AgentLifecycle from "@/components/agent-lifecycle";
import SiteShell from "@/components/site-shell";
import WaitlistForm from "@/components/waitlist-form";
import { homeMatrixRows, homeProofPills, homeSignalStack, siteBrand } from "@/lib/site";

const installCommand = "npm install -g clawreform";

const installReveal = (
  <div className="install-shell text-left">
    <div className="section-label">Install</div>
    <div className="install-command">
      <code>{installCommand}</code>
    </div>
  </div>
);

export default function Home() {
  return (
    <SiteShell mainClassName="page-home">
      {/* ── Hero ── */}
      <section className="pb-16 pt-24 md:pb-24 md:pt-32">
        <div className="container-site">
          <div className="grid gap-10 xl:grid-cols-[1.02fr_0.98fr] xl:items-start">
            <div className="max-w-3xl">
              <Animate preset="scale-in" delay={0.15}>
                <div className="relative flex justify-center mb-6">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 md:w-96 md:h-96 rounded-full bg-[var(--amber-core)] opacity-[0.08] blur-[80px]" />
                  </div>
                  <Image
                    src="/brand/logo-lockup.png"
                    alt="clawREFORM"
                    width={1024}
                    height={1024}
                    priority
                    className="relative z-10 h-auto w-56 md:w-72 lg:w-80 object-contain"
                  />
                </div>
              </Animate>

              <Animate preset="fade-up" delay={0.25}>
                <h1 className="heading-machined hero-title text-4xl leading-[1.02] sm:text-5xl md:text-7xl">
                  The self-evolving
                  <span className="block text-amber">Agent OS.</span>
                  for autonomous agents.
                </h1>
              </Animate>

              <Animate preset="fade-up" delay={0.45}>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)] md:text-xl">
                  clawREFORM is a Rust-built Agent OS that rewrites its own codebase,
                  wakes specialist colleagues on demand, and preserves an observable
                  audit chain instead of burying state inside prompt sludge.
                </p>
              </Animate>

              <Animate preset="fade-up" delay={0.58}>
                <div className="mt-10">
                  <WaitlistForm successContent={installReveal} />
                </div>
              </Animate>

              <Animate preset="fade-up" delay={0.68}>
                <div className="mt-6 flex flex-wrap gap-3 text-sm">
                  <Link href={siteBrand.githubUrl} className="trace-link">
                    View GitHub
                  </Link>
                  <Link href="/docs/getting-started" className="trace-link">
                    Read the docs
                  </Link>
                  <Link href="/architecture" className="trace-link">
                    Explore the blueprint
                  </Link>
                </div>
              </Animate>

              <Animate preset="fade-up" delay={0.78}>
                <div className="mt-10 grid gap-3 sm:grid-cols-3">
                  {homeProofPills.map((pill) => (
                    <div key={pill.label} className="metric-pill">
                      <span className="metric-value">{pill.value}</span>
                      <span className="metric-label">{pill.label}</span>
                    </div>
                  ))}
                </div>
              </Animate>
            </div>

            <div className="space-y-6">
              <Animate preset="fade-up-stagger" stagger staggerAmount={0.1}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {homeSignalStack.map((item) => (
                    <div key={item.title} className="signal-card">
                      <div className="signal-card-title">{item.title}</div>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </Animate>
            </div>
          </div>

        </div>
      </section>

      <hr className="section-divider-amber" />

      {/* ── How It Works ── */}
      <section className="py-16 md:py-24">
        <div className="container-site">
          <Animate preset="fade-up">
            <div className="max-w-2xl">
              <div className="section-label">How It Works</div>
              <h2 className="heading-machined mt-4 text-3xl md:text-5xl">
                Three interactive views into the city.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
                Click any layer, subsystem, pipeline stage, or agent state to see what it does.
                Every diagram is live — not a screenshot.
              </p>
            </div>
          </Animate>

          <div className="mt-12 space-y-16">
            <Animate preset="fade-up" delay={0.1}>
              <div>
                <div className="section-label">Architecture</div>
                <h3 className="heading-machined mt-2 text-xl md:text-2xl">
                  Every piece has a clear job.
                </h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Six independent layers, each with its own set of tools. Click any layer or component to see what it does.
                </p>
                <div className="metal-panel mt-6 p-6">
                  <ArchitectureMap />
                </div>
              </div>
            </Animate>

            <Animate preset="fade-up" delay={0.1}>
              <div>
                <div className="section-label">Message Pipeline</div>
                <h3 className="heading-machined mt-2 text-xl md:text-2xl">
                  Nothing gets in without a stamp.
                </h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Every message passes through eight checkpoints before the agent sees it. Click any stage to see what's checked.
                </p>
                <div className="metal-panel mt-6 p-6">
                  <MessageFlow />
                </div>
              </div>
            </Animate>

            <Animate preset="fade-up" delay={0.1}>
              <div>
                <div className="section-label">Agent Lifecycle</div>
                <h3 className="heading-machined mt-2 text-xl md:text-2xl">
                  Agents wake up, work, rest, and clock out.
                </h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Every agent follows the same four-step cycle. Click a state to see where it can go next.
                </p>
                <div className="metal-panel mt-6 p-6">
                  <AgentLifecycle />
                </div>
              </div>
            </Animate>
          </div>
        </div>
      </section>

      <hr className="section-divider-amber" />

      {/* ── Comparison ── */}
      <section className="py-16 md:py-24">
        <div className="container-site">
          <Animate preset="fade-up">
            <div className="max-w-2xl">
              <div className="section-label">City vs. Monolith</div>
              <h2 className="heading-machined mt-4 text-3xl md:text-5xl">
                Replace brittle monolith loops with observable specialists.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
                The platform is designed to keep execution recoverable, memory selective,
                and every lifecycle decision reconstructable from a single trace.
              </p>
            </div>
          </Animate>

          <Animate preset="fade-up" delay={0.14}>
            <div className="matrix-shell mt-10">
              <div className="matrix-head">
                <span>Dimensions</span>
                <span>The Monolith</span>
                <span>clawREFORM</span>
              </div>
              {homeMatrixRows.map((row) => (
                <div key={row.dimension} className="matrix-row">
                  <span className="matrix-dimension">{row.dimension}</span>
                  <span className="matrix-copy text-[var(--text-secondary)]">
                    {row.monolith}
                  </span>
                  <span className="matrix-toggle-wrap">
                    <span className="matrix-toggle" />
                    <span className="matrix-copy matrix-copy-strong">{row.reform}</span>
                  </span>
                </div>
              ))}
            </div>
          </Animate>
        </div>
      </section>

      <hr className="section-divider-amber" />

      {/* ── CTA ── */}
      <section className="py-20 md:py-28">
        <div className="container-site">
          <Animate preset="fade-up">
            <div className="cta-shell">
              <div className="section-label">Found Your City</div>
              <h2 className="heading-machined mt-4 text-3xl md:text-5xl">
                Found your city.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
                Self-host clawREFORM today, or join the waitlist for managed access
                when the hosted platform opens up.
              </p>
              <div className="mt-10 flex justify-center">
                <WaitlistForm successContent={installReveal} />
              </div>
            </div>
          </Animate>
        </div>
      </section>
    </SiteShell>
  );
}
