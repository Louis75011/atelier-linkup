import { IconCheck, IconInfo, IconShield } from '../components/icons'

const RGPD = [
  ['Finalité', 'Les coordonnées servent à envoyer les documents demandés et à suivre la demande. Pas de revente, pas d’autre usage sans nouveau consentement.'],
  ['Consentement', 'Case non cochée par défaut, texte clair, preuve horodatée conservée dans le CRM. Désinscription en un clic dans chaque courriel.'],
  ['Durée de conservation', '3 ans au plus après le dernier contact pour un prospect, puis suppression ou anonymisation automatique par un workflow planifié.'],
  ['Serveurs en France', 'Base documentaire, base vectorielle, n8n et modèle de langage hébergés sur des serveurs en France. Sous-traitants listés dans le registre des traitements.'],
  ['Clés hors du code', 'Les clés d’API vivent dans le coffre de n8n ou dans des variables d’environnement du serveur, jamais dans le dépôt ni dans le navigateur.'],
  ['Minimisation', 'Le modèle ne reçoit que la question et les extraits utiles des brochures. Les coordonnées ne lui sont jamais transmises.'],
]

const USAGES = [
  {
    usage: 'Rédaction et déclinaison de contenus',
    criteria: 'Qualité du français, respect d’une fiche de voix, constance du ton sur des textes longs.',
    advice: 'Comparer les trois sur dix textes réels du client, à l’aveugle, avant de choisir.',
  },
  {
    usage: 'Traduction technique',
    criteria: 'Fidélité au vocabulaire métier, gestion des glossaires, langues cibles nécessaires.',
    advice: 'Fournir un glossaire validé ; faire relire chaque langue par un locuteur du métier.',
  },
  {
    usage: 'Données sensibles ou confidentielles',
    criteria: 'Lieu d’hébergement, absence de réutilisation des données pour l’entraînement, contrat de sous-traitance.',
    advice: 'Privilégier un modèle hébergé en France ou auto-hébergé ; à défaut, ne transmettre que des extraits anonymisés.',
  },
  {
    usage: 'Réponses sur une documentation (assistant de stand)',
    criteria: 'Capacité à citer ses sources, à dire « je ne sais pas », coût par conversation.',
    advice: 'Imposer la citation de la brochure et un renvoi vers un commercial dès que la réponse n’est pas dans les documents.',
  },
]

const MODELS = [
  ['Claude', 'Anthropic (États-Unis)', 'Accessible en direct ou via des plateformes cloud disposant de régions européennes.'],
  ['Mistral', 'Mistral AI (France)', 'Offre hébergée en Europe ; certains modèles à poids ouverts peuvent être auto-hébergés.'],
  ['ChatGPT', 'OpenAI (États-Unis)', 'Offres entreprise et API avec options de résidence des données en Europe.'],
]

