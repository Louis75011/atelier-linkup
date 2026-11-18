import MiniSearch from 'minisearch'
import type { Exhibitor } from './types'

export interface Passage {
  id: string
  brochureId: string
  brochureTitle: string
  brochureType: string
  heading: string
  text: string
}

export interface SearchHit extends Passage {
  score: number
}

const STOPWORDS = new Set(
  'le la les un une des du de d l à au aux et ou en pour par sur avec sans dans est sont vous votre vos nous notre je j me mon ma mes que qui quoi quel quelle quels quelles ce cet cette ces il elle on y a as avez ai pas ne plus moins se sa son ses leur leurs comme est-ce combien comment'.split(
    ' ',
  ),
)

/** Lowercase, strip accents and punctuation, drop stopwords. */
export function normalize(term: string): string | null {
  const t = term
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
  if (t.length < 2 || STOPWORDS.has(t)) return null
  // Light French stemming: plural "s" / "x".
  return t.length > 4 ? t.replace(/(s|x)$/, '') : t
}

export function passagesOf(exhibitor: Exhibitor): Passage[] {
  return exhibitor.brochures.flatMap((b) =>
    b.sections.map((s, i) => ({
      id: `${b.id}#${i}`,
      brochureId: b.id,
      brochureTitle: b.title,
      brochureType: b.type,
      heading: s.heading,
      text: s.text,
    })),
  )
}

export function buildIndex(exhibitor: Exhibitor): MiniSearch<Passage> {
  const index = new MiniSearch<Passage>({
    fields: ['brochureTitle', 'heading', 'text'],
    storeFields: ['brochureId', 'brochureTitle', 'brochureType', 'heading', 'text'],
    tokenize: (text) => text.split(/[\s'’\-,.;:()/]+/),
    processTerm: (term) => normalize(term),
    searchOptions: {
      boost: { brochureTitle: 2, heading: 1.2 },
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'OR',
    },
  })
  index.addAll(passagesOf(exhibitor))
  return index
}

/** Best passages for a question, at most one per brochure. */
export function searchPassages(index: MiniSearch<Passage>, query: string, limit = 2): SearchHit[] {
  const results = index.search(query)
  const seen = new Set<string>()
  const hits: SearchHit[] = []
  for (const r of results) {
    if (seen.has(r.brochureId)) continue
    seen.add(r.brochureId)
    hits.push({
      id: String(r.id),
      brochureId: r.brochureId,
      brochureTitle: r.brochureTitle,
      brochureType: r.brochureType,
      heading: r.heading,
      text: r.text,
      score: r.score,
    })
    if (hits.length >= limit) break
  }
  return hits
}

/** Template answer that always cites its source brochure. */
export function answerFrom(hits: SearchHit[], exhibitorName: string): string {
  if (hits.length === 0) {
    return `Je ne trouve pas cette information dans la documentation de ${exhibitorName}. Je peux la transmettre à un commercial du stand, qui vous répondra précisément.`
  }
  const [first, second] = hits
  let answer = `D'après « ${first.brochureTitle} » (${first.brochureType.toLowerCase()}, partie « ${first.heading} ») : ${first.text}`
  if (second) {
    answer += `\n\nÀ lire aussi : « ${second.brochureTitle} », partie « ${second.heading} ».`
  }
  return answer
}
