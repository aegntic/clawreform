import type { Metadata } from "next";
import Animate from "@/components/animate";
import Link from "next/link";
import SiteShell from "@/components/site-shell";
import { createPageMetadata, docsConfigurationEnvVars } from "@/lib/site";

export const metadata: Metadata = createPageMetadata(
  "/docs/configuration",
  "Configuration",
  "Configure clawREFORM with TOML config files and environment variables. Every field has a serde default.",
);

export default function ConfigurationPage() {
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
              Configuration
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-12">
              clawREFORM uses a single TOML config file at{" "}
              <code className="text-[var(--text-primary)]">~/.clawreform/config.toml</code>.
              Every field has a serde default — the binary runs with zero config on first launch.
            </p>
          </Animate>

          {/* Example config */}
          <Animate preset="scale-in">
            <div className="metal-panel p-6 md:p-8 mb-10">
              <h2 className="font-bold text-xl mb-4">Example config.toml</h2>
              <div className="debossed p-4">
                <pre className="text-sm font-mono text-[var(--amber-core)] leading-loose overflow-x-auto">
{`[api]
port = 4332
host = "127.0.0.1"

[budget]
global_limit_usd = 10.0
per_agent_limit_usd = 2.0
alert_threshold = 0.8

[llm.default]
provider = "groq"
model = "llama-3.3-70b-versatile"
temperature = 0.7
max_tokens = 4096

[llm.quality]
provider = "openai"
model = "gpt-4o"
temperature = 0.3

[network]
enable_ofp = true
listen_port = 4333
seed_peers = []`}
                </pre>
              </div>
            </div>
          </Animate>

          {/* Environment variables */}
          <Animate preset="fade-up" delay={0.1}>
            <h2 className="heading-machined text-2xl mb-6">
              Environment Variables
            </h2>
          </Animate>

          <Animate
            preset="fade-up-stagger"
            stagger
            staggerAmount={0.06}
            className="space-y-3 mb-12"
          >
            {docsConfigurationEnvVars.map((v) => (
              <div key={v.name} className="debossed p-4 flex flex-col sm:flex-row sm:items-baseline gap-2">
                <code className="text-[var(--amber-core)] font-mono text-sm font-bold shrink-0">
                  {v.name}
                </code>
                <span className="text-sm text-[var(--text-secondary)]">{v.desc}</span>
              </div>
            ))}
          </Animate>

          <Animate preset="fade-up" delay={0.3}>
            <div className="flex gap-4">
              <Link
                href="/docs/api"
                className="metal-button-primary px-6 py-3 text-sm rounded-lg"
              >
                API reference
              </Link>
              <Link
                href="/docs/getting-started"
                className="metal-button px-6 py-3 text-sm rounded-lg"
              >
                Getting started
              </Link>
            </div>
          </Animate>
        </div>
    </SiteShell>
  );
}
