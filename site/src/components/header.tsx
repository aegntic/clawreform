"use client";

import BrandLogo from "@/components/brand-logo";
import { siteNavigation } from "@/lib/site";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-subtle)] bg-[rgba(18,18,20,0.74)] backdrop-blur-xl">
      <div className="container-site flex min-h-[4.5rem] items-center justify-between py-3">
        <Link href="/" className="group flex items-center">
          <BrandLogo
            className="transition-transform duration-200 group-hover:translate-x-0.5"
            wordmarkClassName="group-hover:text-[var(--amber-hot)]"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {siteNavigation.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-white/[0.04] hover:text-[var(--text-primary)]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="ml-3 rounded-full px-5 py-2.5 text-sm metal-button-primary"
          >
            Get Early Access
          </Link>
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="rounded-full p-2 text-[var(--text-secondary)] md:hidden"
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-[var(--border-subtle)] bg-[rgba(18,18,20,0.92)] backdrop-blur-xl md:hidden">
          <nav className="container-site py-4 flex flex-col gap-1">
            {siteNavigation.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-[var(--text-primary)]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-2xl px-4 py-3 text-center text-sm metal-button-primary"
            >
              Get Early Access
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
