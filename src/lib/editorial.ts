import type { Network, Voice } from '../data/editorial'
import { normalize } from './search'

export interface Declination {
  network: Network
  text: string
  chars: number
  limit: number
}

export const NETWORK_LIMITS: Record<Network, number> = {
  LinkedIn: 3000,
  X: 280,
  Facebook: 2000,
  Instagram: 2200,
}

const EMOJI = /[\p{Extended_Pictographic}️]/gu

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ0-9«])/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 20)
}

/** Most frequent meaningful words (normalized), ties broken alphabetically. */
export function keywords(text: string, count = 5): string[] {
  const freq = new Map<string, { n: number; word: string }>()
  for (const raw of text.split(/[\s'’\-,.;:()«»!?]+/)) {
    const key = normalize(raw)
    if (!key || key.length < 5 || /^\d+$/.test(key)) continue
    const entry = freq.get(key)
    if (entry) entry.n += 1
    else freq.set(key, { n: 1, word: raw.toLowerCase() })
  }
  return [...freq.entries()]
    .sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0]))
    .slice(0, count)
    .map(([, v]) => v.word)
}

/** Key sentences: keyword density + figures + position, returned in original order. */
export function keySentences(text: string, count: number): string[] {
  const sentences = splitSentences(text)
  const keys = new Set(keywords(text, 8).map((w) => normalize(w)))
  const scored = sentences.map((s, i) => {
    const words = s.split(/[\s'’\-,.;:()]+/).map(normalize).filter(Boolean)
    const hits = words.filter((w) => keys.has(w as string)).length
    const density = (hits / Math.max(words.length, 1)) * 10
    const figures = /\d/.test(s) ? 2 : 0
    const position = i === 0 ? 0.5 : 0
    return { s, i, score: density + figures + position }
  })
  return scored
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, count)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s)
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Replace banned words by the client's preferred words, keeping capitalisation. */
export function applyBans(text: string, ban: Record<string, string>): string {
  let out = text
  for (const [bad, good] of Object.entries(ban)) {
    const re = new RegExp(`(?<![\\p{L}])${escapeRegExp(bad)}(s|es)?(?![\\p{L}])`, 'giu')
    out = out.replace(re, (m) => (m[0] === m[0].toUpperCase() ? good[0].toUpperCase() + good.slice(1) : good))
  }
  return out
}

function hashtag(word: string): string {
  const clean = word
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
  return '#' + clean[0].toUpperCase() + clean.slice(1)
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  return cut.slice(0, cut.lastIndexOf(' ')) + '…'
}

const SENTENCES_BY_LENGTH: Record<Voice['length'], number> = { court: 1, moyen: 2, long: 3 }

/**
 * Deterministic declination of one article into four social posts,
 * in the voice of the selected client. No AI involved: templates + extraction.
 */
export function decline(title: string, body: string, voice: Voice): Declination[] {
  const n = SENTENCES_BY_LENGTH[voice.length]
  const best = keySentences(body, n + 1)
  const short = keySentences(body, n)
  const lead = keySentences(body, 1)[0] ?? ''
  const tags = [...voice.hashtags, ...keywords(`${title} ${body}`, 1)].map(hashtag)
  const uniqueTags = [...new Set(tags)]
  const e = (emoji: string) => (voice.emojis ? `${emoji} ` : '')

  const linkedin = [
    `${e('🔎')}${title}`,
    '',
    ...best.map((s) => `${voice.emojis ? '▸' : '-'} ${s}`),
    '',
    voice.cta,
    '',
    uniqueTags.slice(0, 4).join(' '),
  ].join('\n')

  const xTags = uniqueTags.slice(0, 2).join(' ')
  const xBody = `${e('💡')}${title} - ${lead}`
  const x = `${truncate(xBody, NETWORK_LIMITS.X - xTags.length - 2)}\n${xTags}`

  const facebook = [
    `${e('👋')}${title}`,
    '',
    short.join(' '),
    '',
    `Et chez vous, qu'en pensez-vous ? Dites-le-nous en commentaire.`,
    voice.cta,
  ].join('\n')

  const instagram = [
    `${e('✨')}${title}`,
    '',
    ...short.map((s) => truncate(s, 140)),
    '',
    `${e('👉')}Lien dans la bio.`,
    '',
    uniqueTags.join(' '),
  ].join('\n')

  const posts: [Network, string][] = [
    ['LinkedIn', linkedin],
    ['X', x],
    ['Facebook', facebook],
    ['Instagram', instagram],
  ]

  return posts.map(([network, raw]) => {
    let text = applyBans(raw, voice.ban)
    if (!voice.emojis) text = text.replace(EMOJI, '').replace(/^ +/gm, '')
    const limit = NETWORK_LIMITS[network]
    text = text.length > limit ? truncate(text, limit) : text
    return { network, text, chars: [...text].length, limit }
  })
}
