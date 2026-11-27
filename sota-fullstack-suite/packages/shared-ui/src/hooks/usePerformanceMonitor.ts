'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface WebVitals {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
  inp: number | null;
}

interface PerformanceEntry {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

interface PerformanceMonitorOptions {
  reportToAnalytics?: boolean;
  logToConsole?: boolean;
  onMetric?: (metric: PerformanceEntry) => void;
}

const PERFORMANCE_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
  inp: { good: 200, poor: 500 },
};

function getRating(name: keyof typeof PERFORMANCE_THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = PERFORMANCE_THRESHOLDS[name];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Hook for real-time Core Web Vitals monitoring
 * Automatically tracks LCP, FID, CLS, FCP, TTFB, and INP
 */
export function usePerformanceMonitor(options: PerformanceMonitorOptions = {}) {
  const { reportToAnalytics = false, logToConsole = true, onMetric } = options;
  const [vitals, setVitals] = useState<WebVitals>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null,
  });
  const observerRef = useRef<PerformanceObserver | null>(null);

  const handleMetric = useCallback(
    (name: keyof WebVitals, value: number) => {
      const rating = getRating(name, value);
      const metric: PerformanceEntry = { name, value, rating };

      if (logToConsole) {
        console.log(`[Performance] ${name}: ${value}ms (${rating})`);
      }

      if (reportToAnalytics) {
        // Send to analytics endpoint
        fetch('/api/analytics/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metric),
        }).catch(() => {});
      }

      if (onMetric) {
        onMetric(metric);
      }

      setVitals((prev) => ({ ...prev, [name]: value }));
    },
    [logToConsole, reportToAnalytics, onMetric]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Observe LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as globalThis.PerformanceEntry & { renderTime?: number; loadTime?: number };
        const value = lastEntry.renderTime || lastEntry.loadTime || 0;
        handleMetric('lcp', value);
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // Browser doesn't support LCP
    }

    // Observe FID
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as globalThis.PerformanceEntry & { processingStart?: number; startTime?: number };
        const value = (firstEntry.processingStart || 0) - (firstEntry.startTime || 0);
        handleMetric('fid', value);
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      // Browser doesn't support FID
    }

    // Observe CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as globalThis.PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value || 0;
          }
        }
        handleMetric('cls', clsValue * 1000); // Convert to ms for consistency
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      // Browser doesn't support CLS
    }

    // Get FCP and TTFB from navigation timing
    const navigationEntries = performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
      handleMetric('fcp', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
      handleMetric('ttfb', navEntry.responseStart - navEntry.requestStart);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleMetric]);

  return {
    vitals,
    getOverallRating: useCallback(() => {
      const ratings = Object.entries(vitals)
        .filter(([, value]) => value !== null)
        .map(([key, value]) => getRating(key as keyof typeof PERFORMANCE_THRESHOLDS, value!));

      if (ratings.length === 0) return 'pending';
      if (ratings.every((r) => r === 'good')) return 'good';
      if (ratings.some((r) => r === 'poor')) return 'poor';
      return 'needs-improvement';
    }, [vitals]),
  };
}