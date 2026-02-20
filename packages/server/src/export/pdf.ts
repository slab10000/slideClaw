import { chromium } from 'playwright'
import { PDFDocument } from 'pdf-lib'
import os from 'os'
import path from 'path'
import fs from 'fs/promises'
import { getPresentation } from '@slideclaw/core'

export async function exportToPdf(presentationId: string): Promise<Buffer> {
  const presentation = await getPresentation(presentationId)
  if (!presentation) throw new Error('Presentation not found')

  const sortedSlides = [...presentation.slides].sort((a, b) => a.order - b.order)

  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1280, height: 720 })

  const pdfDoc = await PDFDocument.create()
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'slideclaw-'))

  try {
    for (const slide of sortedSlides) {
      const tmpFile = path.join(tmpDir, `slide-${slide.id}.html`)
      await fs.writeFile(tmpFile, slide.html, 'utf-8')
      await page.goto(`file://${tmpFile}`, { waitUntil: 'networkidle' })

      const screenshotBuffer = await page.screenshot({ type: 'png', fullPage: false })

      const pngImage = await pdfDoc.embedPng(screenshotBuffer)
      const pdfPage = pdfDoc.addPage([1280, 720])
      pdfPage.drawImage(pngImage, { x: 0, y: 0, width: 1280, height: 720 })
    }
  } finally {
    await browser.close()
    await fs.rm(tmpDir, { recursive: true, force: true })
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
