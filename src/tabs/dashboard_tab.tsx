import { useMemo, useState } from 'react'
import { IconDownload } from '../components/icons'
import { TemperatureBadge } from '../components/temperature_badge'
import { SHOW_DATE, SHOW_NAME } from '../data/seed_visitors'
import { findBrochure, findExhibitor, ROLE_LABELS, TIMELINE_LABELS } from '../lib/catalog'
import { downloadBlob, visitorsToCsv } from '../lib/csv'
import { TEMPERATURE_LABELS } from '../lib/qualify'
import type { Temperature, Visitor } from '../lib/types'
import { downloadBrochure } from '../lib/brochure_download'

const FILTERS: (Temperature | 'tous')[] = ['tous', 'chaud', 'tiede', 'froid']
const HOURS = Array.from({ length: 10 }, (_, i) => 9 + i) // 9h to 18h

function hourOf(v: Visitor): number {
  const h = new Date(v.createdAt).getHours()
  return Math.min(18, Math.max(9, h))
}

function formatTime(v: Visitor): string {
  const d = new Date(v.createdAt)
  const sameDay = v.createdAt.startsWith(SHOW_DATE)
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return sameDay ? time : `${d.toLocaleDateString('fr-FR')} ${time}`
}

interface Props {
  visitors: Visitor[]
  onHandOff: (id: string) => void
}

export function DashboardTab({ visitors, onHandOff }: Props) {
  const [filter, setFilter] = useState<Temperature | 'tous'>('tous')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const sorted = useMemo(() => [...visitors].sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt)), [visitors])
  const shown = filter === 'tous' ? sorted : sorted.filter((v) => v.temperature === filter)
  const selected = visitors.find((v) => v.id === selectedId) ?? null

  const counts = { chaud: 0, tiede: 0, froid: 0 } as Record<Temperature, number>
  for (const v of visitors) counts[v.temperature] += 1
  const docs = visitors.reduce((n, v) => n + v.brochures.length, 0)
  const handedOff = visitors.filter((v) => v.handedOff).length

  const topBrochures = useMemo(() => {
    const m = new Map<string, number>()
    for (const v of shown) for (const b of v.brochures) m.set(b, (m.get(b) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6)
  }, [shown])

  const perHour = useMemo(() => HOURS.map((h) => shown.filter((v) => hourOf(v) === h).length), [shown])

  const exportCsv = () => {
    downloadBlob(new Blob([visitorsToCsv(shown)], { type: 'text/csv;charset=utf-8' }), `visiteurs_${filter}_${SHOW_DATE}.csv`)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{SHOW_NAME} - {new Date(`${SHOW_DATE}T12:00:00`).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Tableau de bord du salon</h1>
          <p className="mt-1 max-w-2xl text-ink-2">Tous les contacts captés sur les trois stands fictifs, déjà qualifiés. Les visiteurs créés dans l’assistant s’ajoutent ici.</p>
        </div>
        <button type="button" className="btn-primary" onClick={exportCsv}>
          <IconDownload /> Exporter en CSV ({shown.length})
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Contacts captés" value={visitors.length} />
        <Kpi label="Contacts chauds" value={counts.chaud} />
        <Kpi label="Documents envoyés" value={docs} />
        <Kpi label="Transmis aux commerciaux" value={handedOff} />
      </dl>

      <div role="group" aria-label="Filtrer par température" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === 'tous' ? `Tous (${visitors.length})` : `${TEMPERATURE_LABELS[f]} (${counts[f]})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card" aria-labelledby="top-docs">
          <h2 id="top-docs" className="text-xl font-bold">Brochures les plus demandées</h2>
          <BarList rows={topBrochures.map(([id, n]) => ({ label: findBrochure(id)?.brochure.title ?? id, sub: findBrochure(id)?.exhibitor.short ?? '', value: n }))} />
        </section>
        <section className="card" aria-labelledby="per-hour">
          <h2 id="per-hour" className="text-xl font-bold">Contacts par heure</h2>
          <HourLine values={perHour} />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="card overflow-hidden p-0 sm:p-0" aria-labelledby="list-title">
          <h2 id="list-title" className="px-4 pt-4 text-xl font-bold">Visiteurs ({shown.length})</h2>
          <ul className="mt-2 divide-y divide-line">
            {shown.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  aria-current={selectedId === v.id}
                  className={`grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-2.5 text-left hover:bg-paper ${selectedId === v.id ? 'bg-lime-soft' : ''}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{v.firstName} {v.lastName} {v.source === 'assistant' && <span className="ml-1 rounded bg-ink px-1.5 py-0.5 text-[11px] font-semibold text-white">nouveau</span>}</span>
                    <span className="block truncate text-sm text-muted">{v.company} - {findExhibitor(v.exhibitorId)?.short} - {formatTime(v)}</span>
                  </span>
                  <TemperatureBadge value={v.temperature} score={v.score} />
                </button>
              </li>
            ))}
            {shown.length === 0 && <li className="px-4 py-6 text-muted">Aucun visiteur pour ce filtre.</li>}
          </ul>
        </section>

        <aside className="card self-start lg:sticky lg:top-4" aria-live="polite" aria-label="Fiche visiteur">
          {!selected && <p className="text-muted">Sélectionnez un visiteur pour afficher sa fiche et la chronologie des relances.</p>}
          {selected && <VisitorDetail v={selected} onHandOff={onHandOff} />}
        </aside>
      </div>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-display text-4xl font-bold">{value}</dd>
    </div>
  )
}

