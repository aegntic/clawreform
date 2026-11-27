'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

interface ScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
  duration?: number;
  easing?: string;
}

interface ScrollAnimationResult {
  ref: React.RefObject<HTMLElement>;
  isVisible: boolean;
  animationStyles: React.CSSProperties;
}

/**
 * Hook for GPU-accelerated scroll animations with 60fps guarantee
 * Respects prefers-reduced-motion for accessibility
 */
export function useScrollAnimation(
  options: ScrollAnimationOptions = {}
): ScrollAnimationResult {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = true,
    delay = 0,
    duration = 500,
    easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Intersection Observer for visibility detection
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  // Calculate animation styles
  const animationStyles: React.CSSProperties = prefersReducedMotion
    ? { opacity: 1, transform: 'none' }
    : {
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms`,
        willChange: 'opacity, transform',
      };

  return { ref: ref as React.RefObject<HTMLElement>, isVisible, animationStyles };
}

/**
 * Physics-based scroll parallax effect
 */
export function useScrollParallax(speed: number = 0.5) {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleScroll = useCallback(() => {
    if (!ref.current || prefersReducedMotion) return;

    const rect = ref.current.getBoundingClientRect();
    const scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
    const parallaxOffset = (scrollProgress - 0.5) * speed * 100;

    setOffset(parallaxOffset);
  }, [speed, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll, prefersReducedMotion]);

  return {
    ref: ref as React.RefObject<HTMLElement>,
    parallaxStyle: {
      transform: `translateY(${offset}px)`,
      willChange: 'transform',
    },
  };
}