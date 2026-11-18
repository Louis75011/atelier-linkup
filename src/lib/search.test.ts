import { describe, expect, it } from 'vitest'
import { findExhibitor } from './catalog'
import { answerFrom, buildIndex, normalize, searchPassages } from './search'

const aquilon = findExhibitor('aquilon')!
const voltaia = findExhibitor('voltaia')!

describe('normalize', () => {
  it('strips accents, case and stopwords', () => {
    expect(normalize('Réutilisation')).toBe('reutilisation')
    expect(normalize('les')).toBeNull()
    expect(normalize('membranes')).toBe('membrane')
  })
})

describe('searchPassages', () => {
  it('finds the osmosis datasheet for a pressure question', () => {
    const hits = searchPassages(buildIndex(aquilon), 'Quelle pression de service pour l’osmose inverse ?')
    expect(hits[0].brochureId).toBe('aquilon-ft-osmose')
  })

  it('finds the warranty of traction batteries', () => {
    const hits = searchPassages(buildIndex(voltaia), 'garantie des batteries de chariots')
    expect(hits[0].brochureId).toBe('voltaia-lfp-traction')
    expect(hits[0].text).toContain('Garantie de 7 ans')
  })

  it('returns at most one passage per brochure', () => {
    const hits = searchPassages(buildIndex(aquilon), 'eau', 5)
    const ids = hits.map((h) => h.brochureId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('returns nothing for an unrelated question', () => {
    expect(searchPassages(buildIndex(voltaia), 'xylophone')).toHaveLength(0)
  })
})

describe('answerFrom', () => {
  it('cites the source brochure', () => {
    const hits = searchPassages(buildIndex(voltaia), 'capacité du conteneur de stockage')
    expect(answerFrom(hits, voltaia.name)).toContain('« Conteneur de stockage stationnaire VS-500 »')
  })
  it('offers a hand-off when nothing is found', () => {
    expect(answerFrom([], 'X')).toContain('commercial')
  })
})
