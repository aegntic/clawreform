"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "@/lib/animations";
import { heroTerminalLines as lines } from "@/lib/site";

export default function HeroTerminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const hasAnimated = useRef(false);

  const tweensRef = useRef<gsap.core.Tween[]>([]);

  useEffect(() => {
    if (!containerRef.current || hasAnimated.current) return;
    hasAnimated.current = true;

    // Delay before starting the terminal animation
    const startDelay = 0.6;
    const lineDelay = 0.15;

    lines.forEach((_, i) => {
      const tween = gsap.delayedCall(startDelay + i * lineDelay, () => {
        setVisibleLines((prev) => prev + 1);
      });
      tweensRef.current.push(tween);
    });

    return () => {
      tweensRef.current.forEach((t) => t.kill());
      tweensRef.current = [];
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="terminal-shell overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
          City Operations Trace
        </span>
      </div>

      <div className="p-4 md:p-6 font-mono text-xs md:text-sm leading-relaxed min-h-[280px]">
        {lines.slice(0, visibleLines).map((line, i) => {
          if (line.type === "gap") {
            return <div key={i} className="h-3" />;
          }

          const colorMap: Record<string, string> = {
            cmd: "text-[var(--text-primary)]",
            cmd2: "text-[var(--text-primary)]",
            out: "text-[var(--text-tertiary)]",
            json: "text-[var(--amber-core)]",
            success: "text-green-400",
          };

          return (
            <div
              key={i}
              className={`${colorMap[line.type] ?? "text-[var(--text-secondary)]"} terminal-line`}
              style={{
                opacity: 0,
                animation: "terminalFadeIn 0.2s ease forwards",
              }}
            >
              {line.text}
            </div>
          );
        })}

        {visibleLines >= lines.length && (
          <div className="mt-1 text-[var(--text-primary)]">
            <span>$ </span>
            <span className="inline-block w-2 h-4 bg-[var(--amber-core)] animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
