import { downloadBlob } from './csv'
import type { Exhibitor } from './types'

/** Generates the brochure PDF in the browser; pdf-lib is loaded on first use. */
export async function downloadBrochure(exhibitor: Exhibitor, brochureId: string): Promise<void> {
  const brochure = exhibitor.brochures.find((b) => b.id === brochureId)
  if (!brochure) return
  const { brochurePdf, pdfFilename } = await import('./pdf')
  const bytes = await brochurePdf(exhibitor, brochure)
  downloadBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), pdfFilename(brochure))
}
