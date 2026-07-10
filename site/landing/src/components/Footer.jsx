export default function Footer() {
  return (
    <footer
      className="tactile-deboss section-padding"
      style={{ paddingBlock: 'var(--space-xl)' }}
      aria-label="Site footer"
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex items-baseline gap-2">
          <span className="brand-claw text-sm">claw</span>
          <span className="brand-reform text-sm">REFORM</span>
          <span className="font-body text-xs text-[var(--text-muted)]">
            by aegntic.ai
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com/nicobailon/clawreform"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors duration-200"
            style={{ textDecoration: 'none' }}
          >
            GitHub
          </a>
          <span className="font-mono text-xs text-[var(--text-muted)]">
            MIT License
          </span>
        </div>
      </div>
    </footer>
  )
}
