import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { NarrativeStep } from "./scroll-sequence-data";
import { fabricSteps, memorySteps } from "./scroll-sequence-data";

type Variant = "fabric" | "memory";

const palette = {
  bg: "#141518",
  panel: "#1d1f23",
  text: "#ece9e2",
  muted: "#a6a29c",
  amber: "#f5a524",
  amberHot: "#ffd36a",
};

const matteBackground = {
  backgroundImage: [
    "radial-gradient(circle at 18% 14%, rgba(255,255,255,0.07), transparent 24%)",
    "radial-gradient(circle at 78% 18%, rgba(245,165,36,0.16), transparent 28%)",
    "radial-gradient(circle at 62% 78%, rgba(245,165,36,0.08), transparent 22%)",
    "linear-gradient(180deg, #1b1c1f 0%, #121316 44%, #0f1012 100%)",
  ].join(", "),
} as const;

function badgeStyle(active: boolean) {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    borderRadius: 999,
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: 16,
    fontWeight: 700,
    color: active ? palette.amberHot : "#c3beb7",
    background: active
      ? "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(0,0,0,0.18)), #2c2f33"
      : "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.18)), #23252a",
    border: `1px solid ${active ? "rgba(245,165,36,0.22)" : "rgba(255,255,255,0.08)"}`,
    boxShadow: active ? "0 0 26px rgba(245,165,36,0.24)" : "0 10px 18px rgba(0,0,0,0.25)",
  } as const;
}

function cardShellStyle(active: boolean) {
  return {
    borderRadius: 28,
    border: `1px solid ${active ? "rgba(245,165,36,0.18)" : "rgba(255,255,255,0.06)"}`,
    background: active
      ? "radial-gradient(circle at 18% 14%, rgba(245,165,36,0.16), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.06), transparent 16%), rgba(24,25,29,0.92)"
      : "linear-gradient(180deg, rgba(255,255,255,0.04), transparent 18%), rgba(20,21,24,0.88)",
    boxShadow: active
      ? "0 24px 54px rgba(0,0,0,0.42), 0 0 0 1px rgba(245,165,36,0.06)"
      : "0 18px 40px rgba(0,0,0,0.28)",
  } as const;
}

