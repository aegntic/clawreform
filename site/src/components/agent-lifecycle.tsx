"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { gsap, ScrollTrigger } from "@/lib/animations";
import { agentStates, stateTransitions, type AgentState, type StateTransition } from "@/lib/site";

type ActiveItem =
  | { type: "state"; state: AgentState }
  | { type: "transition"; transition: StateTransition };

export default function AgentLifecycle() {
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const clearActive = useCallback(() => {
    setActiveItem(null);
    setPopoverPos(null);
  }, []);

  // Animate cards in on scroll
  useEffect(() => {
    if (!diagramRef.current || hasAnimated.current) return;
    hasAnimated.current = true;

    const cards = diagramRef.current.querySelectorAll(".lc-card");
    const arrows = diagramRef.current.querySelectorAll(".lc-arrow");

    gsap.set(cards, { opacity: 0, y: 12 });
    gsap.to(cards, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      stagger: 0.08,
      ease: "power2.out",
      scrollTrigger: {
        trigger: diagramRef.current,
        start: "top 85%",
        once: true,
      },
    });

    gsap.set(arrows, { opacity: 0 });
    gsap.to(arrows, {
      opacity: 1,
      duration: 0.3,
      stagger: 0.06,
      delay: 0.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: diagramRef.current,
        start: "top 85%",
        once: true,
      },
    });
  }, []);

  const handleTransitionClick = useCallback((transition: StateTransition, e: React.MouseEvent) => {
    setActiveItem((prev) =>
      prev?.type === "transition" && prev.transition.id === transition.id ? null : { type: "transition" as const, transition },
    );

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setPopoverPos({
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 320),
    });
  }, []);

  const handleStateClick = useCallback((state: AgentState, e: React.MouseEvent) => {
    setActiveItem((prev) =>
      prev?.type === "state" && prev.state.id === state.id ? null : { type: "state" as const, state },
    );

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setPopoverPos({
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 320),
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!activeItem) return;
    const handler = (e: MouseEvent) => {
      const popover = popoverRef.current;
      const diagram = diagramRef.current;
      if (!popover || !diagram) return;
      if (!popover.contains(e.target as Node) && !diagram.contains(e.target as Node)) {
        clearActive();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [activeItem, clearActive]);

  // Animate popover in
  useEffect(() => {
    if (!popoverRef.current) return;
    if (activeItem) {
      gsap.fromTo(
        popoverRef.current,
        { opacity: 0, y: 6, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: "power2.out" },
      );
    }
  }, [activeItem]);

  const validTransitionsFrom = (stateId: string) =>
    stateTransitions.filter((t) => t.from === stateId);

  // Get transition label for a given from→to pair
  const getTransition = (from: string, to: string) =>
    stateTransitions.find((t) => t.from === from && t.to === to);

  return (
    <div ref={diagramRef}>
      <div className="lc-flow">
        {/* Top row: Spawn → Running → Terminated */}
        <div className="lc-row lc-row--main">
          <div
            className={`lc-card ${activeItem?.type === "state" && activeItem.state.id === "spawn" ? "lc-card--active" : ""}`}
            style={{ "--lc-color": "var(--amber-hot)" } as React.CSSProperties}
            onClick={(e) => handleStateClick(agentStates[0], e)}
          >
            <div className="lc-card-name">{agentStates[0].name}</div>
            <div className="lc-card-status">Creating</div>
          </div>

          <div className="lc-arrow">
            <span className="lc-arrow-label">{getTransition("spawn", "running")?.label ?? "Activate"}</span>
          </div>

          <div
            className={`lc-card lc-card--highlight ${activeItem?.type === "state" && activeItem.state.id === "running" ? "lc-card--active" : ""}`}
            style={{ "--lc-color": "var(--amber-core)" } as React.CSSProperties}
            onClick={(e) => handleStateClick(agentStates[1], e)}
          >
            <div className="lc-card-name">{agentStates[1].name}</div>
            <div className="lc-card-status">Processing</div>
          </div>

          <div className="lc-arrow">
            <span className="lc-arrow-label">{getTransition("running", "terminated")?.label ?? "Shutdown"}</span>
          </div>

          <div
            className={`lc-card ${activeItem?.type === "state" && activeItem.state.id === "terminated" ? "lc-card--active" : ""}`}
            style={{ "--lc-color": "var(--metal-dark)" } as React.CSSProperties}
            onClick={(e) => handleStateClick(agentStates[3], e)}
          >
            <div className="lc-card-name">{agentStates[3].name}</div>
            <div className="lc-card-status">Stopped</div>
          </div>
        </div>

        {/* Branch row: Suspended */}
        <div className="lc-row lc-row--branch">
          <div
            className={`lc-card ${activeItem?.type === "state" && activeItem.state.id === "suspended" ? "lc-card--active" : ""}`}
            style={{ "--lc-color": "var(--metal-light)" } as React.CSSProperties}
            onClick={(e) => handleStateClick(agentStates[2], e)}
          >
            <div className="lc-card-name">{agentStates[2].name}</div>
            <div className="lc-card-status">Paused</div>
          </div>

          <div className="lc-arrow lc-arrow--return">
            <span className="lc-arrow-label">{getTransition("suspended", "running")?.label ?? "Resume"}</span>
          </div>

          <div className="lc-arrow lc-arrow--fall">
            <span className="lc-arrow-label">{getTransition("suspended", "terminated")?.label ?? "Decommission"}</span>
          </div>
        </div>
      </div>

      {activeItem && popoverPos && (
        <div
          ref={popoverRef}
          className="arch-popover"
          style={{ top: popoverPos.top, left: popoverPos.left }}
        >
          {activeItem.type === "transition" ? (
            <>
              <div className="arch-popover-tag">transition</div>
              <h3>
                {agentStates.find((s) => s.id === activeItem.transition.from)?.name}{" "}
                &rarr;{" "}
                {agentStates.find((s) => s.id === activeItem.transition.to)?.name}
              </h3>
              <p>{activeItem.transition.desc}</p>
            </>
          ) : (
            <>
              <div className="arch-popover-tag">state</div>
              <h3>{activeItem.state.name}</h3>
              <p>{activeItem.state.desc}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {validTransitionsFrom(activeItem.state.id).map((t) => (
                  <button
                    key={t.id}
                    className="text-xs px-3 py-1.5 rounded-full border border-[var(--amber-dim)] text-[var(--amber-core)] hover:bg-[rgba(245,165,36,0.1)] transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTransitionClick(t, e);
                    }}
                  >
                    {t.label} &rarr; {agentStates.find((s) => s.id === t.to)?.name}
                  </button>
                ))}
              </div>
            </>
          )}
          <button
            className="arch-popover-close"
            onClick={(e) => {
              e.stopPropagation();
              clearActive();
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
