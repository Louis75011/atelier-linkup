import { findBrochure, findExhibitor, ROLE_LABELS, TIMELINE_LABELS } from './catalog'
import { TEMPERATURE_LABELS } from './qualify'
import type { Visitor } from './types'

/** RFC 4180 cell escaping, with a guard against spreadsheet formula injection. */
export function csvCell(value: string | number | boolean): string {
  let s = String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  if (/[";\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

export const CSV_HEADERS = [
  'Date',
  'Prénom',
  'Nom',
  'Société',
  'Courriel',
  'Exposant',
  'Secteur',
  'Projet',
  'Délai',
  'Rôle',
  'Score',
  'Température',
  'Brochures',
  'Consentement',
  'Source',
  'Commercial alerté',
]

/** Semicolon-separated CSV (French Excel default), with BOM for accents. */
export function visitorsToCsv(visitors: Visitor[]): string {
  const rows = visitors.map((v) =>
    [
      v.createdAt,
      v.firstName,
      v.lastName,
      v.company,
      v.email,
      findExhibitor(v.exhibitorId)?.name ?? v.exhibitorId,
      v.sector,
      v.project,
      TIMELINE_LABELS[v.timeline],
      ROLE_LABELS[v.role],
      v.score,
      TEMPERATURE_LABELS[v.temperature],
      v.brochures.map((id) => findBrochure(id)?.brochure.title ?? id).join(' | '),
      v.consent ? 'oui' : 'non',
      v.source,
      v.handedOff ? 'oui' : 'non',
    ]
      .map(csvCell)
      .join(';'),
  )
  return '﻿' + [CSV_HEADERS.join(';'), ...rows].join('\r\n') + '\r\n'
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
