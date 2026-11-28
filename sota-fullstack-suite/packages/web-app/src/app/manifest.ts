import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'clawREFORM',
    short_name: 'clawREFORM',
    description: 'The self-evolving Agent OS by aegntic.ai',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#d4af37',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['developer tools', 'utilities'],
    shortcuts: [
      {
        name: 'Extensions',
        url: '/#extensions',
        description: 'Browse ClawPrompt & DevScribe extensions',
      },
      {
        name: 'GitHub',
        url: 'https://github.com/aegntic/clawreform',
        description: 'View source on GitHub',
      },
    ],
  };
}
