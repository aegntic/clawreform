import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

const features = [
  {
    label: 'Agent Lifecycle',
    title: 'Agent Lifecycle',
    desc: 'Spawn, configure, and monitor agents with full lifecycle management.',
  },
  {
    label: 'Channel Adapters',
    title: 'Channel Adapters',
    desc: 'Connect to Slack, Discord, and custom platforms out of the box.',
  },
  {
    label: 'Skill System',
    title: 'Skill System',
    desc: 'Extend agent capabilities with bundled and custom skills.',
  },
  {
    label: 'Persistent Memory',
    title: 'Persistent Memory',
    desc: 'Agents remember context across sessions with built-in vector storage.',
  },
  {
    label: 'Budget & Metering',
    title: 'Budget & Metering',
    desc: 'Track every token. Set per-agent spending limits. No surprises.',
  },
  {
    label: 'A2A Protocol',
    title: 'A2A Protocol',
    desc: 'Inter-agent communication via the open Agent-to-Agent protocol.',
  },
]

function FeatureCard({ feature, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const prefersReduced = useReducedMotion()

  const delay = prefersReduced ? 0 : index * 0.08

  return (
    <motion.article
      ref={ref}
      className="tactile-panel tactile-glow p-6 flex flex-col gap-3"
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: prefersReduced ? 0 : 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <span className="font-mono text-xs tracking-wider uppercase text-[var(--accent)]">
        {feature.label}
      </span>
      <h3
        className="font-display font-700 text-[var(--text-primary)]"
        style={{ fontSize: '1.15rem', fontWeight: 700 }}
      >
        {feature.title}
      </h3>
      <p
        className="font-body text-[var(--text-secondary)]"
        style={{ fontSize: '0.95rem', lineHeight: 1.65 }}
      >
        {feature.desc}
      </p>
    </motion.article>
  )
}

export default function Features() {
  const headerRef = useRef(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-40px' })
  const prefersReduced = useReducedMotion()

  return (
    <section className="section-padding" id="features" aria-label="Features">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={headerRef}
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: prefersReduced ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2
            className="font-display font-800 text-[var(--text-primary)] mb-4"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.02em' }}
          >
            Everything Your Agents Need to Run
          </h2>
          <p
            className="font-body text-[var(--text-secondary)] max-w-xl mx-auto"
            style={{ fontSize: '1.05rem', lineHeight: 1.7 }}
          >
            Not a wrapper around an API. A real operating system for autonomous agents.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FeatureCard key={f.label} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
