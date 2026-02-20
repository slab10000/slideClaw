#!/usr/bin/env node
import { Command } from 'commander'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import open from 'open'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const BASE_URL = process.env.SLIDECLAW_URL ?? 'http://localhost:3001'

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`)
  if (!res.ok) throw new Error(`API error: ${res.statusText}`)
  return res.json()
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? res.statusText)
  }
  return res.json()
}

const program = new Command()

program
  .name('slideclaw')
  .description('AI-powered presentation tool')
  .version('0.1.0')

program
  .command('serve')
  .description('Start the slideClaw server and open browser')
  .option('-p, --port <port>', 'Port to listen on', '3001')
  .action(async (options) => {
    const port = parseInt(options.port, 10)
    const serverPath = path.resolve(__dirname, '../../server/dist/index.mjs')

    console.log(`Starting slideClaw server on port ${port}...`)

    const server = spawn('node', [serverPath], {
      env: { ...process.env, PORT: String(port) },
      stdio: 'inherit',
    })

    server.on('error', (err) => {
      console.error('Failed to start server:', err.message)
      process.exit(1)
    })

    // Wait briefly then open browser
    setTimeout(async () => {
      const webUrl = `http://localhost:5173`
      console.log(`Opening ${webUrl}`)
      await open(webUrl)
    }, 2000)

    process.on('SIGINT', () => {
      server.kill()
      process.exit(0)
    })
  })

program
  .command('create <prompt>')
  .description('Generate a presentation from a prompt')
  .action(async (prompt) => {
    console.log('Generating presentation...')
    try {
      const result = await apiPost<{ presentationId: string | null; message: string }>('/agent/generate', { prompt })
      if (result.presentationId) {
        console.log(`Presentation created: ${result.presentationId}`)
        console.log(result.message)
      } else {
        console.error('Failed to create presentation')
      }
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : err)
      process.exit(1)
    }
  })

program
  .command('list')
  .description('List all presentations')
  .action(async () => {
    try {
      const presentations = await apiGet<Array<{ id: string; title: string; slideCount: number; createdAt: string }>>('/presentations')
      if (presentations.length === 0) {
        console.log('No presentations found.')
        return
      }
      console.log('\nPresentations:')
      for (const p of presentations) {
        const date = new Date(p.createdAt).toLocaleDateString()
        console.log(`  ${p.id}  ${p.title}  (${p.slideCount} slides, ${date})`)
      }
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : err)
      process.exit(1)
    }
  })

program
  .command('open <id>')
  .description('Open a presentation in the browser')
  .action(async (id) => {
    const url = `http://localhost:5173?presentation=${id}`
    console.log(`Opening ${url}`)
    await open(url)
  })

program
  .command('export <id>')
  .description('Export a presentation to PDF or PPTX')
  .option('-f, --format <format>', 'Export format: pdf or pptx', 'pdf')
  .option('-o, --output <path>', 'Output file path')
  .action(async (id, options) => {
    const format = options.format.toLowerCase()
    if (format !== 'pdf' && format !== 'pptx') {
      console.error('Invalid format. Use pdf or pptx.')
      process.exit(1)
    }

    const outputPath = options.output ?? `presentation-${id}.${format}`

    console.log(`Exporting ${id} as ${format.toUpperCase()}...`)

    try {
      const res = await fetch(`${BASE_URL}/api/presentations/${id}/export/${format}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error ?? res.statusText)
      }

      const { writeFile } = await import('fs/promises')
      const buffer = Buffer.from(await res.arrayBuffer())
      await writeFile(outputPath, buffer)
      console.log(`Exported to: ${path.resolve(outputPath)}`)
    } catch (err) {
      console.error('Export failed:', err instanceof Error ? err.message : err)
      process.exit(1)
    }
  })

program.parse()
