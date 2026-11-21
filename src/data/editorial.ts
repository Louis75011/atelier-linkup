export interface Voice {
  id: string
  name: string
  activity: string
  tone: string
  /** Words the client likes to see. Shown in the voice card, used for hashtags. */
  prefer: string[]
  /** Banned word (lowercase) -> preferred replacement. */
  ban: Record<string, string>
  emojis: boolean
  length: 'court' | 'moyen' | 'long'
  tutoiement: boolean
  cta: string
  hashtags: string[]
  color: string
}

// Three invented clients of a fictional B2B agency.
export const CLIENTS: Voice[] = [
  {
    id: 'brevalis',
    name: 'Brevalis Industrie',
    activity: 'Maintenance et efficacité énergétique des usines',
    tone: 'Enthousiaste et concret, orienté terrain',
    prefer: ['atelier', 'énergie', 'productivité', 'concret'],
    ban: { révolutionnaire: 'nouveau', disruptif: 'utile', 'game changer': 'vrai progrès', incroyable: 'notable' },
    emojis: true,
    length: 'moyen',
    tutoiement: false,
    cta: 'Demandez un audit énergétique de votre atelier.',
    hashtags: ['Industrie', 'Énergie', 'PME'],
    color: '#2f6f8f',
  },
  {
    id: 'valorme',
    name: 'Fonderie du Val d’Orme',
    activity: 'Fonderie de pièces en fonte et aluminium',
    tone: 'Sobre, précis, savoir-faire et transmission',
    prefer: ['savoir-faire', 'précision', 'pièces', 'qualité'],
    ban: { révolutionnaire: 'éprouvé', disruptif: 'robuste', incroyable: 'remarquable', 'game changer': 'avancée' },
    emojis: false,
    length: 'court',
    tutoiement: false,
    cta: 'Parlons de vos pièces : notre bureau d’études vous répond sous 48 heures.',
    hashtags: ['Fonderie', 'SavoirFaire'],
    color: '#8a5a2b',
  },
  {
    id: 'thermocea',
    name: 'Thermocéa',
    activity: 'Pompes à chaleur industrielles',
    tone: 'Pédagogique et chaleureux, chiffres à l’appui',
    prefer: ['économies', 'chaleur', 'décarbonation', 'retour sur investissement'],
    ban: { révolutionnaire: 'performant', disruptif: 'efficace', 'game changer': 'levier', incroyable: 'significatif' },
    emojis: true,
    length: 'long',
    tutoiement: false,
    cta: 'Demandez une étude de récupération de chaleur pour votre site.',
    hashtags: ['Décarbonation', 'Énergie', 'Chaleur'],
    color: '#7a3f8f',
  },
]

export const SAMPLE_ARTICLE = {
  title: 'Récupérer la chaleur perdue : le gisement oublié des usines',
  body: `Dans la plupart des sites industriels, une part importante de l'énergie consommée finit en chaleur perdue : compresseurs, fours, groupes froids et eaux de refroidissement rejettent chaque jour des mégawattheures dans l'atmosphère.

Cette chaleur fatale est pourtant récupérable. Une pompe à chaleur industrielle peut la remonter à 90 °C et l'injecter dans les procédés de lavage, de séchage ou de chauffage des bâtiments.

Les retours d'expérience montrent des économies de 20 à 40 % sur la facture de gaz, avec un retour sur investissement souvent inférieur à cinq ans grâce aux aides à la décarbonation.

Le point de départ est toujours le même : un bilan thermique du site, qui croise les sources de chaleur disponibles et les besoins réels. C'est une étude courte, mais décisive.

Certains fournisseurs présentent ces solutions comme révolutionnaires. La réalité est plus simple : une technologie éprouvée, bien dimensionnée, et un suivi rigoureux des performances dans la durée.`,
}

export const NETWORKS = ['LinkedIn', 'X', 'Facebook', 'Instagram'] as const
export type Network = (typeof NETWORKS)[number]
