import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

const docs = [
  {
    label: 'Quickstart',
    desc: 'Get running in five minutes — install, configure, spawn your first agent.',
  },
  {
    label: 'Configuration',
    desc: 'Full config.toml reference with every field explained.',
  },
  {
    label: 'API Reference',
    desc: 'REST endpoints, request/response formats, and examples.',
  },
  {
    label: 'Architecture',
    desc: 'Crate dependency graph, KernelHandle trait, and AppState bridge.',
  },
  {
    label: 'Skills',
    desc: 'Built-in skills, writing custom skills, and skill.toml format.',
  },
  {
    label: 'Channels',
    desc: 'Slack, Discord, and custom channel adapters.',
  },
]

function DocPanel({ doc, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const prefersReduced = useReducedMotion()
  const delay = prefersReduced ? 0 : index * 0.06

  return (
    <motion.a
      ref={ref}
      href="#"
      className="tactile-deboss group block p-5 flex items-center justify-between gap-4 no-underline"
      style={{ textDecoration: 'none' }}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: prefersReduced ? 0 : 0.4,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div className="flex flex-col gap-1.5 min-w-0">
        <span className="font-mono text-sm font-500 text-[var(--accent)] tracking-wider">
          {doc.label}
        </span>
        <span
          className="font-body text-[var(--text-secondary)] truncate"
          style={{ fontSize: '0.9rem', lineHeight: 1.5 }}
        >
          {doc.desc}
        </span>
      </div>
      <svg
        className="flex-shrink-0 text-[var(--accent)] transition-transform duration-200 group-hover:translate-x-1"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        style={{ opacity: 0.6 }}
      >
        <path
          d="M6 3l5 5-5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.a>
  )
}

export default function Docs() {
  const headerRef = useRef(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-40px' })
  const prefersReduced = useReducedMotion()

  return (
    <section className="section-padding" id="docs" aria-label="Documentation">
      <div className="max-w-4xl mx-auto">
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
            Built to Be Understood
          </h2>
          <p
            className="font-body text-[var(--text-secondary)] max-w-lg mx-auto"
            style={{ fontSize: '1.05rem', lineHeight: 1.7 }}
          >
            No guessing. No tribal knowledge. Every surface documented.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((doc, i) => (
            <DocPanel key={doc.label} doc={doc} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
