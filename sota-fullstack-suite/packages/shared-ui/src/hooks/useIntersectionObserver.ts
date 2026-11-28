'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface IntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
  triggerOnce?: boolean;
}

interface IntersectionObserverResult {
  ref: React.RefObject<HTMLElement>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

/**
 * Optimized Intersection Observer hook for lazy loading
 * and scroll-based animations
 */
export function useIntersectionObserver(
  options: IntersectionObserverOptions = {}
): IntersectionObserverResult {
  const { threshold = 0, rootMargin = '0px', root = null, triggerOnce = false } = options;

  const ref = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  const updateEntry = useCallback(
    ([newEntry]: IntersectionObserverEntry[]) => {
      if (newEntry) {
        setEntry(newEntry);
        setIsIntersecting(newEntry.isIntersecting);

        if (triggerOnce && newEntry.isIntersecting && ref.current) {
          observerRef.current?.unobserve(ref.current);
        }
      }
    },
    [triggerOnce]
  );

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    observerRef.current = new IntersectionObserver(updateEntry, {
      threshold,
      rootMargin,
      root,
    });

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, root, updateEntry]);

  return { ref: ref as React.RefObject<HTMLElement>, isIntersecting, entry };
}