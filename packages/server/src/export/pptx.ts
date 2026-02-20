import { chromium } from 'playwright'
import pptxgen from 'pptxgenjs'
import os from 'os'
import path from 'path'
import fs from 'fs/promises'
import { getPresentation } from '@slideclaw/core'

export async function exportToPptx(presentationId: string): Promise<Buffer> {
  const presentation = await getPresentation(presentationId)
  if (!presentation) throw new Error('Presentation not found')

  const sortedSlides = [...presentation.slides].sort((a, b) => a.order - b.order)

  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1280, height: 720 })

  const prs = new pptxgen()
  prs.layout = 'LAYOUT_WIDE'

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'slideclaw-'))

  try {
    for (const slide of sortedSlides) {
      const tmpFile = path.join(tmpDir, `slide-${slide.id}.html`)
      await fs.writeFile(tmpFile, slide.html, 'utf-8')
      await page.goto(`file://${tmpFile}`, { waitUntil: 'networkidle' })

      const screenshotBuffer = await page.screenshot({ type: 'png', fullPage: false })
      const base64Image = screenshotBuffer.toString('base64')

      const pptSlide = prs.addSlide()
      pptSlide.addImage({
        data: `data:image/png;base64,${base64Image}`,
        x: 0,
        y: 0,
        w: '100%',
        h: '100%',
      })

      if (slide.notes) {
        pptSlide.addNotes(slide.notes)
      }
    }
  } finally {
    await browser.close()
    await fs.rm(tmpDir, { recursive: true, force: true })
  }

  const pptxBuffer = await prs.write({ outputType: 'nodebuffer' }) as Buffer
  return pptxBuffer
}
