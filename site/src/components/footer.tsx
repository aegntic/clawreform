import BrandLogo from "@/components/brand-logo";
import ShareButtons from "@/components/share-buttons";
import { siteBrand, siteFooterMeta, siteFooterSections } from "@/lib/site";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-base)]">
      <div className="container-site py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-5 inline-flex items-center">
              <BrandLogo />
            </Link>
            <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
              The self-evolving Agent OS by aegntic.ai.
              Sovereign specialists, durable artifacts, and observable repair loops.
            </p>
          </div>

          {Object.entries(siteFooterSections).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-4">
                {section}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="glow-line mb-6" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--text-tertiary)]">
          <span>
            &copy; {new Date().getFullYear()} {siteBrand.owner}. Dual-licensed MIT / Apache 2.0.
          </span>
          <div className="flex items-center gap-4">
            <Link href={siteFooterMeta.github} className="hover:text-[var(--text-secondary)] transition-colors">
              GitHub
            </Link>
            <Link href={siteFooterMeta.x} className="hover:text-[var(--text-secondary)] transition-colors">
              X / Twitter
            </Link>
            <ShareButtons />
          </div>
        </div>
      </div>
    </footer>
  );
}
