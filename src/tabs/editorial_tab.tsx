import { useMemo, useState } from 'react'
import { IconCheck, IconEdit, IconInfo } from '../components/icons'
import { CLIENTS, SAMPLE_ARTICLE, type Network } from '../data/editorial'
import { fromIso, isoDate, type Post, type PostStatus } from '../lib/app_state'
import { decline } from '../lib/editorial'

const STATUS_STYLE: Record<PostStatus, string> = {
  Brouillon: 'bg-white text-ink border-[#8d9088] border-dashed',
  'À corriger': 'bg-warm-soft text-warm border-warm/40',
  Validé: 'bg-lime-soft text-ink border-olive/40',
}
const STATUS_MARK: Record<PostStatus, string> = { Brouillon: '○', 'À corriger': '!', Validé: '✓' }
const NET_ABBR: Record<Network, string> = { LinkedIn: 'in', X: 'X', Facebook: 'fb', Instagram: 'ig' }
const WEEKDAYS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.']

interface Props {
  posts: Post[]
  setPosts: (fn: (p: Post[]) => Post[]) => void
}

export function EditorialTab({ posts, setPosts }: Props) {
  const [clientId, setClientId] = useState(CLIENTS[0].id)
  const voice = CLIENTS.find((c) => c.id === clientId)!
  const [title, setTitle] = useState(SAMPLE_ARTICLE.title)
  const [body, setBody] = useState(SAMPLE_ARTICLE.body)
  const [today] = useState(() => new Date())
  const [startDate, setStartDate] = useState(isoDate(new Date(today.getFullYear(), today.getMonth(), Math.min(today.getDate() + 1, 25))))
  const [openId, setOpenId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState('')

  const declinations = useMemo(() => (title.trim() && body.trim() ? decline(title.trim(), body, voice) : []), [title, body, voice])
  const open = posts.find((p) => p.id === openId) ?? null

  const addToPlan = () => {
    const base = fromIso(startDate)
    const created: Post[] = declinations.map((d, i) => {
      const date = new Date(base)
      date.setDate(base.getDate() + i)
      return { id: `post-${Date.now()}-${i}`, clientId, network: d.network, date: isoDate(date), text: d.text, status: 'Brouillon' }
    })
    setPosts((p) => [...p, ...created])
    setNotice(`4 brouillons ajoutés au calendrier pour ${voice.name}, à partir du ${base.toLocaleDateString('fr-FR')}.`)
  }

  const setStatus = (id: string, status: PostStatus, extra: Partial<Post> = {}) =>
    setPosts((p) => p.map((x) => (x.id === id ? { ...x, status, ...extra } : x)))

  // Month grid (Monday first).
  const y = today.getFullYear()
  const m = today.getMonth()
  const first = new Date(y, m, 1)
  const offset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, i) => {
    const day = i - offset + 1
    return day >= 1 && day <= daysInMonth ? day : null
  })
  const monthLabel = first.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Piste 2 - plans éditoriaux pour plusieurs clients</p>
        <h1 className="text-3xl font-bold sm:text-4xl">Plan éditorial multi-clients</h1>
        <p className="mt-1 max-w-2xl text-ink-2">Un article se décline en publications pour quatre réseaux, dans la voix propre à chaque client. Tout passe ensuite par une validation humaine.</p>
      </div>

      <div className="banner" role="note">
        <IconCheck className="mt-0.5 shrink-0" />
        <p><strong>Rien ne part sans validation humaine.</strong> Chaque publication reste un brouillon tant qu’une personne ne l’a pas relue et validée.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="card space-y-3" aria-labelledby="voice-title">
          <div>
            <label htmlFor="client" className="label">Client (fictif)</label>
            <select id="client" className="field" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              {CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <h2 id="voice-title" className="flex items-center gap-2 text-xl font-bold">
            <span className="size-3 rounded-full" style={{ background: voice.color }} aria-hidden="true" /> Fiche de voix
          </h2>
          <dl className="space-y-2 text-sm">
            <VoiceRow k="Activité" v={voice.activity} />
            <VoiceRow k="Ton" v={voice.tone} />
            <VoiceRow k="À privilégier" v={voice.prefer.join(', ')} />
            <VoiceRow k="À bannir" v={Object.keys(voice.ban).join(', ')} />
            <VoiceRow k="Émojis" v={voice.emojis ? 'Oui, avec mesure' : 'Non'} />
            <VoiceRow k="Longueur" v={voice.length[0].toUpperCase() + voice.length.slice(1)} />
            <VoiceRow k="Appel à l’action" v={voice.cta} />
          </dl>
        </section>

        <section className="card space-y-3" aria-labelledby="article-title">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="article-title" className="text-xl font-bold">Article source</h2>
            <button type="button" className="btn-ghost" onClick={() => { setTitle(SAMPLE_ARTICLE.title); setBody(SAMPLE_ARTICLE.body) }}>Revenir à l’exemple</button>
          </div>
          <div>
            <label htmlFor="a-title" className="label">Titre</label>
            <input id="a-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label htmlFor="a-body" className="label">Texte (collez votre propre article)</label>
            <textarea id="a-body" className="field min-h-44" value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <p className="flex gap-2 text-xs text-muted"><IconInfo width={16} height={16} className="shrink-0" /> Déclinaison déterministe : phrases clés extraites par fréquence des mots et présence de chiffres, puis gabarits par réseau. Aucun modèle d’IA n’est appelé.</p>
        </section>
      </div>

      <section aria-labelledby="decl-title" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="decl-title" className="text-2xl font-bold">Déclinaisons pour {voice.name}</h2>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="start" className="label">Première publication le</label>
              <input id="start" type="date" className="field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <button type="button" className="btn-accent" onClick={addToPlan} disabled={declinations.length === 0 || !startDate}>Ajouter au calendrier</button>
          </div>
        </div>
        {notice && <p role="status" className="text-sm font-semibold text-olive">{notice}</p>}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {declinations.map((d) => (
            <article key={d.network} className="card">
              <header className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-bold">{d.network}</h3>
                <span className="text-xs text-muted tabular-nums">{d.chars} / {d.limit} caractères</span>
              </header>
              <p className="whitespace-pre-line text-sm leading-relaxed">{d.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card" aria-labelledby="cal-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="cal-title" className="text-2xl font-bold first-letter:uppercase">Calendrier - {monthLabel}</h2>
          <ul className="flex flex-wrap gap-3 text-xs" aria-label="Légende">
            {CLIENTS.map((c) => <li key={c.id} className="flex items-center gap-1"><span className="size-2.5 rounded-full" style={{ background: c.color }} aria-hidden="true" />{c.name}</li>)}
            {(Object.keys(STATUS_MARK) as PostStatus[]).map((s) => <li key={s}><span className={`rounded border px-1 ${STATUS_STYLE[s]}`}>{STATUS_MARK[s]} {s}</span></li>)}
          </ul>
        </div>

        <div className="mt-3 hidden grid-cols-7 gap-1 sm:grid" role="presentation">
          {WEEKDAYS.map((d) => <div key={d} className="px-1 text-xs font-semibold text-muted">{d}</div>)}
          {cells.map((day, i) => {
            const date = day ? isoDate(new Date(y, m, day)) : ''
            const items = day ? posts.filter((p) => p.date === date) : []
            return (
              <div key={i} className={`min-h-24 rounded-lg border p-1 ${day ? 'border-line bg-white' : 'border-transparent'} ${day === today.getDate() ? 'ring-2 ring-lime' : ''}`}>
                {day && <p className="px-1 text-xs text-muted">{day}</p>}
                <div className="space-y-1">
                  {items.map((p) => <PostChip key={p.id} post={p} onOpen={() => { setOpenId(p.id); setDraft(p.text) }} />)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Mobile: agenda list */}
        <ol className="mt-3 space-y-2 sm:hidden">
          {[...posts].filter((p) => p.date.startsWith(isoDate(first).slice(0, 7))).sort((a, b) => a.date.localeCompare(b.date)).map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-xs text-muted">{fromIso(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
              <PostChip post={p} onOpen={() => { setOpenId(p.id); setDraft(p.text) }} />
            </li>
          ))}
        </ol>

        {open && (
          <div className="mt-4 rounded-xl border border-ink/20 bg-paper p-4" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-bold">{CLIENTS.find((c) => c.id === open.clientId)?.name} - {open.network} - {fromIso(open.date).toLocaleDateString('fr-FR')}</h3>
              <span className={`rounded border px-2 py-0.5 text-sm font-semibold ${STATUS_STYLE[open.status]}`}>{STATUS_MARK[open.status]} {open.status}</span>
            </div>
            {open.note && <p className="mt-2 text-sm"><strong>Note de correction :</strong> {open.note}</p>}
            <label htmlFor="post-text" className="label mt-3">Texte de la publication</label>
            <textarea id="post-text" className="field min-h-40" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={() => setStatus(open.id, 'Validé', { text: draft, note: undefined })}><IconCheck /> Valider</button>
              <button type="button" className="btn-ghost" onClick={() => setStatus(open.id, 'À corriger', { text: draft, note: open.note ?? 'Relecture demandée.' })}><IconEdit /> Corriger</button>
              <button type="button" className="btn-ghost" onClick={() => setOpenId(null)}>Fermer</button>
            </div>
          </div>
        )}

        <p className="mt-4 flex gap-2 text-sm text-ink-2">
          <IconInfo className="mt-0.5 shrink-0" />
          En production, seules les publications validées seraient programmées automatiquement, par un workflow n8n relié à Metricool. Un brouillon ou une publication à corriger ne quitte jamais l’outil.
        </p>
      </section>
    </div>
  )
}

function VoiceRow({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-muted">{k}</dt>
      <dd>{v}</dd>
    </div>
  )
}

function PostChip({ post, onOpen }: { post: Post; onOpen: () => void }) {
  const client = CLIENTS.find((c) => c.id === post.clientId)!
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center gap-1 rounded border px-1 py-0.5 text-left text-[11px] leading-tight hover:border-ink ${STATUS_STYLE[post.status]}`}
      aria-label={`${client.name}, ${post.network}, ${post.status}`}
    >
      <span className="size-2 shrink-0 rounded-full" style={{ background: client.color }} aria-hidden="true" />
      <span className="font-semibold">{NET_ABBR[post.network]}</span>
      <span className="truncate">{client.name.split(' ')[0]}</span>
      <span className="ml-auto" aria-hidden="true">{STATUS_MARK[post.status]}</span>
    </button>
  )
}
