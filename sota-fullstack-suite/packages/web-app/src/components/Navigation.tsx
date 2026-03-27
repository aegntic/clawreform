'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, cn } from '@sota/shared-ui';

const navLinks = [
  { href: '#extensions', label: 'Extensions' },
  { href: '#features', label: 'Features' },
  { href: 'https://github.com/aegntic/clawreform', label: 'GitHub', external: true },
  { href: 'https://www.skool.com/clawreform', label: 'Community', external: true },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-surface-950/90 backdrop-blur-lg border-b border-accent-gold/20'
          : 'bg-transparent'
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-accent-gold flex items-center justify-center">
              <span className="text-surface-900 font-bold text-sm">CR</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-semibold text-base text-surface-50">clawREFORM</span>
              <span className="text-[10px] text-surface-500">by aegntic.ai</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="text-surface-300 hover:text-surface-50 transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex md:items-center">
            <Button variant="accent" size="sm" asChild>
              <Link href="https://github.com/aegntic/clawreform" target="_blank" rel="noopener noreferrer">
                Get Started
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-surface-300 hover:text-surface-50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-surface-800">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="text-surface-300 hover:text-surface-50 transition-colors px-2 py-1"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col space-y-2 pt-4 border-t border-surface-800">
                <Button variant="accent" size="sm" className="w-full" asChild>
                  <Link href="https://github.com/aegntic/clawreform" target="_blank" rel="noopener noreferrer">
                    Get Started
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
