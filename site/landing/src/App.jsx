import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import ClawMark from './components/ClawMark'
import ThemeToggle from './components/ThemeToggle'
import NoiseCanvas from './components/NoiseCanvas'
import Hero from './components/Hero'
import Features from './components/Features'
import Extensions from './components/Extensions'
import Docs from './components/Docs'
import HowItWorks from './components/HowItWorks'
import Footer from './components/Footer'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Extensions', href: '#extensions' },
  { label: 'Docs', href: '#docs' },
  { label: 'How It Works', href: '#how-it-works' },
]

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false) }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 transition-shadow duration-300"
      style={{
        background: scrolled ? 'var(--bg-canvas)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6" style={{ height: 56 }}>
        {/* Brand */}
        <a
          href="#"
          className="flex items-center gap-1.5 no-underline"
          style={{ textDecoration: 'none' }}
          aria-label="clawREFORM home"
        >
          <ClawMark className="shrink-0" style={{ width: 18, height: 18 }} />
          <span className="brand-claw" style={{ fontSize: '1.1rem' }}>claw</span>
          <span className="brand-reform" style={{ fontSize: '1.1rem' }}>REFORM</span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-xs tracking-wider uppercase text-[var(--text-secondary)] hover:text-[var(--accent-deep)] transition-colors duration-200"
              style={{ textDecoration: 'none' }}
            >
              {link.label}
            </a>
          ))}
          <ThemeToggle />
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            className="flex flex-col justify-center items-center gap-1 p-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            type="button"
          >
            <span
              className="block w-5 h-[2px] rounded-full transition-all duration-200"
              style={{
                background: 'var(--text-primary)',
                transform: menuOpen ? 'rotate(45deg) translate(2px, 2px)' : 'none',
              }}
            />
            <span
              className="block w-5 h-[2px] rounded-full transition-all duration-200"
              style={{
                background: 'var(--text-primary)',
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              className="block w-5 h-[2px] rounded-full transition-all duration-200"
              style={{
                background: 'var(--text-primary)',
                transform: menuOpen ? 'rotate(-45deg) translate(2px, -2px)' : 'none',
              }}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          className="md:hidden flex flex-col gap-1 px-6 pb-4"
          style={{ background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-subtle)' }}
          initial={prefersReduced ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.2 }}
        >
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-sm tracking-wider uppercase text-[var(--text-secondary)] hover:text-[var(--accent-deep)] transition-colors duration-200 py-2"
              style={{ textDecoration: 'none' }}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </motion.div>
      )}
    </nav>
  )
}

export default function App() {
  return (
    <>
      <NoiseCanvas />
      <Nav />
      <main style={{ paddingTop: 56 }}>
        <Hero />
        <Features />
        <Extensions />
        <Docs />
        <HowItWorks />
      </main>
      <Footer />
    </>
  )
}
