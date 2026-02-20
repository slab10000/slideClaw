# slideClaw

AI-powered local-first presentations where every slide is a full HTML document.

## Features

- **AI generation** — Describe your presentation and Gemini 2.5 Flash generates stunning HTML slides
- **Full HTML slides** — Every slide is a complete, self-contained HTML document (use Chart.js, Three.js, animations, etc.)
- **Monaco editor** — Edit slide HTML directly in the browser with syntax highlighting
- **Drag-to-reorder** — Rearrange slides with drag and drop
- **Export** — PDF and PPTX export via Playwright screenshots
- **CLI** — `slideclaw` command for generating and managing presentations
- **OpenClaw plugin** — Let OpenClaw's AI agent control slideClaw

## Quick Start

```bash
# Install dependencies
pnpm install

# Set your Gemini API key
export GEMINI_API_KEY=your_key_here

# Start server + frontend
pnpm dev

# Open http://localhost:5173
```

## CLI

```bash
pnpm --filter @slideclaw/cli build

# Generate a presentation
slideclaw create "Create a 5-slide presentation about the solar system"

# List presentations
slideclaw list

# Export to PDF
slideclaw export <id> --format pdf

# Export to PPTX
slideclaw export <id> --format pptx
```

## Architecture

```
slideClaw/
├── packages/
│   ├── core/              # Types + JSON file storage (~/.slideclaw/)
│   ├── server/            # Fastify API + Gemini agent + PDF/PPTX export
│   ├── web/               # Vite + React frontend
│   ├── cli/               # commander.js CLI
│   └── openclaw-plugin/   # OpenClaw integration
├── pnpm-workspace.yaml
└── package.json
```

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Gemini API key (required for AI generation) |
| `PORT` | Server port (default: 3001) |
| `SLIDECLAW_URL` | Server URL for CLI (default: http://localhost:3001) |

## Storage

Presentations are stored as JSON files at `~/.slideclaw/presentations/<id>.json`. No database needed.

## OpenClaw Plugin

```bash
# Install the plugin in OpenClaw
openclaw skills install packages/openclaw-plugin

# Now OpenClaw's agent can call:
# slideclaw.generate, slideclaw.listPresentations, slideclaw.getPresentation
# slideclaw.exportPdf, slideclaw.exportPptx, etc.
```
