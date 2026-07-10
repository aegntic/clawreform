import { useState, useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

const extensions = [
  {
    name: 'DevScribe',
    version: 'v0.1.0',
    tagline: 'Development companion',
    icon: '\u2699', // gear
    backDesc: 'Capture, annotate, and export from the clawREFORM dashboard.',
    backPlatforms: 'Connects to localhost:4332',
    ctaText: 'Add to Chrome',
    ctaHref: '#',
  },
  {
    name: 'clawPrompt',
    version: 'v1.0.4',
    tagline: 'Swarm command prompts',
    icon: '\u26A1', // lightning
    backDesc: 'One-click inject swarm prompts into ChatGPT, Claude, Grok, Gemini, and OpenRouter. Zero data collection.',
    backPlatforms: 'Works on any AI chat site',
    ctaText: 'Add to Chrome',
    ctaHref: '#',
  },
]

function FlipCard({ ext, index }) {
  const [flipped, setFlipped] = useState(false)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const prefersReduced = useReducedMotion()

  const delay = prefersReduced ? 0 : index * 0.12

  return (
    <motion.div
      ref={ref}
      className="flip-card"
      style={{ height: 320 }}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: prefersReduced ? 0 : 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      onClick={() => setFlipped(prev => !prev)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped(prev => !prev) } }}
      role="button"
      tabIndex={0}
      aria-label={`${ext.name} — click to flip for details`}
    >
      <div className={`flip-card-inner${flipped ? ' flipped' : ''}`}>
        {/* Front */}
        <div className="flip-card-front tactile-panel p-8 flex flex-col items-center justify-center gap-4">
          <span className="text-4xl select-none" aria-hidden="true">{ext.icon}</span>
          <h3
            className="font-display font-700 text-[var(--text-primary)]"
            style={{ fontSize: '1.4rem', fontWeight: 700 }}
          >
            {ext.name}
          </h3>
          <span className="font-mono text-xs text-[var(--accent)] tracking-wider">
            {ext.version}
          </span>
          <p className="font-body text-[var(--text-secondary)] text-sm">
            {ext.tagline}
          </p>
          <span
            className="font-mono text-xs text-[var(--text-muted)] mt-2"
            style={{ opacity: 0.6 }}
          >
            tap to flip
          </span>
        </div>

        {/* Back */}
        <div className="flip-card-back tactile-panel p-8 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-3">
            <h3
              className="font-display font-700 text-[var(--text-primary)]"
              style={{ fontSize: '1.2rem', fontWeight: 700 }}
            >
              {ext.name}
            </h3>
            <p className="font-body text-[var(--text-secondary)]" style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>
              {ext.backDesc}
            </p>
            <p className="font-mono text-xs text-[var(--text-muted)]">
              {ext.backPlatforms}
            </p>
          </div>
          <a
            href={ext.ctaHref}
            className="tactile-btn tactile-btn-ghost text-sm self-start"
            onClick={e => e.stopPropagation()}
            aria-label={`Install ${ext.name} extension`}
          >
            {ext.ctaText}
          </a>
        </div>
      </div>
    </motion.div>
  )
}

export default function Extensions() {
  const headerRef = useRef(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-40px' })
  const prefersReduced = useReducedMotion()

  return (
    <section className="section-padding" id="extensions" aria-label="Extensions">
      <div className="max-w-5xl mx-auto">
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
            Browser Companions
          </h2>
          <p
            className="font-body text-[var(--text-secondary)] max-w-md mx-auto"
            style={{ fontSize: '1.05rem', lineHeight: 1.7 }}
          >
            Two extensions. Zero friction.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {extensions.map((ext, i) => (
            <FlipCard key={ext.name} ext={ext} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
