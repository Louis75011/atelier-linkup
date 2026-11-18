import { describe, expect, it } from 'vitest'
import { SEED_VISITORS } from '../data/seed_visitors'
import { CSV_HEADERS, csvCell, visitorsToCsv } from './csv'

describe('csvCell', () => {
  it('quotes separators, quotes and newlines', () => {
    expect(csvCell('a;b')).toBe('"a;b"')
    expect(csvCell('dit "oui"')).toBe('"dit ""oui"""')
    expect(csvCell('ligne\nsuivante')).toBe('"ligne\nsuivante"')
  })
  it('neutralises formula injection', () => {
    expect(csvCell('=SOMME(A1)')).toBe("'=SOMME(A1)")
  })
})

describe('visitorsToCsv', () => {
  const csv = visitorsToCsv(SEED_VISITORS)
  const lines = csv.replace('﻿', '').trim().split('\r\n')

  it('starts with a BOM and the header row', () => {
    expect(csv.startsWith('﻿')).toBe(true)
    expect(lines[0]).toBe(CSV_HEADERS.join(';'))
  })
  it('has one row per visitor', () => {
    expect(SEED_VISITORS.length).toBe(25)
    expect(lines).toHaveLength(26)
  })
  it('exports readable labels', () => {
    expect(lines[1]).toContain('Aquilon Traitement des Eaux')
    expect(lines[1]).toContain('Chaud')
    expect(lines[1]).toContain('Module d\'ultrafiltration UF-Compact 40 | Laiterie coopérative : -38 % d\'eau prélevée')
  })
})