export function GuardrailsTab() {
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Piste 4 - les garde-fous</p>
        <h1 className="text-3xl font-bold sm:text-4xl">Garde-fous et architecture</h1>
        <p className="mt-1 max-w-3xl text-ink-2">L’IA reste un outil au service de l’expert, pas une béquille : elle prépare, l’humain décide. Voici les règles qui encadrent les trois pistes, et l’architecture visée en production.</p>
      </div>

      <section aria-labelledby="archi-title" className="card">
        <h2 id="archi-title" className="text-2xl font-bold">Architecture cible</h2>
        <div className="mt-3 overflow-x-auto" tabIndex={0} aria-label="Schéma d'architecture, défilable horizontalement sur petit écran">
          <ArchitectureDiagram />
        </div>
        <ol className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          <li><strong>1. QR code</strong> - le visiteur scanne le code du stand et ouvre l’assistant sur son téléphone.</li>
          <li><strong>2. Assistant</strong> - dialogue, recherche dans la base documentaire, questions de qualification.</li>
          <li><strong>3. Base documentaire</strong> - brochures découpées en passages, indexées dans une base vectorielle hébergée en France.</li>
          <li><strong>4. n8n</strong> - orchestre les étapes : score, fiche CRM, préparation des courriels.</li>
          <li><strong>5. Validation humaine</strong> - un commercial relit les relances et les réponses sensibles avant tout envoi.</li>
          <li><strong>6. Brevo et CRM</strong> - envoi des brochures et des relances validées ; fiche visiteur à jour dans le CRM.</li>
        </ol>
      </section>

      <section aria-labelledby="rgpd-title">
        <h2 id="rgpd-title" className="flex items-center gap-2 text-2xl font-bold"><IconShield /> RGPD et confidentialité</h2>
        <dl className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {RGPD.map(([k, v]) => (
            <div key={k} className="card">
              <dt className="font-display text-lg font-bold">{k}</dt>
              <dd className="mt-1 text-sm text-ink-2">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="human-title" className="card border-ink/30 bg-lime-soft">
        <h2 id="human-title" className="flex items-center gap-2 text-2xl font-bold"><IconCheck /> Validation humaine à chaque envoi</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>L’envoi immédiat des brochures est autorisé, car il répond à une demande explicite du visiteur et ne contient que des documents publics.</li>
          <li>Toute relance, toute réponse rédigée et toute publication sur les réseaux attendent la validation d’une personne nommée.</li>
          <li>Chaque validation est tracée : qui, quand, quelle version.</li>
          <li>Un bouton « Passer la main à un commercial » est disponible à tout moment de la conversation.</li>
        </ul>
      </section>

      <section aria-labelledby="models-title" className="space-y-3">
        <h2 id="models-title" className="text-2xl font-bold">Choisir le modèle selon l’usage</h2>
        <p className="max-w-3xl text-sm text-ink-2">Il n’y a pas de meilleur modèle dans l’absolu. Le choix dépend de l’usage, du niveau de confidentialité et du coût ; il se refait à chaque évolution des offres. Présentation neutre, par ordre alphabétique :</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {MODELS.map(([name, editor, hosting]) => (
            <div key={name} className="card">
              <p className="font-display text-xl font-bold">{name}</p>
              <p className="text-sm text-muted">{editor}</p>
              <p className="mt-2 text-sm">{hosting}</p>
            </div>
          ))}
        </div>
        <div className="card overflow-x-auto p-0 sm:p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Critères de choix du modèle par usage</caption>
            <thead className="bg-paper">
              <tr>
                <th scope="col" className="px-4 py-2">Usage</th>
                <th scope="col" className="px-4 py-2">Critères décisifs</th>
                <th scope="col" className="px-4 py-2">Méthode conseillée</th>
              </tr>
            </thead>
            <tbody>
              {USAGES.map((u) => (
                <tr key={u.usage} className="border-t border-line align-top">
                  <th scope="row" className="px-4 py-2 font-semibold">{u.usage}</th>
                  <td className="px-4 py-2">{u.criteria}</td>
                  <td className="px-4 py-2">{u.advice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="flex gap-2 text-xs text-muted"><IconInfo width={16} height={16} className="shrink-0" /> Les conditions d’hébergement et de traitement des données évoluent : elles se vérifient dans le contrat au moment du choix.</p>
      </section>
    </div>
  )
}

function Box({ x, y, w = 150, title, sub, accent = false }: { x: number; y: number; w?: number; title: string; sub: string; accent?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={64} rx={10} fill={accent ? '#eef4c4' : '#ffffff'} stroke={accent ? '#556100' : '#1c1d1b'} strokeWidth={accent ? 2 : 1.5} />
      <text x={x + w / 2} y={y + 28} textAnchor="middle" fontSize="15" fontWeight="700" fill="#1c1d1b" fontFamily="Barlow Condensed, sans-serif">{title}</text>
      <text x={x + w / 2} y={y + 47} textAnchor="middle" fontSize="11.5" fill="#5c5f58">{sub}</text>
    </g>
  )
}

function ArchitectureDiagram() {
  const arrow = 'url(#arrow)'
  return (
    <svg viewBox="0 0 860 330" className="h-auto w-full min-w-[640px]" role="img" aria-labelledby="diag-title diag-desc">
      <title id="diag-title">Schéma d’architecture de l’assistant de stand</title>
      <desc id="diag-desc">Le QR code ouvre l’assistant, qui interroge la base documentaire. L’assistant transmet à n8n, qui alimente le CRM et soumet les envois à une validation humaine avant Brevo.</desc>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#1c1d1b" />
        </marker>
      </defs>
      <rect x="0" y="0" width="860" height="330" rx="12" fill="#f4f5f1" />

      <Box x={20} y={50} w={130} title="QR code" sub="sur le stand" />
      <Box x={200} y={50} w={160} title="Assistant" sub="dialogue + qualification" accent />
      <Box x={200} y={220} w={160} title="Base documentaire" sub="vectorielle, France" />
      <Box x={420} y={50} w={150} title="n8n" sub="orchestration" accent />
      <Box x={420} y={220} w={150} title="CRM" sub="fiche visiteur" />
      <Box x={630} y={50} w={200} title="Validation humaine" sub="relances et réponses" accent />
      <Box x={630} y={220} w={200} title="Brevo" sub="envois et relances" />

      <line x1={150} y1={82} x2={196} y2={82} stroke="#1c1d1b" strokeWidth="2" markerEnd={arrow} />
      <line x1={265} y1={114} x2={265} y2={216} stroke="#1c1d1b" strokeWidth="2" markerEnd={arrow} markerStart={arrow} />
      <text x={273} y={170} fontSize="11.5" fill="#5c5f58">recherche des passages</text>
      <line x1={360} y1={82} x2={416} y2={82} stroke="#1c1d1b" strokeWidth="2" markerEnd={arrow} />
      <line x1={495} y1={114} x2={495} y2={216} stroke="#1c1d1b" strokeWidth="2" markerEnd={arrow} />
      <text x={503} y={170} fontSize="11.5" fill="#5c5f58">score et coordonnées</text>
      <line x1={570} y1={82} x2={626} y2={82} stroke="#1c1d1b" strokeWidth="2" markerEnd={arrow} />
      <line x1={730} y1={114} x2={730} y2={216} stroke="#556100" strokeWidth="2.5" markerEnd={arrow} />
      <text x={738} y={170} fontSize="11.5" fontWeight="600" fill="#556100">après accord</text>
      <text x={20} y={30} fontSize="12" fill="#5c5f58">Modèle de langage sur serveurs en France, clés d’API dans le coffre de n8n</text>
    </svg>
  )
}
