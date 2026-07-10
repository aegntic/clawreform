"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

// Register once globally
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
}

/**
 * Animation presets — all subtle, one-directional, physics-based.
 * No bouncing, no spinning. Elements resolve to their natural position.
 */

export type AnimationPreset =
  | "fade-up"
  | "fade-in"
  | "fade-up-stagger"
  | "slide-in-left"
  | "slide-in-right"
  | "scale-in"
  | "draw-in"
  | "glow-pulse";

export interface AnimationConfig {
  /** Starting properties (gsap `from` values) */
  from: gsap.TweenVars;
  /** Ending properties */
  to: gsap.TweenVars;
  /** ScrollTrigger start position */
  start?: string;
  /** Duration in seconds */
  duration?: number;
  /** Stagger delay between children (if stagger animation) */
  stagger?: number;
}

export const presets: Record<AnimationPreset, AnimationConfig> = {
  "fade-up": {
    from: { opacity: 0, y: 40 },
    to: { opacity: 1, y: 0, ease: "power3.out" },
    duration: 0.8,
    start: "top 88%",
  },
  "fade-in": {
    from: { opacity: 0 },
    to: { opacity: 1, ease: "power2.out" },
    duration: 0.6,
    start: "top 90%",
  },
  "fade-up-stagger": {
    from: { opacity: 0, y: 30 },
    to: { opacity: 1, y: 0, ease: "power3.out" },
    duration: 0.6,
    stagger: 0.1,
    start: "top 85%",
  },
  "slide-in-left": {
    from: { opacity: 0, x: -60 },
    to: { opacity: 1, x: 0, ease: "power3.out" },
    duration: 0.8,
    start: "top 85%",
  },
  "slide-in-right": {
    from: { opacity: 0, x: 60 },
    to: { opacity: 1, x: 0, ease: "power3.out" },
    duration: 0.8,
    start: "top 85%",
  },
  "scale-in": {
    from: { opacity: 0, scale: 0.92 },
    to: { opacity: 1, scale: 1, ease: "power2.out" },
    duration: 0.7,
    start: "top 88%",
  },
  "draw-in": {
    from: { opacity: 0, y: 20, scaleY: 0.95 },
    to: { opacity: 1, y: 0, scaleY: 1, ease: "power2.out" },
    duration: 0.9,
    start: "top 85%",
  },
  "glow-pulse": {
    from: { opacity: 0, scaleX: 0 },
    to: { opacity: 0.6, scaleX: 1, ease: "power2.inOut" },
    duration: 1.2,
    start: "top 90%",
  },
};

export { gsap, ScrollTrigger };
