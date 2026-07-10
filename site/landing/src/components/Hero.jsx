import { motion, useReducedMotion } from 'framer-motion'
import ClawMark from './ClawMark'

const brandStamp = {
  hidden: { opacity: 0, scale: 1.3 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
}

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
  },
})

export default function Hero() {
  const prefersReduced = useReducedMotion()
  const dur = prefersReduced ? 0 : undefined

  return (
    <section
      className="relative flex items-center justify-center"
      style={{ minHeight: 'calc(100svh - 56px)' }}
      aria-label="Hero"
    >
      <div className="flex flex-col items-center text-center px-6 max-w-4xl mx-auto gap-6">
        {/* Brand mark + wordmark — the loudest element */}
        <motion.div
          className="flex flex-col items-center gap-3 select-none"
          variants={prefersReduced ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : brandStamp}
          initial="hidden"
          animate="visible"
          transition={{ duration: dur }}
        >
          <ClawMark
            className="drop-shadow-[0_0_12px_rgba(245,165,36,0.25)]"
            style={{ width: 'clamp(2.5rem, 5vw, 4rem)', height: 'clamp(2.5rem, 5vw, 4rem)' }}
          />
          <div className="flex items-baseline gap-1">
            <span
              className="brand-claw tracking-tight"
              style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', lineHeight: 1.1 }}
            >
              claw
            </span>
            <span
              className="brand-reform tracking-tight"
              style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', lineHeight: 1.1 }}
            >
              REFORM
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="font-display font-800 text-[var(--text-primary)]"
          style={{
            fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
          variants={fadeUp(0.15)}
          initial="hidden"
          animate="visible"
          transition={{ duration: dur }}
        >
          The Open-Source Agent Operating System
        </motion.h1>

        {/* Supporting */}
        <motion.p
          className="font-body text-[var(--text-secondary)] max-w-2xl"
          style={{ fontSize: 'clamp(1rem, 1.5vw, 1.15rem)', lineHeight: 1.7 }}
          variants={fadeUp(0.3)}
          initial="hidden"
          animate="visible"
          transition={{ duration: dur }}
        >
          Spawn, connect, and manage autonomous AI agents — from local dev to
          production clusters.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-4 mt-4"
          variants={fadeUp(0.45)}
          initial="hidden"
          animate="visible"
          transition={{ duration: dur }}
        >
          <a
            href="https://github.com/nicobailon/clawreform"
            target="_blank"
            rel="noopener noreferrer"
            className="tactile-btn tactile-btn-primary"
          >
            Get Started
          </a>
          <a href="#docs" className="tactile-btn tactile-btn-ghost">
            Read the Docs
          </a>
        </motion.div>
      </div>
    </section>
  )
}
