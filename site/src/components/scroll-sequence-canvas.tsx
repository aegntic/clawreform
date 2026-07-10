"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ScrollSequenceCanvasProps = {
  basePath: string;
  frameCount: number;
  width: number;
  height: number;
  progress: number;
};

const PRELOAD_ROOT_MARGIN = "1100px 0px";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function frameUrl(basePath: string, index: number) {
  return `${basePath}/frame-${String(index + 1).padStart(4, "0")}.jpg`;
}

export default function ScrollSequenceCanvas({
  basePath,
  frameCount,
  width,
  height,
  progress,
}: ScrollSequenceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<Array<HTMLImageElement | null>>([]);
  const loadedRef = useRef<boolean[]>([]);
  const activeFrameRef = useRef(-1);
  const [shouldLoad, setShouldLoad] = useState(false);

  const urls = useMemo(
    () => Array.from({ length: frameCount }, (_, index) => frameUrl(basePath, index)),
    [basePath, frameCount]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: PRELOAD_ROOT_MARGIN }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;

    let cancelled = false;

    imagesRef.current = Array.from({ length: frameCount }, () => null);
    loadedRef.current = Array.from({ length: frameCount }, () => false);
    activeFrameRef.current = -1;

    urls.forEach((url, index) => {
      const image = new Image();
      image.decoding = "async";
      image.src = url;
      image.onload = () => {
        if (cancelled) return;
        loadedRef.current[index] = true;
        imagesRef.current[index] = image;
        if (index === 0) {
          drawFrame(0);
        }
      };
      imagesRef.current[index] = image;
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount, shouldLoad, urls]);

  useEffect(() => {
    if (!shouldLoad) return;

    const nextFrame = clamp(Math.round(progress * (frameCount - 1)), 0, frameCount - 1);
    drawFrame(nextFrame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount, progress, shouldLoad]);

  // ResizeObserver: re-draw when container dimensions change (e.g. after GSAP pin settles)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      if (activeFrameRef.current >= 0) {
        drawFrame(activeFrameRef.current);
      } else if (loadedRef.current.some(Boolean)) {
        drawFrame(0);
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function drawFrame(index: number) {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const resolvedIndex = resolveLoadedFrame(index);
    const image = imagesRef.current[resolvedIndex];

    if (!canvas || !container || !image || !loadedRef.current[resolvedIndex]) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const displayWidth = Math.max(1, Math.round(rect.width));
    const displayHeight = Math.max(1, Math.round(rect.height));

    // Skip redraw if dimensions haven't changed
    if (
      canvas.width === Math.round(displayWidth * dpr) &&
      canvas.height === Math.round(displayHeight * dpr) &&
      activeFrameRef.current === resolvedIndex
    ) {
      return;
    }

    canvas.width = Math.round(displayWidth * dpr);
    canvas.height = Math.round(displayHeight * dpr);
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    const scale = Math.max(displayWidth / width, displayHeight / height);
    const drawWidth = width * scale;
    const drawHeight = height * scale;
    const x = (displayWidth - drawWidth) / 2;
    const y = (displayHeight - drawHeight) / 2;

    ctx.drawImage(image, x, y, drawWidth, drawHeight);
    activeFrameRef.current = resolvedIndex;
  }

  function resolveLoadedFrame(targetIndex: number) {
    if (loadedRef.current[targetIndex]) {
      return targetIndex;
    }

    for (let offset = 1; offset < frameCount; offset += 1) {
      const previous = targetIndex - offset;
      if (previous >= 0 && loadedRef.current[previous]) {
        return previous;
      }

      const next = targetIndex + offset;
      if (next < frameCount && loadedRef.current[next]) {
        return next;
      }
    }

    return targetIndex;
  }

  return (
    <div ref={containerRef} className="scroll-sequence-canvas">
      <canvas ref={canvasRef} />
    </div>
  );
}
