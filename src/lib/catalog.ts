import raw from '../data/exhibitors.json'
import type { Brochure, Exhibitor, Role, Timeline } from './types'

export const exhibitors = raw as Exhibitor[]

export function findExhibitor(id: string): Exhibitor | undefined {
  return exhibitors.find((e) => e.id === id)
}

export function findBrochure(id: string): { brochure: Brochure; exhibitor: Exhibitor } | undefined {
  for (const exhibitor of exhibitors) {
    const brochure = exhibitor.brochures.find((b) => b.id === id)
    if (brochure) return { brochure, exhibitor }
  }
  return undefined
}

export const SECTORS = [
  'Agroalimentaire',
  'Chimie et pharmacie',
  'Logistique',
  'BTP et génie civil',
  'Énergie',
  'Collectivité',
  'Autre industrie',
]

export const TIMELINE_LABELS: Record<Timeline, string> = {
  'moins-3-mois': 'Moins de 3 mois',
  '3-6-mois': '3 à 6 mois',
  '6-12-mois': '6 à 12 mois',
  veille: 'Simple veille',
}

export const ROLE_LABELS: Record<Role, string> = {
  decideur: 'Je décide',
  prescripteur: 'Je prescris ou recommande',
  utilisateur: "J'utilise au quotidien",
  information: "Je m'informe",
}
