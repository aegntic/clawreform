"use client";

import type { ReactNode } from "react";
import Footer from "@/components/footer";
import Header from "@/components/header";

type SiteShellProps = {
  children: ReactNode;
  mainClassName?: string;
};

export default function SiteShell({
  children,
  mainClassName = "pt-28 pb-20",
}: SiteShellProps) {
  return (
    <>
      <Header />
      <main className={mainClassName}>{children}</main>
      <Footer />
    </>
  );
}
