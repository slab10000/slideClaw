import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { nanoid } from 'nanoid'
import type { Presentation } from './types.js'

const SLIDECLAW_DIR = path.join(os.homedir(), '.slideclaw', 'presentations')

async function ensureDir(): Promise<void> {
  await fs.mkdir(SLIDECLAW_DIR, { recursive: true })
}

function presentationPath(id: string): string {
  return path.join(SLIDECLAW_DIR, `${id}.json`)
}

export async function listPresentations(): Promise<Presentation[]> {
  await ensureDir()
  let files: string[]
  try {
    files = await fs.readdir(SLIDECLAW_DIR)
  } catch {
    return []
  }
  const presentations: Presentation[] = []
  for (const file of files) {
    if (!file.endsWith('.json')) continue
    try {
      const content = await fs.readFile(path.join(SLIDECLAW_DIR, file), 'utf-8')
      presentations.push(JSON.parse(content))
    } catch {
      // skip corrupted files
    }
  }
  return presentations.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function getPresentation(id: string): Promise<Presentation | null> {
  await ensureDir()
  try {
    const content = await fs.readFile(presentationPath(id), 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

export async function savePresentation(presentation: Presentation): Promise<Presentation> {
  await ensureDir()
  await fs.writeFile(presentationPath(presentation.id), JSON.stringify(presentation, null, 2), 'utf-8')
  return presentation
}

export async function deletePresentation(id: string): Promise<boolean> {
  try {
    await fs.unlink(presentationPath(id))
    return true
  } catch {
    return false
  }
}

export function createId(): string {
  return nanoid()
}

export function now(): string {
  return new Date().toISOString()
}
