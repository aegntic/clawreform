'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useScrollAnimation, usePrefersReducedMotion } from '@sota/shared-ui';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const steps = [
  { num: '01', label: 'Configure', detail: 'config.toml', desc: 'Define agents, skills, and MCP servers' },
  { num: '02', label: 'Spawn', detail: 'agent loop', desc: 'Kernel initializes agent processes' },
  { num: '03', label: 'Run', detail: 'LLM + MCP', desc: 'Execute tools, call models, iterate' },
  { num: '04', label: 'Observe', detail: 'metrics', desc: 'Track costs, logs, and performance' },
];

const flowLabels = ['config', 'spawn cmd', 'tool calls', 'telemetry'];

/* ------------------------------------------------------------------ */
/*  SVG constants                                                      */
/* ------------------------------------------------------------------ */

const NODE_W = 140;
const NODE_H = 110;
const NODE_RX = 10;
const GAP = 60; // horizontal gap between nodes
const SVG_W = steps.length * NODE_W + (steps.length - 1) * GAP + 80; // padding
const NODE_Y = 60;
const LABEL_Y = NODE_Y - 12;

function nodeX(i: number) {
  return 40 + i * (NODE_W + GAP);
}

function pathStartX(i: number) {
  return nodeX(i) + NODE_W;
}

function pathEndX(i: number) {
  return nodeX(i + 1);
}

function pathMidX(i: number) {
  return (pathStartX(i) + pathEndX(i)) / 2;
}

