import type { Metadata } from "next";
import { siteBrand, siteTheme } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteBrand.baseUrl),
  title: {
    default: `${siteBrand.name} — The City That Runs Your Agents`,
    template: "%s | clawREFORM",
  },
  description:
    "An open-source Agent OS. Run, orchestrate, and govern autonomous AI agents from a single Rust-powered kernel.",
  keywords: [
    "AI agents",
    "agent OS",
    "autonomous agents",
    "agent orchestration",
    "Rust",
    "open source",
    "clawREFORM",
    "aegntic",
  ],
  authors: [{ name: "aegntic.ai" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteBrand.baseUrl,
    siteName: siteBrand.name,
    title: `${siteBrand.name} — The City That Runs Your Agents`,
    description:
      "An open-source Agent OS. Run, orchestrate, and govern autonomous AI agents from a single Rust-powered kernel.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteBrand.name} — The City That Runs Your Agents`,
    description:
      "An open-source Agent OS. Run, orchestrate, and govern autonomous AI agents from a single Rust-powered kernel.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={siteTheme.modes[siteTheme.defaultMode].className}>
      <body className="min-h-screen antialiased relative">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
