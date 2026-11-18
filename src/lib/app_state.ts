import { CLIENTS, SAMPLE_ARTICLE, type Network } from '../data/editorial'
import { SEED_VISITORS } from '../data/seed_visitors'
import { decline } from './editorial'
import type { Visitor } from './types'

export type PostStatus = 'Brouillon' | 'À corriger' | 'Validé'

export interface Post {
  id: string
  clientId: string
  network: Network
  date: string // YYYY-MM-DD
  text: string
  status: PostStatus
  note?: string
}

export interface AppState {
  visitors: Visitor[]
  posts: Post[]
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** A few posts already planned in the current month for each fictional client. */
export function seedPosts(today = new Date()): Post[] {
  const y = today.getFullYear()
  const m = today.getMonth()
  const plan: [clientIdx: number, day: number, net: number, status: PostStatus][] = [
    [0, 3, 0, 'Validé'],
    [0, 4, 1, 'Validé'],
    [1, 6, 0, 'Validé'],
    [2, 10, 0, 'Validé'],
    [2, 11, 3, 'À corriger'],
    [0, 17, 2, 'Brouillon'],
    [1, 19, 0, 'Brouillon'],
    [2, 24, 1, 'Brouillon'],
    [1, 26, 2, 'Brouillon'],
  ]
  return plan.map(([c, day, n, status], i) => {
    const client = CLIENTS[c]
    const posts = decline(SAMPLE_ARTICLE.title, SAMPLE_ARTICLE.body, client)
    const p = posts[n]
    return {
      id: `seed-post-${i}`,
      clientId: client.id,
      network: p.network,
      date: isoDate(new Date(y, m, day)),
      text: p.text,
      status,
      note: status === 'À corriger' ? 'Raccourcir l’accroche et vérifier le chiffre cité.' : undefined,
    }
  })
}

export function initialState(): AppState {
  return { visitors: SEED_VISITORS, posts: seedPosts() }
}

/** Parse YYYY-MM-DD as a local date (not UTC). */
export function fromIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
