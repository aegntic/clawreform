import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

const steps = [
  {
    num: '01',
    label: 'Configure',
    desc: 'Set your API keys and agent parameters in config.toml.',
  },
  {
    num: '02',
    label: 'Spawn',
    desc: 'Create agents with a single CLI command or API call.',
  },
  {
    num: '03',
    label: 'Run',
    desc: 'Agents execute autonomously, connected to your chosen channels.',
  },
  {
    num: '04',
    label: 'Observe',
    desc: 'Monitor budgets, logs, and agent status from the dashboard.',
  },
]

function EnergyLine({ inView, prefersReduced }) {
  return (
    <motion.div
      className="hidden md:flex items-center justify-center flex-1 min-w-[40px] max-w-[80px]"
      initial={false}
      animate={inView && !prefersReduced ? { opacity: [0.3, 1, 0.3] } : { opacity: 0.3 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div
        className="w-full h-[2px] relative"
        style={{ background: `linear-gradient(90deg, var(--accent-deep), var(--accent), var(--accent-deep))` }}
      >
        <motion.div
          className="absolute top-1/2 left-0 -translate-y-1/2 w-3 h-3 rounded-full"
          style={{ background: 'var(--accent)', boxShadow: 'var(--glow-amber)' }}
          animate={
            inView && !prefersReduced
              ? { x: ['0%', 'calc(100% - 12px)'], opacity: [0, 1, 1, 0] }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  )
}

function StepPanel({ step, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const prefersReduced = useReducedMotion()
  const delay = prefersReduced ? 0 : index * 0.12

  return (
    <motion.div
      ref={ref}
      className="tactile-deboss p-6 flex flex-col gap-3 min-w-0"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: prefersReduced ? 0 : 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <span
        className="font-mono text-2xl font-700 text-[var(--accent)]"
        style={{ opacity: 0.7 }}
      >
        {step.num}
      </span>
      <h3 className="font-display font-700 text-[var(--text-primary)]" style={{ fontSize: '1.1rem' }}>
        {step.label}
      </h3>
      <p className="font-body text-[var(--text-secondary)]" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
        {step.desc}
      </p>
    </motion.div>
  )
}

export default function HowItWorks() {
  const headerRef = useRef(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-40px' })
  const flowRef = useRef(null)
  const flowInView = useInView(flowRef, { once: true, margin: '-40px' })
  const prefersReduced = useReducedMotion()

  return (
    <section className="section-padding" id="how-it-works" aria-label="How It Works">
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
            Zero to Agent in Five Minutes
          </h2>
        </motion.div>

        {/* Desktop: horizontal flow */}
        <div ref={flowRef} className="hidden md:flex items-stretch gap-0">
          {steps.map((step, i) => (
            <div key={step.num} className="flex items-stretch gap-0 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <StepPanel step={step} index={i} />
              </div>
              {i < steps.length - 1 && <EnergyLine inView={flowInView} prefersReduced={prefersReduced} />}
            </div>
          ))}
        </div>

        {/* Mobile: vertical flow */}
        <div className="flex md:hidden flex-col gap-4">
          {steps.map((step, i) => (
            <div key={step.num} className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <StepPanel step={step} index={i} />
              </div>
              {i < steps.length - 1 && (
                <motion.div
                  className="flex-shrink-0 w-[2px] h-8 ml-auto mr-6"
                  style={{ background: 'var(--accent)', opacity: 0.3 }}
                  animate={flowInView && !prefersReduced ? { opacity: [0.2, 0.8, 0.2] } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
