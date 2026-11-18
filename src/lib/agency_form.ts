export interface AgencyRequest {
  need: string
  needDetail: string
  sector: string
  timeline: string
  budget: string
  firstName: string
  lastName: string
  company: string
  email: string
  phone: string
  consent: boolean
}

export const NEEDS = [
  'Site vitrine ou refonte',
  'Campagne pour un salon',
  'Contenus et réseaux sociaux',
  'Documentation technique et brochures',
  'Autre besoin',
]
export const AGENCY_SECTORS = ['Industrie', 'Énergie et environnement', 'BTP', 'Santé et laboratoires', 'Services B2B', 'Autre']
export const AGENCY_TIMELINES = ['Moins d’un mois', '1 à 3 mois', '3 à 6 mois', 'Pas de date']
export const BUDGETS = ['Moins de 5 000 €', '5 000 à 15 000 €', '15 000 à 40 000 €', 'Plus de 40 000 €', 'Je ne sais pas encore']

export type AgencyCategory = 'Prioritaire' | 'À qualifier par téléphone' | 'Nurturing'

export interface AgencyResult {
  category: AgencyCategory
  points: number
  summary: string[]
  reply: string
}

export function classify(r: AgencyRequest): AgencyResult {
  let points = 0
  if (r.timeline === 'Moins d’un mois' || r.timeline === '1 à 3 mois') points += 2
  else if (r.timeline === '3 à 6 mois') points += 1
  const b = BUDGETS.indexOf(r.budget)
  if (b >= 2 && b <= 3) points += 2
  else if (b === 1) points += 1
  if (r.sector !== 'Autre') points += 1
  if (r.needDetail.trim().length >= 30) points += 1

  const category: AgencyCategory = points >= 5 ? 'Prioritaire' : points >= 3 ? 'À qualifier par téléphone' : 'Nurturing'

  const summary = [
    `Besoin : ${r.need}${r.needDetail.trim() ? ` - ${r.needDetail.trim()}` : ''}`,
    `Secteur : ${r.sector}`,
    `Délai : ${r.timeline}`,
    `Budget indicatif : ${r.budget}`,
    `Contact : ${r.firstName} ${r.lastName}, ${r.company} (${r.email}${r.phone ? `, ${r.phone}` : ''})`,
  ]

  const next =
    category === 'Prioritaire'
      ? 'Je vous propose un rendez-vous de 30 minutes cette semaine pour cadrer le projet. Voici deux créneaux : [créneau 1] ou [créneau 2].'
      : category === 'À qualifier par téléphone'
        ? 'Pour vous orienter au mieux, un appel de 15 minutes nous permettrait de préciser le périmètre. Quel moment vous conviendrait ?'
        : 'Je vous transmets quelques réalisations proches de votre secteur ; nous pourrons en reparler quand votre projet se précisera.'

  const reply = `Bonjour ${r.firstName},

Merci pour votre message concernant : ${r.need.toLowerCase()}.
Nous accompagnons régulièrement des entreprises du secteur « ${r.sector} » et votre demande a bien été lue par notre équipe.

${next}

Bien cordialement,
[Prénom Nom] - [Agence]`

  return { category, points, summary, reply }
}
