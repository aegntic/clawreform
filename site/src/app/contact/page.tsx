import type { Metadata } from "next";
import Animate from "@/components/animate";
import WaitlistForm from "@/components/waitlist-form";
import SiteShell from "@/components/site-shell";
import { createPageMetadata, siteBrand } from "@/lib/site";

export const metadata: Metadata = createPageMetadata(
  "/contact",
  "Contact",
  "Get early access to clawREFORM managed hosting, or reach out about enterprise deployments.",
);

export default function ContactPage() {
  return (
    <SiteShell>
        <div className="container-site max-w-2xl">
          <Animate preset="fade-up">
            <h1 className="heading-machined text-4xl md:text-5xl mb-4">
              Get in touch
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-12">
              Join the early access list for managed hosting, or reach out directly
              for enterprise inquiries.
            </p>
          </Animate>

          {/* Waitlist */}
          <Animate preset="fade-up" delay={0.1}>
            <div className="metal-panel p-6 md:p-8 mb-8">
              <h2 className="font-bold text-xl mb-2">Early Access Waitlist</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Drop your email and we will reach out when your access is ready.
                Alpha pricing locks in for early adopters.
              </p>
              <WaitlistForm />
            </div>
          </Animate>

          {/* Direct contact */}
          <Animate preset="fade-up" delay={0.2}>
            <div className="metal-panel p-6 md:p-8 mb-8">
              <h2 className="font-bold text-xl mb-2">Enterprise & Partnerships</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                For dedicated deployments, custom integrations, or partnership
                discussions:
              </p>
              <div className="debossed p-4">
                <p className="text-sm font-mono text-[var(--amber-core)]">
                  {siteBrand.contactEmail}
                </p>
              </div>
            </div>
          </Animate>

          {/* Community */}
          <Animate preset="fade-up" delay={0.3}>
            <div className="metal-panel p-6 md:p-8">
              <h2 className="font-bold text-xl mb-2">Community</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                File issues, request features, or contribute directly:
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://github.com/aegntic/clawreform"
                  className="metal-button px-4 py-2 text-sm rounded-lg"
                >
                  GitHub
                </a>
                <a
                  href="https://github.com/aegntic/clawreform/issues"
                  className="metal-button px-4 py-2 text-sm rounded-lg"
                >
                  Issues
                </a>
                <a
                  href="https://github.com/aegntic/clawreform/discussions"
                  className="metal-button px-4 py-2 text-sm rounded-lg"
                >
                  Discussions
                </a>
              </div>
            </div>
          </Animate>
        </div>
    </SiteShell>
  );
}
