import { describe, expect, it } from 'vitest'
import { CLIENTS, SAMPLE_ARTICLE } from '../data/editorial'
import { applyBans, decline, keySentences, keywords } from './editorial'

const [brevalis, valorme, thermocea] = CLIENTS

describe('decline', () => {
  it('is deterministic', () => {
    expect(decline(SAMPLE_ARTICLE.title, SAMPLE_ARTICLE.body, thermocea)).toEqual(
      decline(SAMPLE_ARTICLE.title, SAMPLE_ARTICLE.body, thermocea),
    )
  })

  it('produces the four networks within their limits', () => {
    for (const voice of CLIENTS) {
      const posts = decline(SAMPLE_ARTICLE.title, SAMPLE_ARTICLE.body, voice)
      expect(posts.map((p) => p.network)).toEqual(['LinkedIn', 'X', 'Facebook', 'Instagram'])
      for (const p of posts) expect(p.chars).toBeLessThanOrEqual(p.limit)
    }
  })

  it('keeps X under 280 characters', () => {
    const x = decline(SAMPLE_ARTICLE.title, SAMPLE_ARTICLE.body, brevalis).find((p) => p.network === 'X')!
    expect([...x.text].length).toBeLessThanOrEqual(280)
  })

  it('removes emojis for a client who refuses them', () => {
    for (const p of decline(SAMPLE_ARTICLE.title, SAMPLE_ARTICLE.body, valorme)) {
      expect(p.text).not.toMatch(/\p{Extended_Pictographic}/u)
    }
  })

  it('never uses banned words', () => {
    const text = decline('Une offre révolutionnaire', SAMPLE_ARTICLE.body, valorme).map((p) => p.text).join(' ')
    expect(text.toLowerCase()).not.toContain('révolutionnaire')
    expect(text).toContain('éprouvé')
  })

  it('uses the client call to action and hashtags', () => {
    const linkedin = decline(SAMPLE_ARTICLE.title, SAMPLE_ARTICLE.body, thermocea)[0]
    expect(linkedin.text).toContain(thermocea.cta)
    expect(linkedin.text).toContain('#Decarbonation')
  })
})

describe('helpers', () => {
  it('applyBans keeps capitalisation and handles plurals', () => {
    expect(applyBans('Révolutionnaire et révolutionnaires', { révolutionnaire: 'éprouvé' })).toBe('Éprouvé et éprouvé')
  })
  it('keySentences favours sentences with figures', () => {
    expect(keySentences(SAMPLE_ARTICLE.body, 2).join(' ')).toMatch(/\d/)
  })
  it('keywords finds the main topic', () => {
    expect(keywords(SAMPLE_ARTICLE.body, 3)).toContain('chaleur')
  })
})
