import type { Metadata } from "next";
import Animate from "@/components/animate";
import Link from "next/link";
import SiteShell from "@/components/site-shell";
import { createPageMetadata, docsApiEndpoints } from "@/lib/site";

export const metadata: Metadata = createPageMetadata(
  "/docs/api",
  "API Reference",
  "Complete REST API reference for the clawREFORM daemon: agents, budget, peers, A2A, and system health.",
);

const methodColors: Record<string, string> = {
  GET: "text-green-400",
  POST: "text-[var(--amber-core)]",
  PUT: "text-blue-400",
};

export default function ApiPage() {
  return (
    <SiteShell>
        <div className="container-site max-w-4xl">
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
              API Reference
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-12">
              All REST endpoints served by the clawREFORM daemon on port 4332.
            </p>
          </Animate>

          {/* Endpoint table */}
          <Animate preset="scale-in">
            <div className="metal-panel overflow-hidden mb-12">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)]">
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
                        Method
                      </th>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
                        Path
                      </th>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
                        Purpose
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {docsApiEndpoints.map((ep) => (
                      <tr
                        key={`${ep.method}-${ep.path}`}
                        className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-white/[0.02]"
                      >
                        <td className={`px-6 py-3 font-mono font-bold ${methodColors[ep.method] ?? ""}`}>
                          {ep.method}
                        </td>
                        <td className="px-6 py-3 font-mono text-[var(--text-primary)]">
                          {ep.path}
                        </td>
                        <td className="px-6 py-3 text-[var(--text-secondary)]">
                          {ep.purpose}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Animate>

          {/* Example */}
          <Animate preset="fade-up" delay={0.1}>
            <div className="metal-panel p-6 md:p-8">
              <h2 className="font-bold text-xl mb-4">Example: Send a message</h2>
              <div className="debossed p-4 mb-3">
                <pre className="text-sm font-mono text-[var(--amber-core)] leading-loose overflow-x-auto">
{`$ curl -X POST http://127.0.0.1:4332/api/agents/default/message \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Summarize the Rust changelog in 3 bullets"}'`}
                </pre>
              </div>
              <p className="text-sm text-[var(--text-tertiary)]">
                The agent routes the message to the configured LLM provider, executes any
                tool calls, and returns the final response. Budget is metered per call.
              </p>
            </div>
          </Animate>

          <Animate preset="fade-up" delay={0.2}>
            <div className="mt-12 flex gap-4">
              <Link
                href="/docs/configuration"
                className="metal-button-primary px-6 py-3 text-sm rounded-lg"
              >
                Configuration
              </Link>
              <Link
                href="/docs/concepts"
                className="metal-button px-6 py-3 text-sm rounded-lg"
              >
                Core concepts
              </Link>
            </div>
          </Animate>
        </div>
    </SiteShell>
  );
}
