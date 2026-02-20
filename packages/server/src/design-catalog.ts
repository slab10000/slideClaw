import type { DesignLibrary } from '@slideclaw/core'

export interface LibraryEntry {
  key: DesignLibrary
  name: string
  /** HTML tag(s) to paste into <head>. Empty string for 'none'. */
  cdnTag: string
  description: string
  /** Accessibility characteristics */
  accessibility: string
  /** Slide types this library shines at */
  useCases: string[]
}

export const LIBRARY_CATALOG: LibraryEntry[] = [
  {
    key: 'tailwind',
    name: 'Tailwind CSS',
    cdnTag: '<script src="https://cdn.tailwindcss.com"></script>',
    description: 'Utility-first CSS framework. Precise control over every spacing, color, and layout decision.',
    accessibility: 'Neutral — you control accessibility through your HTML markup and aria attributes.',
    useCases: ['Custom layouts', 'Precise typography', 'Complex multi-column designs', 'Dark/light themes'],
  },
  {
    key: 'bootstrap',
    name: 'Bootstrap 5',
    cdnTag: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/css/bootstrap.min.css">',
    description: 'Full component library: grid, cards, badges, tables, alerts, and more.',
    accessibility: 'Excellent — all components include proper ARIA roles and keyboard navigation support.',
    useCases: ['Tables and data', 'Cards and panels', 'Badges and pills', 'Structured content'],
  },
  {
    key: 'bulma',
    name: 'Bulma',
    cdnTag: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0/css/bulma.min.css">',
    description: 'Modern Flexbox-based framework. Clean and minimal look with helpful layout utilities.',
    accessibility: 'Good — semantic class names encourage proper HTML structure.',
    useCases: ['Professional slides', 'Columns', 'Notification boxes', 'Tags and labels'],
  },
  {
    key: 'pico',
    name: 'Pico CSS',
    cdnTag: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.classless.min.css">',
    description: 'Minimal semantic CSS. Styles HTML elements directly — no class attributes needed.',
    accessibility: 'Accessibility-first by design. Best for readable, content-heavy slides.',
    useCases: ['Text-heavy slides', 'Quote slides', 'Readable content', 'Minimal styling'],
  },
  {
    key: 'none',
    name: 'No framework (inline styles only)',
    cdnTag: '',
    description: 'Full creative freedom with raw CSS. Best combined with Three.js, Canvas, or heavy animations.',
    accessibility: 'You are fully responsible for accessibility in your markup.',
    useCases: ['Artistic slides', 'Animations with anime.js', '3D with Three.js', 'Canvas-based slides'],
  },
]

export function getCatalogEntry(key: DesignLibrary): LibraryEntry | undefined {
  return LIBRARY_CATALOG.find(l => l.key === key)
}
