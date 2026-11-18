import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'
import type { Brochure, Exhibitor } from './types'

const INK = rgb(0.11, 0.114, 0.106)
const MUTED = rgb(0.36, 0.37, 0.35)
const ACCENT = rgb(0.75, 0.82, 0.17)

/** Keep only characters the standard WinAnsi fonts can draw. */
function safe(text: string): string {
  return text
    .replace(/[\u2014\u2013]/g, '-')
    .replace(/ | /g, ' ')
    .replace(/[^\x20-\x7e -ÿŒœ’€«»]/g, '')
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of safe(text).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

/** Generates a sober one-page brochure PDF on the fly, in the browser. */
export async function brochurePdf(exhibitor: Exhibitor, brochure: Brochure): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(safe(brochure.title))
  doc.setAuthor(safe(exhibitor.name))
  doc.setSubject('Document fictif - démonstrateur atelier-linkup')
  doc.setProducer('atelier-linkup')
  doc.setCreator('atelier-linkup')

  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([595.28, 841.89])
  const { width, height } = page.getSize()
  const margin = 56
  const textWidth = width - margin * 2

  page.drawRectangle({ x: 0, y: height - 120, width, height: 120, color: INK })
  page.drawRectangle({ x: 0, y: height - 126, width, height: 6, color: ACCENT })
  page.drawText(safe(exhibitor.name.toUpperCase()), { x: margin, y: height - 50, size: 11, font: bold, color: ACCENT })
  page.drawText(safe(brochure.type), { x: margin, y: height - 68, size: 10, font: regular, color: rgb(1, 1, 1) })

  let y = height - 170
  for (const line of wrap(brochure.title, bold, 22, textWidth)) {
    page.drawText(line, { x: margin, y, size: 22, font: bold, color: INK })
    y -= 28
  }
  page.drawText(safe(exhibitor.activity), { x: margin, y: y - 2, size: 11, font: regular, color: MUTED })
  y -= 40

  for (const section of brochure.sections) {
    page.drawRectangle({ x: margin, y: y - 2, width: 4, height: 14, color: ACCENT })
    page.drawText(safe(section.heading), { x: margin + 12, y, size: 13, font: bold, color: INK })
    y -= 22
    for (const line of wrap(section.text, regular, 11, textWidth)) {
      page.drawText(line, { x: margin, y, size: 11, font: regular, color: INK, lineHeight: 15 })
      y -= 16
    }
    y -= 18
  }

  page.drawLine({ start: { x: margin, y: 60 }, end: { x: width - margin, y: 60 }, thickness: 0.5, color: MUTED })
  page.drawText(safe(`${exhibitor.stand} - document fictif généré par le démonstrateur atelier-linkup (Arx Systema)`), {
    x: margin,
    y: 44,
    size: 8,
    font: regular,
    color: MUTED,
  })
  return doc.save()
}

export function pdfFilename(brochure: Brochure): string {
  return (
    brochure.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') + '.pdf'
  )
}
