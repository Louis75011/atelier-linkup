export interface BrochureSection {
  heading: string
  text: string
}

export interface Brochure {
  id: string
  type: 'Fiche produit' | 'Étude de cas' | 'Fiche technique' | string
  title: string
  sections: BrochureSection[]
}

export interface Exhibitor {
  id: string
  name: string
  short: string
  stand: string
  activity: string
  brochures: Brochure[]
}

export type Timeline = 'moins-3-mois' | '3-6-mois' | '6-12-mois' | 'veille'
export type Role = 'decideur' | 'prescripteur' | 'utilisateur' | 'information'
export type Temperature = 'chaud' | 'tiede' | 'froid'

export interface FollowUp {
  day: number
  label: string
  status: 'envoyé' | 'programmé' | 'en attente de validation' | 'annulé'
}

export interface Visitor {
  id: string
  firstName: string
  lastName: string
  company: string
  email: string
  exhibitorId: string
  sector: string
  project: string
  timeline: Timeline
  role: Role
  questions: string[]
  brochures: string[]
  score: number
  temperature: Temperature
  createdAt: string
  consent: boolean
  source: 'pré-rempli' | 'assistant'
  handedOff: boolean
  followUps: FollowUp[]
}
