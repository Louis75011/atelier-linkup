import { describe, expect, it } from 'vitest'
import { MAX_SCORE, qualify } from './qualify'

describe('qualify', () => {
  it('rates a short-term decision maker as hot', () => {
    const q = qualify({ timeline: 'moins-3-mois', role: 'decideur', project: 'Remplacer quarante chariots au plomb', questionsCount: 3, brochuresCount: 2 })
    expect(q.score).toBe(10)
    expect(q.temperature).toBe('chaud')
    expect(q.reasons).toContain('Interlocuteur décideur')
  })

  it('rates a curious visitor in watch mode as cold', () => {
    const q = qualify({ timeline: 'veille', role: 'information', project: '', questionsCount: 0, brochuresCount: 1 })
    expect(q.score).toBe(0)
    expect(q.temperature).toBe('froid')
  })

  it('rates a mid-term prescriber as warm', () => {
    const q = qualify({ timeline: '6-12-mois', role: 'prescripteur', project: 'étude', questionsCount: 2, brochuresCount: 1 })
    expect(q.score).toBe(4)
    expect(q.temperature).toBe('tiede')
  })

  it('never exceeds the maximum', () => {
    const q = qualify({ timeline: 'moins-3-mois', role: 'decideur', project: 'un projet très bien décrit ici', questionsCount: 9, brochuresCount: 9 })
    expect(q.score).toBeLessThanOrEqual(MAX_SCORE)
  })
})
