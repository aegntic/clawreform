"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { gsap, ScrollTrigger } from "@/lib/animations";
import { messageFlowStages, type MessageFlowStage } from "@/lib/site";

export default function MessageFlow() {
  const [activeStage, setActiveStage] = useState<MessageFlowStage | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const packetRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const clearActive = useCallback(() => {
    setActiveStage(null);
    setPopoverPos(null);
  }, []);

  // Scroll-driven packet animation
  useEffect(() => {
    if (!containerRef.current || !packetRef.current || hasAnimated.current) return;
    hasAnimated.current = true;

    const stages = containerRef.current.querySelectorAll(".flow-stage");
    const connectors = containerRef.current.querySelectorAll(".flow-connector");
    if (stages.length === 0) return;

    gsap.set(stages, { opacity: 0, y: 16 });
    gsap.to(stages, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      stagger: 0.06,
      ease: "power2.out",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%",
        once: true,
      },
    });

    gsap.set(connectors, { opacity: 0, scaleX: 0 });
    gsap.to(connectors, {
      opacity: 1,
      scaleX: 1,
      duration: 0.3,
      stagger: 0.06,
      delay: 0.15,
      ease: "power2.out",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%",
        once: true,
      },
    });

    const pipeline = containerRef.current.querySelector(".flow-pipeline");
    if (!pipeline) return;

    const totalWidth = pipeline.scrollWidth;
    const packetWidth = 14;

    gsap.to(packetRef.current, {
      x: totalWidth - packetWidth - 20,
      ease: "none",
      scrollTrigger: {
        trigger: pipeline,
        start: "top 80%",
        end: "bottom 40%",
        scrub: 0.6,
      },
    });
  }, []);

  const handleStageClick = useCallback((stage: MessageFlowStage, e: React.MouseEvent) => {
    if (activeStage?.id === stage.id) {
      clearActive();
      return;
    }
    setActiveStage(stage);

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setPopoverPos({
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 320),
    });
  }, [activeStage, clearActive]);

  // Close on outside click
  useEffect(() => {
    if (!activeStage) return;
    const handler = (e: MouseEvent) => {
      const popover = popoverRef.current;
      const container = containerRef.current;
      if (!popover || !container) return;
      if (!popover.contains(e.target as Node) && !container.contains(e.target as Node)) {
        clearActive();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [activeStage, clearActive]);

  // Animate popover in
  useEffect(() => {
    if (!popoverRef.current) return;
    if (activeStage) {
      gsap.fromTo(
        popoverRef.current,
        { opacity: 0, y: 6, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: "power2.out" },
      );
    }
  }, [activeStage]);

  return (
    <div ref={containerRef}>
      <div className="flow-pipeline">
        {messageFlowStages.map((stage, i) => (
          <div key={stage.id}>
            <div
              className={`flow-stage ${activeStage?.id === stage.id ? "flow-stage--active" : ""}`}
              onClick={(e) => handleStageClick(stage, e)}
            >
              <div className="flow-stage-label">{stage.label}</div>
              <div className="flow-stage-id">{stage.id}</div>
            </div>
            {i < messageFlowStages.length - 1 && (
              <div className="flow-connector" />
            )}
          </div>
        ))}
        <div ref={packetRef} className="flow-packet" />
      </div>

      {activeStage && popoverPos && (
        <div
          ref={popoverRef}
          className="arch-popover"
          style={{ top: popoverPos.top, left: popoverPos.left }}
        >
          <div className="arch-popover-tag">stage {activeStage.id}</div>
          <h3>{activeStage.label}</h3>
          <p>{activeStage.desc}</p>
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