function narrativeProgress(frame: number, totalFrames: number, steps: number) {
  const maxIndex = Math.max(steps - 1, 1);
  return interpolate(frame, [0, totalFrames - 1], [0, maxIndex], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function fabricVisual(progress: number, frame: number, steps: NarrativeStep[]) {
  const activeIndex = Math.round(progress);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 108,
          right: 108,
          bottom: 112,
          height: 4,
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
        }}
      />

      {steps.map((step, index) => {
        const distance = index - progress;
        const absoluteDistance = Math.abs(distance);
        const x = 120 + index * 170;
        const nodeScale = clamp(1.2 - absoluteDistance * 0.25, 0.82, 1.24);
        const glowOpacity = clamp(1 - absoluteDistance * 0.5, 0.18, 1);

        return (
          <div key={step.title}>
            <div
              style={{
                position: "absolute",
                left: x,
                bottom: 90,
                width: 52,
                height: 52,
                borderRadius: 999,
                transform: `scale(${nodeScale})`,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.15), rgba(0,0,0,0.18)), #2d2f34",
                border: `1px solid ${index === activeIndex ? "rgba(245,165,36,0.24)" : "rgba(255,255,255,0.08)"}`,
                boxShadow: `0 0 26px rgba(245,165,36,${glowOpacity * 0.24})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: x + 18,
                bottom: 108,
                width: 16,
                height: 16,
                borderRadius: 999,
                background: index === activeIndex ? palette.amberHot : "#9b9b9b",
                boxShadow:
                  index === activeIndex ? "0 0 20px rgba(245,165,36,0.85)" : "none",
              }}
            />
          </div>
        );
      })}

      {steps.map((step, index) => {
        const distance = index - progress;
        const absoluteDistance = Math.abs(distance);
        const opacity = clamp(1 - absoluteDistance * 0.55, 0.08, 1);
        const translateY = distance * 74;
        const scale = clamp(1 - absoluteDistance * 0.08, 0.84, 1);
        const isActive = index === activeIndex;

        return (
          <div
            key={step.title}
            style={{
              position: "absolute",
              left: 140,
              right: 140,
              top: 108,
              height: 250,
              padding: 28,
              opacity,
              transform: `translateY(${translateY}px) scale(${scale})`,
              filter: `blur(${clamp(absoluteDistance * 5, 0, 10)}px)`,
              ...cardShellStyle(isActive),
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={badgeStyle(isActive)}>{step.index}</span>
              <div
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 14,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: isActive ? palette.amberHot : palette.muted,
                }}
              >
                plain-language system step
              </div>
            </div>
            <h2
              style={{
                margin: "24px 0 0",
                fontSize: 44,
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                color: palette.text,
                fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
              }}
            >
              {step.title}
            </h2>
            <p
              style={{
                margin: "18px 0 0",
                maxWidth: 580,
                fontSize: 22,
                lineHeight: 1.4,
                color: palette.muted,
                fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
              }}
            >
              {step.desc}
            </p>
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          right: 108,
          top: 86,
          padding: "12px 18px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(18,19,22,0.72)",
          color: palette.muted,
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 14,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        One job, step by step
      </div>
    </div>
  );
}

function memoryVisual(progress: number, frame: number, steps: NarrativeStep[]) {
  const activeIndex = Math.round(progress);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      {steps.map((step, index) => {
        const distance = index - progress;
        const absoluteDistance = Math.abs(distance);
        const width = 620 - index * 70;
        const height = 310 - index * 34;
        const translateY = index * 34 + distance * 52;
        const isActive = index === activeIndex;
        const opacity = clamp(1 - absoluteDistance * 0.42, 0.22, 1);

        return (
          <div
            key={step.title}
            style={{
              position: "absolute",
              left: "50%",
              top: 122,
              width,
              height,
              marginLeft: -width / 2,
              opacity,
              transform: `translateY(${translateY}px) scale(${clamp(
                1 - absoluteDistance * 0.06,
                0.88,
                1
              )})`,
              ...cardShellStyle(isActive),
              padding: 28,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={badgeStyle(isActive)}>{step.index}</span>
              <div
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 14,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: isActive ? palette.amberHot : palette.muted,
                }}
              >
                plain-language memory layer
              </div>
            </div>
            <h2
              style={{
                margin: "22px 0 0",
                fontSize: 42,
                lineHeight: 1.04,
                letterSpacing: "-0.04em",
                color: palette.text,
                fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
              }}
            >
              {step.title}
            </h2>
            <p
              style={{
                margin: "16px 0 0",
                maxWidth: 420,
                fontSize: 21,
                lineHeight: 1.4,
                color: palette.muted,
                fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
              }}
            >
              {step.desc}
            </p>
          </div>
        );
      })}

      {["core facts", "big picture", "projects", "scratchpad"].map(
        (label, index) => (
        <div
          key={label}
          style={{
            position: "absolute",
            left: 108 + index * 154,
            bottom: 92,
            padding: "12px 18px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              index === activeIndex
                ? "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.18)), #2d2f34"
                : "rgba(18,19,22,0.72)",
            color: index === activeIndex ? palette.text : palette.muted,
            boxShadow:
              index === activeIndex ? "0 0 26px rgba(245,165,36,0.22)" : "none",
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 14,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function SequenceShell({
  variant,
  steps,
}: {
  variant: Variant;
  steps: NarrativeStep[];
}) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const progress = narrativeProgress(frame, durationInFrames, steps.length);
  const pulse = spring({
    fps,
    frame,
    config: {
      damping: 18,
      stiffness: 70,
      mass: 1.1,
    },
    durationInFrames: durationInFrames,
  });

  return (
    <AbsoluteFill
      style={{
        ...matteBackground,
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
        color: palette.text,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 24,
          borderRadius: 36,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: "6% 7%",
          borderRadius: 36,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0",
            background:
              variant === "fabric"
                ? "radial-gradient(circle at 20% 22%, rgba(245,165,36,0.2), transparent 34%)"
                : "radial-gradient(circle at 50% 14%, rgba(245,165,36,0.16), transparent 26%)",
            transform: `scale(${1 + pulse * 0.01})`,
            filter: "blur(24px)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 34,
            textAlign: "center",
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: "-0.05em",
            textShadow: "0 12px 28px rgba(0,0,0,0.36)",
          }}
        >
          {variant === "fabric"
            ? "How One Job Moves Through clawREFORM"
            : "How Memory Is Split By Importance"}
        </div>

        {variant === "fabric"
          ? fabricVisual(progress, frame, steps)
          : memoryVisual(progress, frame, steps)}
      </div>
    </AbsoluteFill>
  );
}

export const SiteFabricSequence = () => {
  return <SequenceShell variant="fabric" steps={fabricSteps} />;
};

export const SiteMemorySequence = () => {
  return <SequenceShell variant="memory" steps={memorySteps} />;
};

export const ClawReformDemo = () => {
  return <SequenceShell variant="fabric" steps={fabricSteps} />;
};
