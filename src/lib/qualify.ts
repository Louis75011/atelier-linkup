import type { Role, Temperature, Timeline } from './types'

export interface QualificationInput {
  timeline: Timeline
  role: Role
  project: string
  questionsCount: number
  brochuresCount: number
}

export interface Qualification {
  score: number
  temperature: Temperature
  reasons: string[]
}

const TIMELINE_POINTS: Record<Timeline, number> = {
  'moins-3-mois': 4,
  '3-6-mois': 3,
  '6-12-mois': 1,
  veille: 0,
}

const ROLE_POINTS: Record<Role, number> = {
  decideur: 3,
  prescripteur: 2,
  utilisateur: 1,
  information: 0,
}

export const MAX_SCORE = 10

/** Transparent, rule-based lead score (0 to 10). */
export function qualify(input: QualificationInput): Qualification {
  const reasons: string[] = []
  let score = 0

  const t = TIMELINE_POINTS[input.timeline]
  score += t
  if (t >= 3) reasons.push('Projet à court terme')
  else if (t === 0) reasons.push('Démarche de veille')

  const r = ROLE_POINTS[input.role]
  score += r
  if (r === 3) reasons.push('Interlocuteur décideur')
  else if (r === 2) reasons.push('Prescripteur')

  if (input.project.trim().split(/\s+/).filter(Boolean).length >= 4) {
    score += 1
    reasons.push('Projet décrit')
  }
  if (input.questionsCount >= 2) {
    score += 1
    reasons.push('Plusieurs questions techniques')
  }
  if (input.brochuresCount >= 2) {
    score += 1
    reasons.push('Plusieurs documents demandés')
  }

  score = Math.min(score, MAX_SCORE)
  const temperature: Temperature = score >= 8 ? 'chaud' : score >= 4 ? 'tiede' : 'froid'
  return { score, temperature, reasons }
}

export const TEMPERATURE_LABELS: Record<Temperature, string> = {
  chaud: 'Chaud',
  tiede: 'Tiède',
  froid: 'Froid',
}
