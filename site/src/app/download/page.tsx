import type { Metadata } from "next";
import Animate from "@/components/animate";
import Link from "next/link";
import SiteShell from "@/components/site-shell";
import { createPageMetadata, downloadMethods } from "@/lib/site";

export const metadata: Metadata = createPageMetadata(
  "/download",
  "Download & Install",
  "Install clawREFORM from source, prebuilt binary, or Docker. One binary, zero runtime dependencies.",
);

export default function DownloadPage() {
  return (
    <SiteShell>
        <div className="container-site">
          <Animate preset="fade-up">
            <div className="max-w-3xl mb-16">
              <h1 className="heading-machined text-4xl md:text-5xl mb-4">
                Download & Install
              </h1>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                One binary. Zero runtime dependencies. Runs on Linux, macOS, and
                Windows.
              </p>
            </div>
          </Animate>

          <Animate
            preset="fade-up-stagger"
            stagger
            staggerAmount={0.1}
            className="space-y-8"
          >
            {downloadMethods.map((m) => (
              <div key={m.title} className="metal-panel p-6 md:p-8">
                <h2 className="font-bold text-xl mb-4">{m.title}</h2>
                <div className="debossed p-4 mb-3">
                  <pre className="text-sm font-mono text-[var(--amber-core)] leading-loose overflow-x-auto">
                    {m.steps.map((s, i) => (
                      <span key={i}>
                        <span className="text-[var(--text-tertiary)]">$ </span>
                        {s}
                        {"\n"}
                      </span>
                    ))}
                  </pre>
                </div>
                <p className="text-sm text-[var(--text-tertiary)]">{m.note}</p>
              </div>
            ))}
          </Animate>

          {/* Quick verify */}
          <Animate preset="fade-up" delay={0.2}>
            <div className="mt-12 metal-panel p-6 md:p-8">
              <h2 className="font-bold text-xl mb-4">Verify it works</h2>
              <div className="debossed p-4 mb-3">
                <pre className="text-sm font-mono text-[var(--amber-core)] leading-loose overflow-x-auto">
                  <span className="text-[var(--text-tertiary)]">$ </span>curl http://127.0.0.1:4332/api/health{"\n"}
                  <span className="text-[var(--text-secondary)]">{`{"status":"ok","version":"0.3.0"}`}</span>
                </pre>
              </div>
              <p className="text-sm text-[var(--text-tertiary)]">
                The API runs on port 4332 by default. The embedded dashboard is at{" "}
                <code className="text-[var(--text-secondary)]">http://127.0.0.1:4332/</code>.
              </p>
            </div>
          </Animate>

          {/* System requirements */}
          <Animate preset="fade-up" delay={0.3}>
            <div className="mt-12 max-w-2xl">
              <h2 className="heading-machined text-2xl mb-6">System Requirements</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="debossed p-4">
                  <h3 className="font-semibold text-sm mb-1">OS</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Linux, macOS, Windows</p>
                </div>
                <div className="debossed p-4">
                  <h3 className="font-semibold text-sm mb-1">RAM</h3>
                  <p className="text-sm text-[var(--text-secondary)]">512 MB minimum, 2 GB recommended</p>
                </div>
                <div className="debossed p-4">
                  <h3 className="font-semibold text-sm mb-1">Disk</h3>
                  <p className="text-sm text-[var(--text-secondary)]">~50 MB for the binary</p>
                </div>
                <div className="debossed p-4">
                  <h3 className="font-semibold text-sm mb-1">Build from source</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Rust 1.75+, C linker</p>
                </div>
              </div>
            </div>
          </Animate>

          <Animate preset="fade-up" delay={0.4}>
            <div className="mt-12 text-center">
              <Link
                href="/docs/getting-started"
                className="metal-button-primary px-6 py-3 text-sm rounded-lg inline-block"
              >
                Getting started guide
              </Link>
            </div>
          </Animate>
        </div>
    </SiteShell>
  );
}
