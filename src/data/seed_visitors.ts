import { followUpPlan } from '../lib/mail'
import { qualify } from '../lib/qualify'
import type { Role, Timeline, Visitor } from '../lib/types'

/** Fictional trade-show day shown in the dashboard. */
export const SHOW_DATE = '2026-11-17'
export const SHOW_NAME = 'Salon fictif des solutions industrielles'

type Row = [
  first: string,
  last: string,
  company: string,
  exhibitor: string,
  sector: string,
  project: string,
  timeline: Timeline,
  role: Role,
  brochures: string[],
  questions: number,
  time: string,
]

// Every name and company below is invented for the demo.
const ROWS: Row[] = [
  ['Claire', 'Vasseur', 'Laiterie des Prés Hauts', 'aquilon', 'Agroalimentaire', 'Recycler les eaux de condensats pour le refroidissement', 'moins-3-mois', 'decideur', ['aquilon-ultrafiltration', 'aquilon-cas-laiterie'], 3, '09:12'],
  ['Mehdi', 'Rahmani', 'Logisud Entrepôts', 'voltaia', 'Logistique', 'Passer 40 chariots du plomb au lithium', '3-6-mois', 'decideur', ['voltaia-lfp-traction', 'voltaia-cas-entrepot'], 2, '09:25'],
  ['Sophie', 'Lemaire', 'BET Structura', 'calceo', 'BTP et génie civil', 'Réparation de poutres de parking', '3-6-mois', 'prescripteur', ['calceo-reparation'], 2, '09:41'],
  ['Thomas', 'Girard', 'Chimirex', 'aquilon', 'Chimie et pharmacie', 'Mise en conformité des rejets', '6-12-mois', 'prescripteur', ['aquilon-conformite'], 1, '09:58'],
  ['Nadia', 'Benali', 'Ville de Saint-Arnoult-sur-Lys', 'aquilon', 'Collectivité', '', 'veille', 'information', ['aquilon-ft-osmose'], 0, '10:05'],
  ['Julien', 'Marchal', 'Transports Marchal et Fils', 'voltaia', 'Logistique', 'Remplacer les batteries de transpalettes', 'moins-3-mois', 'utilisateur', ['voltaia-lfp-traction'], 1, '10:18'],
  ['Élodie', 'Perrin', 'Fromagerie du Vallon', 'aquilon', 'Agroalimentaire', 'Réduire la consommation d’eau du nettoyage en place', '3-6-mois', 'decideur', ['aquilon-cas-laiterie', 'aquilon-ft-osmose', 'aquilon-ultrafiltration'], 4, '10:31'],
  ['Karim', 'Oudjani', 'Solaris Parc Industriel', 'voltaia', 'Énergie', 'Stockage couplé à 800 kWc de toitures', '6-12-mois', 'decideur', ['voltaia-ft-stockage'], 3, '10:47'],
  ['Pauline', 'Arnaud', 'Atelier Béton Ouest', 'calceo', 'BTP et génie civil', 'Calage de deux presses', 'moins-3-mois', 'utilisateur', ['calceo-ft-scellement'], 1, '11:02'],
  ['Hugo', 'Lacroix', 'Étudiant ingénieur', 'calceo', 'Autre industrie', '', 'veille', 'information', ['calceo-cas-quai'], 0, '11:10'],
  ['Inès', 'Fontaine', 'Port autonome fictif de Kerlann', 'calceo', 'BTP et génie civil', 'Réparation d’un quai en milieu marin', '3-6-mois', 'decideur', ['calceo-cas-quai', 'calceo-reparation'], 3, '11:24'],
  ['Antoine', 'Moreau', 'Frigolog', 'voltaia', 'Logistique', 'Étude de charge d’opportunité', '6-12-mois', 'prescripteur', ['voltaia-cas-entrepot'], 1, '11:39'],
  ['Camille', 'Dupuis', 'Brasserie de la Combe', 'aquilon', 'Agroalimentaire', 'Réutiliser les eaux de rinçage', '6-12-mois', 'utilisateur', ['aquilon-ultrafiltration'], 1, '12:15'],
  ['Romain', 'Charpentier', 'Pharmaval', 'aquilon', 'Chimie et pharmacie', 'Eau purifiée pour une nouvelle ligne', 'moins-3-mois', 'prescripteur', ['aquilon-ft-osmose', 'aquilon-ultrafiltration'], 2, '13:48'],
  ['Laura', 'Bouvier', 'Entrepôts du Centre', 'voltaia', 'Logistique', '', 'veille', 'utilisateur', ['voltaia-lfp-traction'], 0, '14:02'],
  ['Sébastien', 'Roux', 'Roux Génie Civil', 'calceo', 'BTP et génie civil', 'Sols d’un atelier de 2 000 m2', '3-6-mois', 'decideur', ['calceo-sols', 'calceo-reparation'], 2, '14:20'],
  ['Amélie', 'Garnier', 'Thermaplast', 'voltaia', 'Énergie', 'Écrêtage des pointes de consommation', '3-6-mois', 'decideur', ['voltaia-ft-stockage', 'voltaia-cas-entrepot'], 2, '14:33'],
  ['Lucas', 'Henry', 'Bureau d’études Alto', 'aquilon', 'Autre industrie', 'Veille sur la réutilisation des eaux', 'veille', 'prescripteur', ['aquilon-conformite'], 1, '14:51'],
  ['Manon', 'Leclerc', 'Leclerc Maintenance', 'calceo', 'Autre industrie', 'Scellement de ponts roulants', '6-12-mois', 'utilisateur', ['calceo-ft-scellement'], 1, '15:06'],
  ['Yanis', 'Mercier', 'Distrifroid', 'voltaia', 'Logistique', 'Batteries pour chambres froides', 'moins-3-mois', 'decideur', ['voltaia-lfp-traction', 'voltaia-cas-entrepot'], 3, '15:22'],
  ['Chloé', 'Barbier', 'Communauté de communes fictive du Haut-Mesnil', 'aquilon', 'Collectivité', 'Diagnostic des rejets de la zone d’activité', '6-12-mois', 'prescripteur', ['aquilon-conformite'], 2, '15:40'],
  ['Maxime', 'Renard', 'Renard Travaux Publics', 'calceo', 'BTP et génie civil', '', 'veille', 'information', ['calceo-reparation'], 0, '16:05'],
  ['Sarah', 'Colin', 'Agrovert Conserves', 'aquilon', 'Agroalimentaire', 'Réduire les prélèvements en été', 'moins-3-mois', 'decideur', ['aquilon-cas-laiterie', 'aquilon-ultrafiltration'], 2, '16:18'],
  ['Nicolas', 'Faure', 'Électroparc', 'voltaia', 'Énergie', 'Alimentation de secours d’un site', '3-6-mois', 'prescripteur', ['voltaia-ft-stockage'], 1, '16:44'],
  ['Léa', 'Gauthier', 'Cimentec Réparations', 'calceo', 'BTP et génie civil', 'Réparations de parkings en site occupé', '3-6-mois', 'utilisateur', ['calceo-reparation', 'calceo-sols'], 2, '17:12'],
]

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '')
}

export const SEED_VISITORS: Visitor[] = ROWS.map(
  ([first, last, company, exhibitorId, sector, project, timeline, role, brochures, questions, time], i) => {
    const q = qualify({ timeline, role, project, questionsCount: questions, brochuresCount: brochures.length })
    const plan = followUpPlan(q.temperature).map((f) =>
      // A few follow-ups already validated or cancelled, for a realistic timeline.
      f.day === 5 && i % 3 === 0 ? { ...f, status: 'programmé' as const } : f,
    )
    return {
      id: `seed-${i + 1}`,
      firstName: first,
      lastName: last,
      company,
      email: `${slug(first)}.${slug(last)}@exemple.invalid`,
      exhibitorId,
      sector,
      project,
      timeline,
      role,
      questions: Array.from({ length: questions }, (_, k) => `Question ${k + 1}`),
      brochures,
      score: q.score,
      temperature: q.temperature,
      createdAt: `${SHOW_DATE}T${time}:00`,
      consent: true,
      source: 'pré-rempli',
      handedOff: q.temperature === 'chaud' && i % 2 === 0,
      followUps: plan,
    }
  },
)
