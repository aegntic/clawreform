'use client';

import Link from 'next/link';
import { Card, CardContent, useScrollAnimation } from '@sota/shared-ui';

function ClawPromptIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Terminal window */}
      <rect
        x="4"
        y="8"
        width="32"
        height="24"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Title bar line */}
      <line x1="4" y1="14" x2="36" y2="14" stroke="currentColor" strokeWidth="2" />
      {/* Window dots */}
      <circle cx="10" cy="11" r="1.2" fill="currentColor" />
      <circle cx="14" cy="11" r="1.2" fill="currentColor" />
      <circle cx="18" cy="11" r="1.2" fill="currentColor" />
      {/* Prompt chevron */}
      <polyline
        points="10,21 15,24 10,27"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Cursor underscore */}
      <line x1="20" y1="24" x2="28" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DevScribeIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Notepad */}
      <rect
        x="6"
        y="4"
        width="22"
        height="32"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Notepad lines */}
      <line x1="10" y1="14" x2="24" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="19" x2="24" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="24" x2="20" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Pen body */}
      <line
        x1="26"
        y1="8"
        x2="34"
        y2="30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Pen tip */}
      <polyline
        points="34,30 31,34 29,28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

const extensions = [
  {
    title: 'ClawPrompt',
    description:
      'A Chrome extension that turns any text input into an AI-powered prompt template library. Save, organize, and inject prompts with a single shortcut.',
    accent: 'bg-indigo-500',
    accentText: 'text-indigo-400',
    pill: 'Prompt Engineering',
    Icon: ClawPromptIcon,
    stats: [
      { value: '50+', label: 'Templates' },
      { value: '1-Click', label: 'Injection' },
      { value: 'Free', label: 'Open Source' },
    ],
    href: '/clwprmpt',
  },
  {
    title: 'DevScribe',
    description:
      'A Chrome extension that captures full page context — DOM, network, console, screenshots — for AI-assisted debugging and QA workflows.',
    accent: 'bg-teal-400',
    accentText: 'text-teal-400',
    pill: 'Browser Capture',
    Icon: DevScribeIcon,
    stats: [
      { value: 'Full', label: 'Page Context' },
      { value: '1-Click', label: 'Capture' },
      { value: 'Free', label: 'Open Source' },
    ],
    href: '/devscribe',
  },
];

export function ExtensionsSection() {
  const { ref, animationStyles } = useScrollAnimation({ delay: 200 });

  return (
    <section
      id="extensions"
      ref={ref as React.RefObject<HTMLElement>}
      style={animationStyles}
      className="py-20 sm:py-32 bg-surface-900/50"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-50 mb-4">
            Chrome tools that work alongside{' '}
            <span className="text-accent-gold">clawREFORM</span>
          </h2>
          <p className="max-w-2xl mx-auto text-surface-400 text-lg">
            Purpose-built extensions that extend the agent OS into your browser.
          </p>
        </div>

        {/* Extensions grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {extensions.map((ext) => (
            <Card
              key={ext.title}
              variant="default"
              padding="lg"
              hoverable
              className="group relative"
            >
              <CardContent className="p-6 sm:p-8">
                {/* Icon + pill row */}
                <div className="flex items-start justify-between mb-4">
                  <span className={`text-surface-400`}>
                    <ext.Icon />
                  </span>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${ext.accent} text-white`}
                  >
                    {ext.pill}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-surface-50 mb-3">{ext.title}</h3>

                {/* Description */}
                <p className="text-surface-400 mb-6">{ext.description}</p>

                {/* Stats */}
                <div className="flex gap-6 mb-6">
                  {ext.stats.map((stat) => (
                    <div key={stat.label}>
                      <div className={`text-lg font-bold ${ext.accentText}`}>{stat.value}</div>
                      <div className="text-xs text-surface-500">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Learn more link */}
                <Link
                  href={ext.href}
                  className={`inline-flex items-center text-sm font-medium ${ext.accentText} hover:underline group-hover:gap-2 transition-all`}
                >
                  Learn more
                  <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