function BarList({ rows }: { rows: { label: string; sub: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (rows.length === 0) return <p className="mt-3 text-muted">Aucune donnée.</p>
  return (
    <ul className="mt-3 space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label} : ${r.value} demande${r.value > 1 ? 's' : ''}`}>
          <div className="flex justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{r.label} <span className="text-muted">- {r.sub}</span></span>
            <span className="font-semibold tabular-nums">{r.value}</span>
          </div>
          <div className="mt-1 h-2.5 rounded-full bg-paper" aria-hidden="true">
            <div className="h-2.5 rounded-full bg-ink" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function HourLine({ values }: { values: number[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 520
  const H = 200
  const pad = { l: 28, r: 12, t: 16, b: 28 }
  const max = Math.max(4, ...values)
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / (values.length - 1)
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b)
  const path = values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')
  const ticks = [0, Math.round(max / 2), max]
  const total = values.reduce((a, b) => a + b, 0)
  const peak = values.indexOf(Math.max(...values))

  return (
    <figure className="mt-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Courbe des contacts par heure, ${total} au total, pic à ${HOURS[peak]} h`} onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#e4e6df" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#5c5f58">{t}</text>
          </g>
        ))}
        {HOURS.map((h, i) => (
          <text key={h} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#5c5f58">{h} h</text>
        ))}
        <path d={`${path} L${x(values.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill="#bfd22b" opacity="0.25" />
        <path d={path} fill="none" stroke="#1c1d1b" strokeWidth="2" strokeLinejoin="round" />
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="#8d9088" strokeDasharray="3 3" />}
        {values.map((v, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r={hover === i ? 5 : 4} fill="#fff" stroke="#1c1d1b" strokeWidth="2" />
            <rect x={x(i) - 24} y={pad.t} width="48" height={H - pad.t - pad.b} fill="transparent" onMouseEnter={() => setHover(i)} />
          </g>
        ))}
        {hover !== null && (
          <g transform={`translate(${Math.min(Math.max(x(hover), 60), W - 60)},${Math.max(y(values[hover]) - 14, 14)})`} pointerEvents="none">
            <rect x="-52" y="-16" width="104" height="22" rx="4" fill="#1c1d1b" />
            <text x="0" y="0" textAnchor="middle" fontSize="12" fill="#fff">{HOURS[hover]} h : {values[hover]} contact{values[hover] > 1 ? 's' : ''}</text>
          </g>
        )}
      </svg>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-olive">Voir les données en tableau</summary>
        <table className="mt-2 w-full text-left">
          <thead><tr><th scope="col" className="py-1">Heure</th><th scope="col" className="py-1 text-right">Contacts</th></tr></thead>
          <tbody>
            {HOURS.map((h, i) => <tr key={h} className="border-t border-line"><td className="py-1">{h} h - {h + 1} h</td><td className="py-1 text-right tabular-nums">{values[i]}</td></tr>)}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

function VisitorDetail({ v, onHandOff }: { v: Visitor; onHandOff: (id: string) => void }) {
  const ex = findExhibitor(v.exhibitorId)!
  const base = new Date(v.createdAt)
  return (
    <div className="space-y-4 text-sm">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-bold">{v.firstName} {v.lastName}</h2>
          <TemperatureBadge value={v.temperature} score={v.score} />
        </div>
        <p className="text-muted">{v.company} - <span className="break-all">{v.email}</span></p>
      </div>
      <dl className="space-y-1.5">
        {[
          ['Stand', ex.name],
          ['Secteur', v.sector],
          ['Besoin', v.project || 'Non précisé'],
          ['Délai', TIMELINE_LABELS[v.timeline]],
          ['Rôle', ROLE_LABELS[v.role]],
          ['Questions', String(v.questions.length)],
          ['Consentement', v.consent ? 'Recueilli' : 'Absent'],
        ].map(([k, val]) => (
          <div key={k} className="grid grid-cols-[110px_1fr] gap-2"><dt className="text-muted">{k}</dt><dd>{val}</dd></div>
        ))}
      </dl>
      <div>
        <h3 className="text-lg font-bold">Documents envoyés</h3>
        <ul className="mt-1 space-y-1">
          {v.brochures.map((id) => (
            <li key={id}>
              <button type="button" className="inline-flex items-center gap-1 text-left text-olive underline underline-offset-2" onClick={() => downloadBrochure(ex, id)}>
                <IconDownload width={14} height={14} /> {findBrochure(id)?.brochure.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-lg font-bold">Chronologie des relances</h3>
        <ol className="mt-2 space-y-0 border-l-2 border-line pl-4">
          {v.followUps.map((f) => {
            const d = new Date(base)
            d.setDate(d.getDate() + f.day)
            return (
              <li key={`${f.day}-${f.label}`} className="relative pb-3">
                <span className={`absolute -left-[23px] top-1 size-3 rounded-full border-2 border-white ${f.status === 'envoyé' ? 'bg-ink' : f.status === 'programmé' ? 'bg-lime' : 'bg-[#b6b8b0]'}`} aria-hidden="true" />
                <p className="font-semibold">J+{f.day} - {f.label}</p>
                <p className="text-muted">{d.toLocaleDateString('fr-FR')} - {f.status}</p>
              </li>
            )
          })}
        </ol>
      </div>
      {v.handedOff ? (
        <p role="status" className="rounded-lg bg-lime-soft p-2 font-semibold">Fiche transmise à un commercial.</p>
      ) : (
        <button type="button" className="btn-primary w-full" onClick={() => onHandOff(v.id)}>Passer la main à un commercial</button>
      )}
    </div>
  )
}