const PATH_Y = NODE_Y + NODE_H / 2;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function HowItWorksSection() {
  const { ref, animationStyles } = useScrollAnimation({ delay: 200 });
  const prefersReducedMotion = usePrefersReducedMotion();

  // Track whether the section has entered the viewport
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // SVG path lengths — measured after mount
  const pathRefs = useRef<SVGPathElement[]>([]);
  const [pathLengths, setPathLengths] = useState<number[]>([]);

  const setPathRef = useCallback((i: number) => (el: SVGPathElement | null) => {
    if (el) pathRefs.current[i] = el;
  }, []);

  useEffect(() => {
    // Measure actual path lengths
    const lengths = pathRefs.current.map((p) => p?.getTotalLength() ?? 0);
    setPathLengths(lengths);

    // Intersection observer for triggering the SVG animations
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isActive = prefersReducedMotion || inView;

  // Transition durations — 0 when reduced motion
  const pathDur = prefersReducedMotion ? '0.01ms' : '1.2s';
  const nodeDur = prefersReducedMotion ? '0.01ms' : '0.5s';
  const labelDur = prefersReducedMotion ? '0.01ms' : '0.4s';

  return (
    <section
      id="how-it-works"
      ref={(node) => {
        // Merge both refs
        (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        sectionRef.current = node;
      }}
      style={animationStyles}
      className="py-20 sm:py-32 bg-surface-900/50"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-50 mb-4">
            How <span className="text-accent-gold">clawREFORM</span> runs
          </h2>
          <p className="max-w-2xl mx-auto text-surface-400 text-lg">
            Four steps from configuration to observability. The kernel manages the entire lifecycle.
          </p>
        </div>

        {/* Desktop / Tablet SVG diagram */}
        <div className="hidden md:block">
          <BlueprintDiagram
            steps={steps}
            flowLabels={flowLabels}
            isActive={isActive}
            pathLengths={pathLengths}
            pathDur={pathDur}
            nodeDur={nodeDur}
            labelDur={labelDur}
            setPathRef={setPathRef}
            horizontal
          />
        </div>

        {/* Mobile vertical layout */}
        <div className="md:hidden flex flex-col gap-0">
          {steps.map((step, i) => (
            <div key={step.num}>
              <MobileStepCard
                step={step}
                index={i}
                isActive={isActive}
                nodeDur={nodeDur}
                labelDur={labelDur}
              />
              {i < steps.length - 1 && (
                <MobileConnector
                  label={flowLabels[i]}
                  isActive={isActive}
                  labelDur={labelDur}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Blueprint SVG Diagram                                              */
/* ------------------------------------------------------------------ */

interface DiagramProps {
  steps: typeof steps;
  flowLabels: string[];
  isActive: boolean;
  pathLengths: number[];
  pathDur: string;
  nodeDur: string;
  labelDur: string;
  setPathRef: (i: number) => (el: SVGPathElement | null) => void;
  horizontal?: boolean;
}

function BlueprintDiagram({
  steps,
  flowLabels,
  isActive,
  pathLengths,
  pathDur,
  nodeDur,
  labelDur,
  setPathRef,
}: DiagramProps) {
  const SVG_H = 200;

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full h-auto"
      aria-label="clawREFORM runtime flow: Configure, Spawn, Run, Observe"
      role="img"
    >
      <defs>
        {/* Arrowhead marker */}
        <marker
          id="hiw-arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#d4af37" />
        </marker>

        {/* Amber glow filter */}
        <filter id="hiw-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
          <feFlood floodColor="#d4af37" floodOpacity="0.35" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Blueprint dot grid */}
        <pattern id="hiw-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="0.6" fill="#27272a" />
        </pattern>
      </defs>

      {/* Grid background */}
      <rect width="100%" height="100%" fill="url(#hiw-grid)" />

      {/* Connecting paths */}
      {steps.slice(0, -1).map((_, i) => {
        const len = pathLengths[i] ?? 0;
        return (
          <path
            key={`path-${i}`}
            ref={setPathRef(i)}
            d={`M ${pathStartX(i)} ${PATH_Y} L ${pathEndX(i)} ${PATH_Y}`}
            fill="none"
            stroke="#d4af37"
            strokeWidth="1.5"
            markerEnd="url(#hiw-arrowhead)"
            style={{
              strokeDasharray: len || undefined,
              strokeDashoffset: isActive ? 0 : len || undefined,
              transition: `stroke-dashoffset ${pathDur} cubic-bezier(0.4, 0, 0.2, 1)`,
              filter: 'url(#hiw-glow)',
            }}
          />
        );
      })}

      {/* Flow labels on paths */}
      {steps.slice(0, -1).map((_, i) => (
        <text
          key={`flow-label-${i}`}
          x={pathMidX(i)}
          y={LABEL_Y}
          textAnchor="middle"
          className="font-mono"
          fill="#71717a"
          fontSize="10"
          style={{
            opacity: isActive ? 1 : 0,
            transition: `opacity ${labelDur} ease`,
            transitionDelay: isActive ? `${i * 0.15}s` : '0ms',
          }}
        >
          {flowLabels[i]}
        </text>
      ))}

      {/* Nodes */}
      {steps.map((step, i) => (
        <g key={step.num}>
          <rect
            x={nodeX(i)}
            y={NODE_Y}
            width={NODE_W}
            height={NODE_H}
            rx={NODE_RX}
            fill="#09090b"
            strokeWidth="1.5"
            style={{
              stroke: isActive ? '#d4af37' : '#27272a',
              filter: isActive ? 'url(#hiw-glow)' : 'none',
              transition: `stroke ${nodeDur} ease, filter ${nodeDur} ease`,
              transitionDelay: isActive ? `${i * 0.12}s` : '0ms',
            }}
          />
          {/* Step number */}
          <text
            x={nodeX(i) + NODE_W / 2}
            y={NODE_Y + 28}
            textAnchor="middle"
            className="font-mono"
            fill="#d4af37"
            fontSize="18"
            fontWeight="bold"
          >
            {step.num}
          </text>
          {/* Label */}
          <text
            x={nodeX(i) + NODE_W / 2}
            y={NODE_Y + 50}
            textAnchor="middle"
            className="font-mono"
            fill="#a1a1aa"
            fontSize="13"
            fontWeight="600"
          >
            {step.label}
          </text>
          {/* Detail */}
          <text
            x={nodeX(i) + NODE_W / 2}
            y={NODE_Y + 68}
            textAnchor="middle"
            className="font-mono"
            fill="#71717a"
            fontSize="10"
          >
            {step.detail}
          </text>
          {/* Description */}
          <text
            x={nodeX(i) + NODE_W / 2}
            y={NODE_Y + 90}
            textAnchor="middle"
            fontSize="9"
            fill="#52525b"
          >
            {step.desc}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile Step Card                                                   */
/* ------------------------------------------------------------------ */

function MobileStepCard({
  step,
  index,
  isActive,
  nodeDur,
  labelDur,
}: {
  step: (typeof steps)[number];
  index: number;
  isActive: boolean;
  nodeDur: string;
  labelDur: string;
}) {
  return (
    <div
      className="flex items-start gap-4 px-4 py-4"
      style={{
        opacity: isActive ? 1 : 0,
        transform: isActive ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity ${nodeDur} ease, transform ${nodeDur} ease`,
        transitionDelay: isActive ? `${index * 0.1}s` : '0ms',
      }}
    >
      {/* Step number */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-950 border border-surface-700 flex items-center justify-center font-mono text-accent-gold font-bold text-sm">
        {step.num}
      </div>
      <div>
        <h3 className="font-mono text-surface-50 font-semibold text-base">{step.label}</h3>
        <p className="font-mono text-surface-500 text-xs mt-0.5">{step.detail}</p>
        <p className="text-surface-400 text-sm mt-1">{step.desc}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile Connector (vertical line between steps)                      */
/* ------------------------------------------------------------------ */

function MobileConnector({
  label,
  isActive,
  labelDur,
}: {
  label: string;
  isActive: boolean;
  labelDur: string;
}) {
  return (
    <div
      className="flex items-center gap-2 pl-8 -my-1"
      style={{
        opacity: isActive ? 1 : 0,
        transition: `opacity ${labelDur} ease`,
      }}
    >
      <div className="w-px h-6 bg-surface-700" />
      <span className="font-mono text-surface-500 text-[10px]">{label}</span>
      <div className="w-px h-6 bg-surface-700" />
    </div>
  );
}
