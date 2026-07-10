"use client";

import { useRef, useEffect } from "react";
import { gsap, ScrollTrigger, presets, type AnimationPreset } from "@/lib/animations";

interface AnimateProps {
  children: React.ReactNode;
  /** Animation preset name */
  preset?: AnimationPreset;
  /** Extra delay in seconds */
  delay?: number;
  /** Additional className */
  className?: string;
  /** HTML tag for the wrapper */
  as?: keyof React.JSX.IntrinsicElements;
  /** If true, animate direct children with stagger */
  stagger?: boolean;
  /** Custom stagger value (overrides preset) */
  staggerAmount?: number;
}

/**
 * Scroll-triggered animation wrapper.
 * Elements animate in once when they enter the viewport, then stay.
 * No replay, no reverse — clean and intentional.
 */
export default function Animate({
  children,
  preset = "fade-up",
  delay = 0,
  className = "",
  as: Tag = "div",
  stagger = false,
  staggerAmount,
}: AnimateProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const config = presets[preset];

    if (stagger) {
      // Animate direct children with stagger
      const children = el.children;
      if (children.length === 0) return;

      gsap.set(children, config.from);
      const tween = gsap.to(children, {
        ...config.to,
        duration: config.duration ?? 0.8,
        delay,
        stagger: staggerAmount ?? config.stagger ?? 0.1,
        scrollTrigger: {
          trigger: el,
          start: config.start ?? "top 85%",
          once: true,
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    }

    // Single element animation
    gsap.set(el, config.from);
    const tween = gsap.to(el, {
      ...config.to,
      duration: config.duration ?? 0.8,
      delay,
      scrollTrigger: {
        trigger: el,
        start: config.start ?? "top 88%",
        once: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [preset, delay, stagger, staggerAmount]);

  // @ts-expect-error — dynamic tag with ref
  return <Tag ref={ref} className={className}>{children}</Tag>;
}


/**
 * Hook for custom GSAP animations on a specific ref.
 * Use this when <Animate> doesn't fit (e.g., text typewriter, counter, etc.)
 */
export function useScrollAnimation(
  callback: (el: HTMLElement) => gsap.core.Tween | gsap.core.Timeline,
  deps: React.DependencyList = []
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const animation = callback(ref.current);
    return () => {
      if ("scrollTrigger" in animation && animation.scrollTrigger) {
        (animation.scrollTrigger as ScrollTrigger).kill();
      }
      animation.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
