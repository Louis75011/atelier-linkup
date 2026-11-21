import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { IconDownload, IconInfo, IconQr, IconSend, IconUser } from '../components/icons'
import { MailPreviewCard } from '../components/mail_preview_card'
import { TemperatureBadge } from '../components/temperature_badge'
import { exhibitors, findBrochure, ROLE_LABELS, SECTORS, TIMELINE_LABELS } from '../lib/catalog'
import { deliveryMail, followUpMail, followUpPlan } from '../lib/mail'
import { downloadBrochure } from '../lib/brochure_download'
import { qualify } from '../lib/qualify'
import { answerFrom, buildIndex, searchPassages } from '../lib/search'
import type { Exhibitor, Role, Timeline, Visitor } from '../lib/types'

type Step = 'ask' | 'sector' | 'project' | 'timeline' | 'role' | 'brochures' | 'contact' | 'done'

interface Message {
  from: 'bot' | 'visitor'
  text: string
  sources?: string[]
}

const SUGGESTIONS: Record<string, string[]> = {
  aquilon: ['Quelle pression de service pour l’osmose inverse ?', 'Avez-vous un exemple en laiterie ?', 'Comment réutiliser nos eaux usées ?'],
  voltaia: ['Quelle garantie pour les batteries de chariots ?', 'Quelle capacité pour le stockage stationnaire ?', 'Avez-vous converti une flotte complète ?'],
  calceo: ['Quelle résistance pour le mortier de réparation ?', 'Comment caler une machine ?', 'Avez-vous travaillé en milieu marin ?'],
}


interface Props {
  visitors: Visitor[]
  onLead: (v: Visitor) => void
  onHandOff: (id: string) => void
  onSeeDashboard: () => void
}

