"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import ShareButtons from "@/components/share-buttons";

type WaitlistFormProps = {
  successContent?: ReactNode;
};

export default function WaitlistForm({ successContent }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="metal-panel max-w-xl px-6 py-5 text-center">
        <p className="text-[var(--amber-core)] font-semibold">You&apos;re on the list.</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          We&apos;ll reach out when your access is ready.
        </p>
        {successContent ? <div className="mt-4">{successContent}</div> : null}
        <div className="mt-4">
          <ShareButtons variant="stack" label="Tell your team" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        className="metal-input flex-1 px-4 py-3 text-sm"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="metal-button-primary px-6 py-3 text-sm rounded-lg whitespace-nowrap disabled:opacity-60"
      >
        {status === "loading" ? "Joining..." : "Get Early Access"}
      </button>
      {status === "error" && (
        <p className="text-red-400 text-xs mt-1 sm:mt-0 sm:self-center">
          Something went wrong. Try again.
        </p>
      )}
    </form>
  );
}
