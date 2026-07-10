"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/animations";
import ScrollSequenceCanvas from "@/components/scroll-sequence-canvas";

type ScrollStoryStep = {
  index?: string;
  eyebrow?: string;
  title: string;
  desc: string;
};

type ScrollStoryProps = {
  eyebrow: string;
  title: string;
  description: string;
  steps: readonly ScrollStoryStep[];
  aside?: ReactNode;
  theme?: "fabric" | "memory";
  sequence: {
    basePath: string;
    frameCount: number;
    width: number;
    height: number;
  };
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function ScrollStory({
  eyebrow,
  title,
  description,
  steps,
  aside,
  theme = "fabric",
  sequence,
}: ScrollStoryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isPinnedMode, setIsPinnedMode] = useState(false);

  const maxIndex = Math.max(steps.length - 1, 0);
  const activeIndex = clamp(Math.round(progress), 0, maxIndex);
  const activeStep = steps[activeIndex] ?? steps[0];

  useEffect(() => {
    if (!rootRef.current || !frameRef.current) return;

    const root = rootRef.current;
    const frame = frameRef.current;
    let rafId = 0;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 1101px)", () => {
      setIsPinnedMode(true);
      setProgress(0);

      const totalScroll = Math.max(steps.length - 1, 1) * window.innerHeight * 0.9;
      const trigger = ScrollTrigger.create({
        trigger: root,
        start: "top top+=88",
        end: `+=${totalScroll}`,
        pin: frame,
        scrub: 0.4,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate(self) {
          const nextProgress = self.progress * Math.max(steps.length - 1, 1);
          cancelAnimationFrame(rafId);
          rafId = window.requestAnimationFrame(() => {
            setProgress(nextProgress);
          });
        },
      });

      return () => {
        cancelAnimationFrame(rafId);
        trigger.kill();
      };
    });

    mm.add("(max-width: 1100px)", () => {
      setIsPinnedMode(false);
      setProgress(0);
      return () => undefined;
    });

    return () => {
      cancelAnimationFrame(rafId);
      mm.revert();
    };
  }, [steps.length]);

  return (
    <div
      ref={rootRef}
      className={`scroll-story scroll-story-${theme} ${
        isPinnedMode ? "is-pinned" : "is-stacked"
      }`}
      style={{ ["--story-steps" as string]: steps.length }}
    >
      <div ref={frameRef} className="scroll-story-frame">
        <div className="scroll-story-panel">
          <div className="section-label">{eyebrow}</div>
          <h2 className="heading-machined mt-4 text-3xl md:text-5xl">{title}</h2>
          <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
            {description}
          </p>

          <div className="scroll-story-active-card">
            <div className="scroll-story-reading-label">What you are seeing</div>
            <div className="scroll-story-active-top">
              <span className="scroll-story-badge">
                {activeStep?.index ?? String(activeIndex + 1).padStart(2, "0")}
              </span>
              <span className="story-key">{activeStep?.eyebrow ?? eyebrow}</span>
            </div>
            <h3 className="mt-4 text-2xl font-semibold">{activeStep?.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-[var(--text-primary)] md:text-lg">
              {activeStep?.desc}
            </p>
          </div>

          <div className="scroll-story-progress" aria-hidden="true">
            {steps.map((step, index) => (
              <span
                key={step.title}
                className={`scroll-story-dot ${index === activeIndex ? "is-active" : ""}`}
              />
            ))}
          </div>

          <div className="scroll-story-title-rail">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`scroll-story-title-chip ${index === activeIndex ? "is-active" : ""}`}
              >
                <span className="scroll-story-title-index">
                  {step.index ?? String(index + 1).padStart(2, "0")}
                </span>
                <span>{step.title}</span>
              </div>
            ))}
          </div>

          {aside ? <div className="scroll-story-aside">{aside}</div> : null}
        </div>

        <div className="scroll-story-visual">
          <div className="scroll-story-stage">
            <ScrollSequenceCanvas
              basePath={sequence.basePath}
              frameCount={sequence.frameCount}
              width={sequence.width}
              height={sequence.height}
              progress={maxIndex === 0 ? 0 : progress / maxIndex}
            />
            <div className="scroll-story-stage-overlay">
              <div className="scroll-story-reading-label">Plain-English step</div>
              <div className="scroll-story-step-top">
                <span className="scroll-story-badge">
                  {activeStep?.index ?? String(activeIndex + 1).padStart(2, "0")}
                </span>
                <span className="story-key">{activeStep?.eyebrow ?? eyebrow}</span>
              </div>
              <h3 className="mt-5 text-2xl font-semibold">{activeStep?.title}</h3>
              <p className="mt-3 max-w-[34rem] text-base leading-relaxed text-[var(--text-primary)] md:text-lg">
                {activeStep?.desc}
              </p>
            </div>
          </div>

          <div className="scroll-story-mobile-list">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className={`scroll-story-step ${index === activeIndex ? "is-active" : ""}`}
              >
                <div className="scroll-story-step-top">
                  <span className="scroll-story-badge">
                    {step.index ?? String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="story-key">{step.eyebrow ?? eyebrow}</span>
                </div>
                <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {step.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
