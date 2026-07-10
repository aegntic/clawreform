"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/animations";
import { archCrateLayers, architectureLayers, kernelSubsystems, type KernelSubsystem } from "@/lib/site";

export default function ArchitectureMap() {
  const [activeSubsystem, setActiveSubsystem] = useState<KernelSubsystem | null>(null);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const subsystemsRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const clearActive = useCallback(() => {
    setActiveSubsystem(null);
    setActiveLayerId(null);
    setPopoverPos(null);
  }, []);

  const activeItem = activeSubsystem
    ? { title: activeSubsystem.name, desc: activeSubsystem.desc, tag: "subsystem" as const }
    : activeLayerId
      ? (() => {
          const layer = archCrateLayers.find((l) => l.id === activeLayerId);
          const archLayer = architectureLayers.find((l) => layer && l.crates.some((c) => layer.crates.includes(c)));
          return { title: layer?.name ?? "", desc: archLayer?.desc ?? "", tag: "layer" as const };
        })()
      : null;

  const handleLayerClick = useCallback((layerId: string, e: React.MouseEvent) => {
    if (activeLayerId === layerId) {
      clearActive();
      return;
    }
    setActiveLayerId(layerId);
    setActiveSubsystem(null);

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setPopoverPos({
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 320),
    });
  }, [activeLayerId, clearActive]);

  const handleSubsystemClickPos = useCallback((sub: KernelSubsystem, e: React.MouseEvent) => {
    if (activeSubsystem?.id === sub.id) {
      clearActive();
      return;
    }
    setActiveSubsystem(sub);
    setActiveLayerId("kernel");

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setPopoverPos({
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 320),
    });
  }, [activeSubsystem, clearActive]);

  // Close on outside click
  useEffect(() => {
    if (!activeItem) return;
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

  // Scroll animation: layers fade in, then subsystems scale in
  useEffect(() => {
    if (!containerRef.current || hasAnimated.current) return;
    hasAnimated.current = true;

    const layers = containerRef.current.querySelectorAll(".arch-layer");
    const subsystems = containerRef.current.querySelector(".arch-subsystems");

    const triggers: ScrollTrigger[] = [];

    if (layers.length > 0) {
      gsap.set(layers, { opacity: 0, y: 20 });
      const tween = gsap.to(layers, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
          once: true,
        },
      });
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
    }

    if (subsystems) {
      gsap.set(subsystems, { opacity: 0, scale: 0.96 });
      const tween = gsap.to(subsystems, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        delay: 0.3,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
          once: true,
        },
      });
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
    }

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="arch-map">
      {archCrateLayers.map((layer, i) => (
        <div
          key={layer.id}
          ref={(el) => { layerRefs.current[i] = el; }}
          className={`arch-layer ${activeLayerId === layer.id ? "arch-layer--active" : ""}`}
          onClick={(e) => handleLayerClick(layer.id, e)}
        >
          <div className="arch-layer-label">
            L{archCrateLayers.length - i}
          </div>
          <div className="arch-layer-name">{layer.name}</div>
          <div className="arch-layer-crates">
            {layer.crates.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </div>
      ))}

      <div ref={subsystemsRef} className="arch-subsystems">
        {kernelSubsystems.map((sub) => {
          const isDimmed = activeSubsystem && activeSubsystem.id !== sub.id;
          return (
            <div
              key={sub.id}
              className={`arch-subsystem ${
                activeSubsystem?.id === sub.id ? "arch-subsystem--active" : ""
              } ${isDimmed ? "arch-subsystem--dimmed" : ""}`}
              onClick={(e) => handleSubsystemClickPos(sub, e)}
            >
              <div className="arch-subsystem-name">{sub.name}</div>
              <div className="arch-subsystem-id">{sub.id}</div>
            </div>
          );
        })}
      </div>

      {/* Floating detail popover — fixed position to escape parent overflow:hidden */}
      {activeItem && popoverPos && (
        <div
          ref={popoverRef}
          className="arch-popover"
          style={{ top: popoverPos.top, left: popoverPos.left }}
        >
          <div className="arch-popover-tag">{activeItem.tag}</div>
          <h3>{activeItem.title}</h3>
          <p>{activeItem.desc}</p>
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
