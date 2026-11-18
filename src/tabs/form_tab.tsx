import { useState, type FormEvent } from 'react'
import { IconInfo } from '../components/icons'
import { AGENCY_SECTORS, AGENCY_TIMELINES, BUDGETS, classify, NEEDS, type AgencyRequest, type AgencyResult } from '../lib/agency_form'

const EMPTY: AgencyRequest = {
  need: '',
  needDetail: '',
  sector: '',
  timeline: '',
  budget: '',
  firstName: '',
  lastName: '',
  company: '',
  email: '',
  phone: '',
  consent: false,
}

const STEPS = ['Besoin', 'Secteur et délai', 'Budget', 'Coordonnées'] as const

const CATEGORY_STYLE: Record<AgencyResult['category'], string> = {
  Prioritaire: 'bg-hot-soft text-hot border-hot/30',
  'À qualifier par téléphone': 'bg-warm-soft text-warm border-warm/30',
  Nurturing: 'bg-cold-soft text-cold border-cold/30',
}

export function FormTab() {
  const [data, setData] = useState<AgencyRequest>(EMPTY)
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AgencyResult | null>(null)
  const [reply, setReply] = useState('')
  const [copied, setCopied] = useState(false)

  const set = <K extends keyof AgencyRequest>(k: K, v: AgencyRequest[K]) => setData((d) => ({ ...d, [k]: v }))

  const validate = (): string => {
    if (step === 0 && !data.need) return 'Choisissez un besoin.'
    if (step === 1 && (!data.sector || !data.timeline)) return 'Indiquez votre secteur et votre délai.'
    if (step === 2 && !data.budget) return 'Choisissez une fourchette de budget, ou « Je ne sais pas encore ».'
    if (step === 3) {
      if (!data.firstName.trim() || !data.lastName.trim() || !data.company.trim()) return 'Renseignez votre prénom, votre nom et votre société.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return 'Saisissez une adresse électronique valide.'
      if (!data.consent) return 'Le consentement est nécessaire pour traiter votre demande.'
    }
    return ''
  }

  const next = (e: FormEvent) => {
    e.preventDefault()
    const msg = validate()
    setError(msg)
    if (msg) return
    if (step < STEPS.length - 1) {
      setStep(step + 1)
      return
    }
    const r = classify(data)
    setResult(r)
    setReply(r.reply)
  }

  const restart = () => {
    setData(EMPTY)
    setStep(0)
    setResult(null)
    setError('')
    setCopied(false)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reply)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Piste 3 - un vrai formulaire de contact qualifiant</p>
        <h1 className="text-3xl font-bold sm:text-4xl">Formulaire qualifiant</h1>
        <p className="mt-1 max-w-2xl text-ink-2">Pour le site d’une agence : quatre étapes courtes au lieu d’un champ « message » vide. L’équipe reçoit une fiche résumée, une catégorie et une réponse à relire.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card" aria-labelledby="form-title">
          <h2 id="form-title" className="sr-only">Formulaire de contact</h2>
          {!result ? (
            <form onSubmit={next} noValidate className="space-y-4">
              <ol className="flex gap-1" aria-label="Progression">
                {STEPS.map((s, i) => (
                  <li key={s} className="flex-1" aria-current={i === step ? 'step' : undefined}>
                    <div className={`h-1.5 rounded-full ${i <= step ? 'bg-ink' : 'bg-line'}`} />
                    <p className={`mt-1 hidden text-xs sm:block ${i === step ? 'font-semibold' : 'text-muted'}`}>{s}</p>
                  </li>
                ))}
              </ol>
              <p className="text-sm text-muted">Étape {step + 1} sur {STEPS.length} : {STEPS[step]}</p>

              {step === 0 && (
                <>
                  <Choice legend="Quel est votre besoin ?" name="need" options={NEEDS} value={data.need} onChange={(v) => set('need', v)} />
                  <div>
                    <label htmlFor="detail" className="label">Précisez en quelques mots (facultatif)</label>
                    <textarea id="detail" className="field min-h-24" value={data.needDetail} onChange={(e) => set('needDetail', e.target.value)} placeholder="Ex. : nous exposons en mars et voulons capter plus de contacts qualifiés." />
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <Choice legend="Votre secteur" name="sector" options={AGENCY_SECTORS} value={data.sector} onChange={(v) => set('sector', v)} />
                  <Choice legend="Votre délai" name="timeline" options={AGENCY_TIMELINES} value={data.timeline} onChange={(v) => set('timeline', v)} />
                </>
              )}
              {step === 2 && <Choice legend="Budget indicatif" name="budget" options={BUDGETS} value={data.budget} onChange={(v) => set('budget', v)} />}
              {step === 3 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {([
                    ['firstName', 'Prénom', 'given-name', 'text'],
                    ['lastName', 'Nom', 'family-name', 'text'],
                    ['company', 'Société', 'organization', 'text'],
                    ['email', 'Courriel professionnel', 'email', 'email'],
                    ['phone', 'Téléphone (facultatif)', 'tel', 'tel'],
                  ] as const).map(([k, label, ac, type]) => (
                    <div key={k} className={k === 'phone' ? 'sm:col-span-2' : ''}>
                      <label htmlFor={`f-${k}`} className="label">{label}</label>
                      <input id={`f-${k}`} type={type} autoComplete={ac} className="field" value={data[k]} onChange={(e) => set(k, e.target.value)} />
                    </div>
                  ))}
                  <label className="flex items-start gap-2 text-sm sm:col-span-2">
                    <input type="checkbox" className="mt-1 size-4 shrink-0 accent-[#1c1d1b]" checked={data.consent} onChange={(e) => set('consent', e.target.checked)} />
                    <span>J’accepte que l’agence traite ces informations pour répondre à ma demande. Conservation 3 ans au plus, sans prospection tierce. Je peux demander leur suppression à tout moment.</span>
                  </label>
                </div>
              )}

              {error && <p role="alert" className="text-sm font-semibold text-hot">{error}</p>}
              <div className="flex flex-wrap justify-between gap-2">
                <button type="button" className="btn-ghost" disabled={step === 0} onClick={() => { setError(''); setStep(step - 1) }}>Retour</button>
                <button type="submit" className="btn-primary">{step === STEPS.length - 1 ? 'Envoyer ma demande' : 'Continuer'}</button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p role="status" className="rounded-lg bg-lime-soft p-3 font-semibold">Côté visiteur : « Merci, votre demande a bien été reçue. Nous revenons vers vous rapidement. »</p>
              <button type="button" className="btn-ghost" onClick={restart}>Remplir un nouveau formulaire</button>
            </div>
          )}
        </section>

        <section className="card space-y-3" aria-labelledby="out-title" aria-live="polite">
          <h2 id="out-title" className="text-xl font-bold">Ce que reçoit l’agence</h2>
          {!result && <p className="text-muted">La fiche résumée apparaîtra ici à la fin du formulaire.</p>}
          {result && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-sm font-semibold ${CATEGORY_STYLE[result.category]}`}>{result.category}</span>
                <span className="text-sm text-muted">{result.points} points sur 6</span>
              </div>
              <ul className="space-y-1 text-sm">
                {result.summary.map((s) => <li key={s}>{s}</li>)}
              </ul>
              <div>
                <label htmlFor="reply" className="label">Réponse proposée - à relire avant envoi</label>
                <textarea id="reply" className="field min-h-56 text-sm" value={reply} onChange={(e) => { setReply(e.target.value); setCopied(false) }} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn-primary" onClick={copy}>Copier la réponse relue</button>
                {copied && <span role="status" className="text-sm text-olive">Copiée dans le presse-papiers.</span>}
              </div>
              <p className="flex gap-2 text-xs text-muted"><IconInfo width={16} height={16} className="shrink-0" /> Rien n’est envoyé automatiquement : la réponse part de la messagerie de l’agence, après relecture.</p>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function Choice({ legend, name, options, value, onChange }: { legend: string; name: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label key={o} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm ${value === o ? 'border-ink bg-lime-soft' : 'border-line bg-white hover:border-ink'}`}>
            <input type="radio" name={name} value={o} checked={value === o} onChange={() => onChange(o)} className="size-4 accent-[#1c1d1b]" />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
