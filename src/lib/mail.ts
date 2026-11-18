import { findBrochure, findExhibitor } from './catalog'
import type { FollowUp, Temperature, Visitor } from './types'

export interface MailPreview {
  from: string
  to: string
  subject: string
  body: string
  when: string
}

function list(ids: string[]): string {
  return ids.map((id) => `- ${findBrochure(id)?.brochure.title ?? id} (PDF)`).join('\n')
}

export function deliveryMail(v: Pick<Visitor, 'firstName' | 'email' | 'exhibitorId' | 'brochures'>): MailPreview {
  const ex = findExhibitor(v.exhibitorId)
  const name = ex?.name ?? 'Exposant'
  return {
    from: `${name} <salon@exemple.invalid>`,
    to: v.email,
    subject: `Vos documents - ${name}`,
    when: 'Immédiatement, après consentement',
    body: `Bonjour ${v.firstName},

Merci pour votre visite sur notre stand (${ex?.stand ?? ''}).
Comme convenu, voici les documents demandés :

${list(v.brochures)}

Un membre de notre équipe reste à votre disposition pour étudier votre projet.

Bien cordialement,
L'équipe ${name}

Vous recevez ce message parce que vous l'avez demandé sur notre stand. Désinscription en un clic : lien en bas de message.`,
  }
}

export function followUpMail(
  v: Pick<Visitor, 'firstName' | 'email' | 'exhibitorId' | 'project'>,
  temperature: Temperature,
): MailPreview {
  const ex = findExhibitor(v.exhibitorId)
  const name = ex?.name ?? 'Exposant'
  const offer =
    temperature === 'chaud'
      ? 'Je vous propose un échange de 20 minutes avec un ingénieur d’application pour cadrer votre projet. Quel créneau vous conviendrait ?'
      : temperature === 'tiede'
        ? 'Si cela peut vous aider, nous pouvons vous transmettre un retour d’expérience proche de votre situation.'
        : 'Nous restons à votre disposition le jour où le sujet redeviendra d’actualité.'
  return {
    from: `${name} <salon@exemple.invalid>`,
    to: v.email,
    subject: `Suite à votre visite - ${name}`,
    when: 'J+5, après validation par un commercial',
    body: `Bonjour ${v.firstName},

Avez-vous pu parcourir les documents reçus après le salon ?
${v.project ? `Vous nous aviez parlé de votre projet : « ${v.project} ».\n` : ''}
${offer}

Bien cordialement,
L'équipe ${name}`,
  }
}

export function followUpPlan(temperature: Temperature): FollowUp[] {
  const plan: FollowUp[] = [
    { day: 0, label: 'Envoi des brochures', status: 'envoyé' },
    { day: 5, label: 'Relance personnalisée', status: 'en attente de validation' },
  ]
  if (temperature !== 'froid') plan.push({ day: 12, label: 'Retour d’expérience ciblé', status: 'programmé' })
  if (temperature === 'chaud') plan.push({ day: 1, label: 'Appel commercial', status: 'programmé' })
  return plan.sort((a, b) => a.day - b.day)
}
