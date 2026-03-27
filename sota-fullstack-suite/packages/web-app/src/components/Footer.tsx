import Link from 'next/link';

const footerLinks = {
  extensions: [
    { label: 'ClawPrompt', href: '/clwprmpt' },
    { label: 'DevScribe', href: '/devscribe' },
  ],
  resources: [
    { label: 'Documentation', href: 'https://github.com/aegntic/clawreform', external: true },
    { label: 'GitHub', href: 'https://github.com/aegntic/clawreform', external: true },
    { label: 'Community', href: 'https://www.skool.com/clawreform', external: true },
  ],
  company: [
    { label: 'aegntic.ai', href: 'https://aegntic.ai', external: true },
  ],
  legal: [
    { label: 'MIT License', href: 'https://github.com/aegntic/clawreform/blob/main/LICENSE', external: true },
  ],
};

export function Footer() {
  return (
    <footer className="bg-surface-950 border-t border-surface-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-accent-gold flex items-center justify-center">
                <span className="text-surface-900 font-bold text-sm">CR</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-semibold text-base text-surface-50">clawREFORM</span>
                <span className="text-[10px] text-surface-500">by aegntic.ai</span>
              </div>
            </Link>
            <p className="text-surface-500 text-sm max-w-xs">
              The self-evolving Agent Operating System.
              Open source, written in Rust.
            </p>
          </div>

          {/* Extensions */}
          <div>
            <h3 className="font-semibold text-surface-50 mb-4">Extensions</h3>
            <ul className="space-y-3">
              {footerLinks.extensions.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-surface-500 hover:text-surface-300 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-surface-50 mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="text-surface-500 hover:text-surface-300 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-surface-50 mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="text-surface-500 hover:text-surface-300 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-surface-50 mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="text-surface-500 hover:text-surface-300 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-surface-500 text-sm">
            &copy; 2026 aegntic.ai
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://x.com/clawreform"
              target="_blank"
              rel="noopener noreferrer"
              className="text-surface-500 hover:text-surface-300 transition-colors"
              aria-label="X / Twitter"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://github.com/aegntic/clawreform"
              target="_blank"
              rel="noopener noreferrer"
              className="text-surface-500 hover:text-surface-300 transition-colors"
              aria-label="GitHub"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
