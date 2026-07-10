import type { Metadata } from "next";
import Animate from "@/components/animate";
import Link from "next/link";
import SiteShell from "@/components/site-shell";
import { createPageMetadata, pricingTiers } from "@/lib/site";

export const metadata: Metadata = createPageMetadata(
  "/pricing",
  "Pricing",
  "clawREFORM is open source and free to self-host. Managed hosting and enterprise support coming soon.",
);

export default function PricingPage() {
  return (
    <SiteShell>
        <div className="container-site">
          <Animate preset="fade-up">
            <div className="max-w-3xl mb-16 text-center mx-auto">
              <h1 className="heading-machined text-4xl md:text-5xl mb-4">
                Pricing
              </h1>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                clawREFORM is open source and free to self-host. Pay only if you
                want us to run it for you.
              </p>
            </div>
          </Animate>

          <Animate
            preset="fade-up-stagger"
            stagger
            staggerAmount={0.12}
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`metal-panel p-6 md:p-8 flex flex-col ${
                  tier.highlight
                    ? "border-[var(--amber-core)]/30 shadow-[var(--shadow-amber)]"
                    : ""
                }`}
              >
                {tier.highlight && (
                  <div className="text-xs font-semibold text-[var(--amber-core)] uppercase tracking-wider mb-3">
                    Recommended
                  </div>
                )}
                <h2 className="font-bold text-xl mb-1">{tier.name}</h2>
                <div className="text-2xl font-bold text-[var(--amber-core)] mb-2">
                  {tier.price}
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                  {tier.desc}
                </p>
                <ul className="space-y-2 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="text-sm text-[var(--text-secondary)] flex items-start gap-2"
                    >
                      <span className="text-[var(--amber-core)] mt-0.5 shrink-0">
                        &#x2713;
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.cta.href}
                  className={`text-center py-3 text-sm rounded-lg ${
                    tier.highlight ? "metal-button-primary" : "metal-button"
                  }`}
                >
                  {tier.cta.label}
                </Link>
              </div>
            ))}
          </Animate>
        </div>
    </SiteShell>
  );
}
