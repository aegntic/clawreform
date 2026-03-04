import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
  interpolate,
  spring,
  useCurrentFrame,
  Text,
} from 'remotion';

// Title Scene Component
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const titleOpacity = interpolate(frame, [0, 30], [0, 1]);
  const titleScale = spring({ frame, fps, from: 0.5, to: 1 });
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{
        opacity: titleOpacity,
        transform: `scale(${titleScale})`,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 120, color: '#00ff88' }}>🦾</div>
        <h1 style={{
          fontSize: 80,
          color: 'white',
          margin: 20,
          fontFamily: 'system-ui',
        }}>
          ClawReform
        </h1>
        <p style={{
          fontSize: 40,
          color: '#888',
          fontFamily: 'system-ui',
        }}>
          Self-Evolving Agent OS
        </p>
      </div>
    </AbsoluteFill>
  );
};

// Features Scene
const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  
  const features = [
    '🦾 Self-modification via natural language',
    '📚 61 bundled skills',
    '🔌 23+ MCP servers',
    '🤖 7 hands (Browser, Clip, Lead, etc.)',
    '🌐 Tailscale mesh networking',
    '🦀 Built in Rust',
  ];
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        padding: 80,
      }}
    >
      <h2 style={{ color: '#00ff88', fontSize: 60, marginBottom: 60 }}>Features</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
        {features.map((feature, i) => {
          const delay = i * 15;
          const opacity = interpolate(
            frame - delay,
            [0, 15],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          const translateY = interpolate(
            frame - delay,
            [0, 15],
            [50, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          
          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateY(${translateY}px)`,
                fontSize: 40,
                color: 'white',
                fontFamily: 'system-ui',
              }}
            >
              {feature}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Terminal Scene
const TerminalScene: React.FC = () => {
  const frame = useCurrentFrame();
  
  const commands = [
    { cmd: '$ git clone https://github.com/aegntic/clawreform', delay: 0 },
    { cmd: '$ cd clawreform && cargo build --release', delay: 60 },
    { cmd: '$ ./target/release/openfang start', delay: 120 },
    { cmd: '✔ Kernel booted (openrouter/anthropic/claude-sonnet-4)', delay: 180 },
    { cmd: '✔ 140 models available', delay: 210 },
    { cmd: 'API: http://127.0.0.1:4332', delay: 240 },
  ];
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1a1a1a',
        padding: 60,
        fontFamily: 'monospace',
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {commands.map((item, i) => {
          const charsToShow = Math.max(0, frame - item.delay);
          const text = item.cmd.slice(0, charsToShow);
          const isCommand = item.cmd.startsWith('$');
          
          return (
            <div
n              key={i}
              style={{
                fontSize: 28,
                color: isCommand ? '#00ff88' : '#ffffff',
                whiteSpace: 'pre',
              }}
            >
              {text}<span style={{ opacity: frame > item.delay && charsToShow < item.cmd.length ? 1 : 0 }}>▌</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// MCP Scene
const MCPServersScene: React.FC = () => {
  const frame = useCurrentFrame();
  
  const servers = [
    { name: 'filesystem', tools: 14 },
    { name: 'memory', tools: 9 },
    { name: 'sequential_thinking', tools: 1 },
    { name: 'context7', tools: 2 },
    { name: 'firebase', tools: 17 },
    { name: 'playwright', tools: 22 },
  ];
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        padding: 80,
      }}
    >
      <h2 style={{ color: '#00ff88', fontSize: 60, marginBottom: 60 }}>🔌 MCP Servers: 65 Tools</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 40,
      }}>
        {servers.map((server, i) => {
          const delay = i * 10;
          const opacity = interpolate(
            frame - delay,
            [0, 15],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          
          return (
            <div
              key={i}
              style={{
                opacity,
                backgroundColor: '#1a1a1a',
                padding: 30,
                borderRadius: 10,
              }}
            >
              <div style={{ color: 'white', fontSize: 32 }}>{server.name}</div>
              <div style={{ color: '#00ff88', fontSize: 48 }}>{server.tools} tools</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Self-Modification Scene
const SelfModifyScene: React.FC = () => {
  const frame = useCurrentFrame();
  
  const steps = [
    { step: '1', text: 'Analyze request', icon: '🔍' },
    { step: '2', text: 'Create plan', icon: '📋' },
    { step: '3', text: 'Backup files', icon: '💾' },
    { step: '4', text: 'Apply changes', icon: '✏️' },
    { step: '5', text: 'Validate (build + test)', icon: '✅' },
    { step: '6', text: 'Rollback if needed', icon: '↩️' },
  ];
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        padding: 80,
      }}
    >
      <h2 style={{ color: '#00ff88', fontSize: 60, marginBottom: 60 }}>🦾 Self-Modification Flow</h2>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 30,
      }}>
        {steps.map((item, i) => {
          const delay = i * 20;
          const opacity = interpolate(
            frame - delay,
            [0, 15],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          
          return (
            <div
              key={i}
              style={{
                opacity,
                display: 'flex',
                alignItems: 'center',
                gap: 30,
              }}
            >
              <div style={{ fontSize: 50 }}>{item.icon}</div>
              <div style={{ color: 'white', fontSize: 36 }}>{item.text}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// CTA Scene
const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = spring({ frame, fps: 30, from: 0.8, to: 1 });
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{
        transform: `scale(${scale})`,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 100, marginBottom: 40 }}>🦾</div>
        <h1 style={{
          fontSize: 70,
          color: 'white',
          marginBottom: 40,
          fontFamily: 'system-ui',
        }}>
          ClawReform
        </h1>
        <p style={{
          fontSize: 36,
          color: '#00ff88',
          marginBottom: 60,
          fontFamily: 'system-ui',
        }}>
          The Self-Evolving Agent OS
        </p>
        <div style={{ display: 'flex', gap: 60, justifyContent: 'center' }}>
          <div style={{ color: '#888', fontSize: 28 }}>github.com/aegntic/clawreform</div>
          <div style={{ color: '#888', fontSize: 28 }}>skool.com/autoclaw</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Main Demo Component
export const ClawReformDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      <Sequence from={0} durationInFrames={300}>
        <TitleScene />
      </Sequence>
      <Sequence from={300} durationInFrames={450}>
        <FeaturesScene />
      </Sequence>
      <Sequence from={750} durationInFrames={600}>
        <TerminalScene />
      </Sequence>
      <Sequence from={1350} durationInFrames={450}>
        <MCPServersScene />
      </Sequence>
      <Sequence from={1800} durationInFrames={450}>
        <SelfModifyScene />
      </Sequence>
      <Sequence from={2250} durationInFrames={300}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