export function AssistantTab({ visitors, onLead, onHandOff, onSeeDashboard }: Props) {
  const [exhibitorId, setExhibitorId] = useState(exhibitors[0].id)
  const exhibitor = exhibitors.find((e) => e.id === exhibitorId)!
  const index = useMemo(() => buildIndex(exhibitor), [exhibitor])

  const greeting = (ex: Exhibitor): Message => ({
    from: 'bot',
    text: `Bonjour et bienvenue sur le stand ${ex.name} (${ex.stand}). Je connais nos ${ex.brochures.length} documents techniques. Posez-moi votre question, je vous indiquerai le bon document.`,
  })

  const [messages, setMessages] = useState<Message[]>([greeting(exhibitor)])
  const [step, setStep] = useState<Step>('ask')
  const [input, setInput] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [matched, setMatched] = useState<string[]>([])
  const [sector, setSector] = useState('')
  const [project, setProject] = useState('')
  const [timeline, setTimeline] = useState<Timeline | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [contact, setContact] = useState({ firstName: '', lastName: '', company: '', email: '', consent: false })
  const [contactError, setContactError] = useState('')
  const [leadId, setLeadId] = useState<string | null>(null)
  const logRef = useRef<HTMLOListElement>(null)

  const lead = visitors.find((v) => v.id === leadId) ?? null

  useEffect(() => {
    logRef.current?.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [messages, step])

  const restart = (id = exhibitorId) => {
    const ex = exhibitors.find((e) => e.id === id)!
    setExhibitorId(id)
    setMessages([greeting(ex)])
    setStep('ask')
    setInput('')
    setQuestions([])
    setMatched([])
    setSector('')
    setProject('')
    setTimeline(null)
    setRole(null)
    setSelected([])
    setContact({ firstName: '', lastName: '', company: '', email: '', consent: false })
    setContactError('')
    setLeadId(null)
  }

  const say = (...m: Message[]) => setMessages((prev) => [...prev, ...m])

  const ask = (q: string) => {
    const question = q.trim()
    if (!question) return
    const hits = searchPassages(index, question)
    setQuestions((p) => [...p, question])
    setMatched((p) => [...new Set([...p, ...hits.map((h) => h.brochureId)])])
    say({ from: 'visitor', text: question }, { from: 'bot', text: answerFrom(hits, exhibitor.name), sources: hits.map((h) => h.brochureId) })
    setInput('')
  }

  const toQualification = () => {
    say({ from: 'bot', text: 'Pour vous envoyer les bons documents, quatre questions rapides. Dans quel secteur travaillez-vous ?' })
    setStep('sector')
  }

  const chooseSector = (s: string) => {
    setSector(s)
    say({ from: 'visitor', text: s }, { from: 'bot', text: 'En une phrase, quel est votre projet ? (vous pouvez passer cette question)' })
    setStep('project')
  }

  const submitProject = (e?: FormEvent) => {
    e?.preventDefault()
    const p = input.trim()
    setProject(p)
    say({ from: 'visitor', text: p || 'Je préfère ne pas préciser.' }, { from: 'bot', text: 'À quelle échéance ce projet pourrait-il démarrer ?' })
    setInput('')
    setStep('timeline')
  }

  const chooseTimeline = (t: Timeline) => {
    setTimeline(t)
    say({ from: 'visitor', text: TIMELINE_LABELS[t] }, { from: 'bot', text: 'Et quel est votre rôle dans la décision ?' })
    setStep('role')
  }

  const chooseRole = (r: Role) => {
    setRole(r)
    const proposal = matched.length > 0 ? matched : [exhibitor.brochures[0].id]
    setSelected(proposal)
    const titles = proposal.map((id) => `« ${findBrochure(id)?.brochure.title} »`).join(', ')
    say(
      { from: 'visitor', text: ROLE_LABELS[r] },
      { from: 'bot', text: `Merci. Au vu de vos questions, je vous propose : ${titles}. Vous pouvez ajuster la sélection ci-dessous.` },
    )
    setStep('brochures')
  }

  const confirmBrochures = () => {
    const titles = selected.map((id) => findBrochure(id)?.brochure.title).join(', ')
    say(
      { from: 'visitor', text: `Je souhaite recevoir : ${titles}.` },
      { from: 'bot', text: 'Parfait. À quelle adresse puis-je vous les envoyer ? Vos coordonnées ne servent qu’à cet envoi et au suivi de votre demande.' },
    )
    setStep('contact')
  }

  const submitContact = (e: FormEvent) => {
    e.preventDefault()
    if (!contact.firstName.trim() || !contact.lastName.trim() || !contact.company.trim()) {
      setContactError('Merci de renseigner votre prénom, votre nom et votre société.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
      setContactError('Merci de saisir une adresse électronique valide.')
      return
    }
    if (!contact.consent) {
      setContactError('Le consentement est nécessaire pour vous envoyer les documents.')
      return
    }
    setContactError('')
    const q = qualify({ timeline: timeline!, role: role!, project, questionsCount: questions.length, brochuresCount: selected.length })
    const now = new Date()
    const visitor: Visitor = {
      id: `live-${now.getTime()}`,
      firstName: contact.firstName.trim(),
      lastName: contact.lastName.trim(),
      company: contact.company.trim(),
      email: contact.email.trim(),
      exhibitorId,
      sector,
      project,
      timeline: timeline!,
      role: role!,
      questions,
      brochures: selected,
      score: q.score,
      temperature: q.temperature,
      createdAt: now.toISOString(),
      consent: true,
      source: 'assistant',
      handedOff: false,
      followUps: followUpPlan(q.temperature),
    }
    onLead(visitor)
    setLeadId(visitor.id)
    say(
      { from: 'visitor', text: `${visitor.firstName} ${visitor.lastName}, ${visitor.company}` },
      { from: 'bot', text: `Merci ${visitor.firstName} ! Vos documents partent à l’instant. Bonne visite du salon.` },
    )
    setStep('done')
  }

  const qualification = timeline && role ? qualify({ timeline, role, project, questionsCount: questions.length, brochuresCount: selected.length }) : null

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Piste 1 - remplacer le formulaire de l’espace documentaire</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Assistant de stand</h1>
          <p className="mt-1 max-w-2xl text-ink-2">
            Le visiteur scanne le QR code du stand, pose ses questions, reçoit le bon document et laisse ses coordonnées. Le commercial récupère une fiche déjà qualifiée.
          </p>
        </div>
        <div>
          <label htmlFor="exhibitor" className="label">Stand simulé (exposant fictif)</label>
          <select id="exhibitor" className="field" value={exhibitorId} onChange={(e) => restart(e.target.value)}>
            {exhibitors.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="banner" role="note">
        <IconInfo className="mt-0.5 shrink-0" />
        <p>
          Démonstration hors ligne : la recherche est un simple index local et les réponses suivent des gabarits. En production, la recherche passerait par une base vectorielle et un modèle de langage sur des serveurs en France, orchestrés par n8n.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="card flex min-h-[520px] flex-col p-0 sm:p-0" aria-label="Conversation avec l'assistant">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="grid size-9 place-items-center rounded-lg bg-ink text-lime"><IconQr /></span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{exhibitor.name}</p>
              <p className="text-xs text-muted">{exhibitor.stand} - {exhibitor.activity}</p>
            </div>
          </div>

          <ol ref={logRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite" aria-label="Messages">
            {messages.map((m, i) => (
              <li key={i} className={`flex ${m.from === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.from === 'visitor' ? 'rounded-br-sm bg-ink text-white' : 'rounded-bl-sm border border-line bg-paper'}`}>
                  <span className="sr-only">{m.from === 'visitor' ? 'Visiteur : ' : 'Assistant : '}</span>
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.sources.map((id) => (
                        <button key={id} type="button" className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold text-olive hover:border-ink" onClick={() => downloadBrochure(exhibitor, id)}>
                          <IconDownload width={14} height={14} /> {findBrochure(id)?.brochure.title} (PDF)
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="border-t border-line px-4 py-3">
            {step === 'ask' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2" aria-label="Questions suggérées">
                  {SUGGESTIONS[exhibitorId].map((s) => (
                    <button key={s} type="button" className="chip" onClick={() => ask(s)}>{s}</button>
                  ))}
                </div>
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(input) }}>
                  <label htmlFor="question" className="sr-only">Votre question</label>
                  <input id="question" className="field" placeholder="Votre question technique…" value={input} onChange={(e) => setInput(e.target.value)} autoComplete="off" />
                  <button type="submit" className="btn-primary" disabled={!input.trim()} aria-label="Envoyer la question"><IconSend /></button>
                </form>
                {questions.length > 0 && (
                  <button type="button" className="btn-accent w-full" onClick={toQualification}>
                    Recevoir les documents
                  </button>
                )}
              </div>
            )}

            {step === 'sector' && (
              <fieldset>
                <legend className="label">Votre secteur</legend>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map((s) => <button key={s} type="button" className="chip" onClick={() => chooseSector(s)}>{s}</button>)}
                </div>
              </fieldset>
            )}

            {step === 'project' && (
              <form className="flex flex-wrap gap-2" onSubmit={submitProject}>
                <label htmlFor="project" className="sr-only">Votre projet</label>
                <input id="project" className="field min-w-0 flex-1" placeholder="Ex. : réduire nos prélèvements d’eau l’été" value={input} onChange={(e) => setInput(e.target.value)} autoComplete="off" />
                <button type="submit" className="btn-primary">{input.trim() ? 'Valider' : 'Passer'}</button>
              </form>
            )}

            {step === 'timeline' && (
              <fieldset>
                <legend className="label">Échéance du projet</legend>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(TIMELINE_LABELS) as Timeline[]).map((t) => <button key={t} type="button" className="chip" onClick={() => chooseTimeline(t)}>{TIMELINE_LABELS[t]}</button>)}
                </div>
              </fieldset>
            )}

            {step === 'role' && (
              <fieldset>
                <legend className="label">Votre rôle dans la décision</legend>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ROLE_LABELS) as Role[]).map((r) => <button key={r} type="button" className="chip" onClick={() => chooseRole(r)}>{ROLE_LABELS[r]}</button>)}
                </div>
              </fieldset>
            )}

            {step === 'brochures' && (
              <fieldset className="space-y-2">
                <legend className="label">Documents à recevoir</legend>
                {exhibitor.brochures.map((b) => (
                  <label key={b.id} className="flex items-start gap-2 rounded-lg border border-line p-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 accent-[#1c1d1b]"
                      checked={selected.includes(b.id)}
                      onChange={(e) => setSelected((p) => (e.target.checked ? [...p, b.id] : p.filter((x) => x !== b.id)))}
                    />
                    <span><span className="font-semibold">{b.title}</span> <span className="text-muted">- {b.type}</span></span>
                  </label>
                ))}
                <button type="button" className="btn-accent w-full" disabled={selected.length === 0} onClick={confirmBrochures}>Confirmer la sélection</button>
              </fieldset>
            )}

            {step === 'contact' && (
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitContact} noValidate>
                {([
                  ['firstName', 'Prénom', 'given-name'],
                  ['lastName', 'Nom', 'family-name'],
                  ['company', 'Société', 'organization'],
                  ['email', 'Courriel professionnel', 'email'],
                ] as const).map(([key, label, ac]) => (
                  <div key={key}>
                    <label htmlFor={`c-${key}`} className="label">{label}</label>
                    <input id={`c-${key}`} className="field" type={key === 'email' ? 'email' : 'text'} autoComplete={ac} value={contact[key]} onChange={(e) => setContact((c) => ({ ...c, [key]: e.target.value }))} required />
                  </div>
                ))}
                <label className="flex items-start gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" className="mt-1 size-4 shrink-0 accent-[#1c1d1b]" checked={contact.consent} onChange={(e) => setContact((c) => ({ ...c, consent: e.target.checked }))} />
                  <span>
                    J’accepte que {exhibitor.name} utilise mes coordonnées pour m’envoyer ces documents et me recontacter au sujet de ma demande. Conservation 3 ans au plus, désinscription à tout moment. Aucune cession à des tiers.
                  </span>
                </label>
                {contactError && <p role="alert" className="text-sm font-semibold text-hot sm:col-span-2">{contactError}</p>}
                <button type="submit" className="btn-primary sm:col-span-2">Recevoir mes documents</button>
              </form>
            )}

            {step === 'done' && (
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-ghost" onClick={() => restart()}>Nouvelle conversation</button>
                <button type="button" className="btn-ghost" onClick={onSeeDashboard}>Voir le tableau de bord</button>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4" aria-label="Ce que voit l'exposant">
          <section className="card">
            <h2 className="flex items-center gap-2 text-xl font-bold"><IconUser /> Connaître son visiteur</h2>
            {step !== 'done' && (
              <dl className="mt-3 space-y-1.5 text-sm">
                <Row k="Questions posées" v={questions.length ? String(questions.length) : '-'} />
                <Row k="Secteur" v={sector || '-'} />
                <Row k="Projet" v={project || '-'} />
                <Row k="Délai" v={timeline ? TIMELINE_LABELS[timeline] : '-'} />
                <Row k="Rôle" v={role ? ROLE_LABELS[role] : '-'} />
                <div className="pt-1">
                  {qualification ? <TemperatureBadge value={qualification.temperature} score={qualification.score} /> : <span className="text-muted">Score calculé après les questions de qualification.</span>}
                </div>
              </dl>
            )}
            {step === 'done' && lead && (
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{lead.firstName} {lead.lastName} - {lead.company}</p>
                  <TemperatureBadge value={lead.temperature} score={lead.score} />
                </div>
                <dl className="space-y-1.5">
                  <Row k="Besoin" v={lead.project || 'Non précisé'} />
                  <Row k="Secteur" v={lead.sector} />
                  <Row k="Délai" v={TIMELINE_LABELS[lead.timeline]} />
                  <Row k="Rôle" v={ROLE_LABELS[lead.role]} />
                </dl>
                {qualification && qualification.reasons.length > 0 && (
                  <p className="text-muted">Pourquoi ce score : {qualification.reasons.join(', ').toLowerCase()}.</p>
                )}
                <div>
                  <p className="font-semibold">Brochures envoyées</p>
                  <ul className="mt-1 space-y-1">
                    {lead.brochures.map((id) => (
                      <li key={id}>
                        <button type="button" className="inline-flex items-center gap-1 text-left text-olive underline underline-offset-2" onClick={() => downloadBrochure(exhibitor, id)}>
                          <IconDownload width={14} height={14} /> {findBrochure(id)?.brochure.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                {lead.handedOff ? (
                  <p role="status" className="rounded-lg bg-lime-soft p-2 font-semibold">Commercial alerté : la fiche lui a été transmise (simulation).</p>
                ) : (
                  <button type="button" className="btn-primary w-full" onClick={() => onHandOff(lead.id)}>Passer la main à un commercial</button>
                )}
              </div>
            )}
          </section>
        </aside>
      </div>

      {step === 'done' && lead && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <MailPreviewCard title="Courriel d'envoi (immédiat)" mail={deliveryMail(lead)} />
          <MailPreviewCard title="Relance à J+3" mail={followUpMail(lead, lead.temperature)} />
        </div>
      )}
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2">
      <dt className="text-muted">{k}</dt>
      <dd>{v}</dd>
    </div>
  )
}
