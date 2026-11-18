# atelier-linkup · démonstrateur

> **Démonstrateur - données fictives.** Exposants, visiteurs, clients et brochures sont inventés. Aucune clé d'API, aucun appel réseau sortant, aucun envoi réel : tout tourne dans le navigateur.

Démo en ligne : https://louis75011.github.io/atelier-linkup/

## Objet

Petite application web qui rend concrètes quatre pistes d'usage de l'IA pour une agence de marketing B2B et un outil de capture de contacts sur salon :

1. un assistant de stand qui remplace le formulaire d'un espace documentaire : il lit les brochures de l'exposant, répond en citant sa source, qualifie le visiteur, envoie le bon PDF et récupère ses coordonnées ;
2. un plan éditorial multi-clients : un article décliné par réseau, dans la voix de chaque client, avec validation humaine ;
3. un formulaire de contact qualifiant pour un site d'agence ;
4. les garde-fous : RGPD, validation humaine, choix du modèle, architecture cible.

## Sections

| Onglet | Contenu |
|---|---|
| Assistant de stand | 3 exposants fictifs (traitement des eaux, batteries industrielles, mortiers techniques), 3 à 4 brochures chacun en JSON (`src/data/exhibitors.json`). Conversation simulée, recherche locale MiniSearch, réponses à gabarit qui citent la brochure, qualification (secteur, projet, délai, rôle), choix des documents, coordonnées avec consentement RGPD. En sortie : fiche « connaître son visiteur » avec score chaud/tiède/froid, aperçu du courriel d'envoi et de la relance J+5 (Brevo simulé), bouton « Passer la main à un commercial ». PDF générés à la volée avec pdf-lib. |
| Tableau de bord du salon | 25 visiteurs fictifs + ceux créés dans l'assistant. Filtres chaud/tiède/froid, brochures les plus demandées, courbe des contacts par heure (avec tableau de données), fiche détaillée, chronologie des relances, export CSV (séparateur `;`, BOM UTF-8, protection contre l'injection de formules). |
| Plan éditorial multi-clients | 3 clients fictifs avec fiche de voix (ton, mots à privilégier, mots bannis, émojis, longueur). Déclinaison déterministe d'un article (exemple ou article collé) pour LinkedIn, X, Facebook et Instagram : phrases clés extraites par densité de mots clés et présence de chiffres, puis gabarits. Calendrier du mois, statuts Brouillon / À corriger / Validé, boutons Valider et Corriger. |
| Formulaire qualifiant | 4 étapes (besoin, secteur et délai, budget, coordonnées et consentement). En sortie : fiche résumée, catégorie (Prioritaire, À qualifier par téléphone, Nurturing) et réponse proposée, à relire avant envoi. |
| Garde-fous et architecture | RGPD (finalité, consentement, conservation, hébergement UE, clés hors du code, minimisation), validation humaine, choix du modèle selon l'usage (présentation neutre de Claude, Mistral et ChatGPT), schéma SVG de l'architecture. |

L'état (visiteurs créés, plan éditorial) est gardé en mémoire et dans `localStorage` (lecture et écriture protégées par try/catch). Le bouton « Réinitialiser la démo » remet tout à zéro.

## Charte d'inspiration

Relevé en lecture seule (curl) des pages et feuilles de style des deux sites de référence le 18/11/2026 :

- couleurs dominantes : un vert chartreuse vif, un noir anthracite, des gris clairs ;
- polices : sans-serif condensées (Ubuntu Condensed, Roboto Condensed) ;
- rythme : grands blocs aérés, titres condensés en capitales, aplats sombres.

Choix retenus, sans reprendre logo, images ni textes :

| Rôle | Valeur |
|---|---|
| Encre / aplats | anthracite `#1c1d1b` |
| Accent | chartreuse `#bfd22b` (toujours sur fond sombre ou avec texte anthracite, jamais en texte sur blanc) |
| Accent texte | olive `#556100` (contraste AA sur blanc) |
| Fond | gris clair `#f4f5f1`, cartes blanches |
| Titres | Barlow Condensed 600/700 |
| Texte | Barlow 400/500/600 |

Polices auto-hébergées via `@fontsource` (aucun appel à Google Fonts). Pictogrammes : SVG au trait dessinés pour le projet. La température d'un visiteur n'est jamais portée par la seule couleur (symbole ▲ ■ ▼ + libellé).

## Pile technique

- Vite 8, React 19, TypeScript, Tailwind CSS 4
- MiniSearch (recherche plein texte locale), pdf-lib (PDF dans le navigateur, chargé à la demande)
- Vitest (25 tests : recherche, score de qualification, déclinaison éditoriale, export CSV), oxlint
- GitHub Actions → GitHub Pages (base `/atelier-linkup/`)
- `noindex` dans la page et `robots.txt` qui interdit l'indexation

```bash
pnpm install
pnpm dev      # http://localhost:5173/atelier-linkup/
pnpm test
pnpm lint
pnpm build && pnpm preview
```

Arborescence utile :

```
src/
  data/       exposants (JSON), visiteurs fictifs, clients et article d'exemple
  lib/        recherche, qualification, déclinaison, CSV, PDF, courriels, stockage
  tabs/       un fichier par onglet
  components/ icônes, badge de température, aperçu de courriel
```

## Passage en production

Ce que la démo simule, et ce qui le remplacerait :

| Démo | Production |
|---|---|
| Index MiniSearch en mémoire | Base vectorielle hébergée dans l'UE (par exemple pgvector ou Qdrant), alimentée par le découpage des brochures PDF de chaque exposant |
| Réponses à gabarit | Modèle de langage hébergé en Europe, contraint à citer la brochure et à renvoyer vers un commercial hors périmètre |
| Enchaînement codé dans l'interface | Workflow n8n : conversation, score, fiche CRM, préparation des courriels, journal des validations |
| Courriels affichés | Brevo (envoi transactionnel immédiat des brochures, relances après validation humaine), désinscription en un clic |
| `localStorage` | CRM de l'agence ou de l'exposant, conservation limitée et purge automatique |
| Déclinaison par gabarits | Modèle de langage guidé par la fiche de voix, puis validation humaine et programmation n8n vers Metricool |

Les clés d'API vivent dans le coffre de n8n ou dans les variables d'environnement du serveur, jamais dans le dépôt ni dans le navigateur.

---

Démonstrateur réalisé par [Arx Systema](https://www.arx-systema.fr) - données fictives.
