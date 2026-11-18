import { TEMPERATURE_LABELS } from '../lib/qualify'
import type { Temperature } from '../lib/types'

const STYLES: Record<Temperature, string> = {
  chaud: 'bg-hot-soft text-hot border-hot/30',
  tiede: 'bg-warm-soft text-warm border-warm/30',
  froid: 'bg-cold-soft text-cold border-cold/30',
}
const MARKS: Record<Temperature, string> = { chaud: '▲', tiede: '■', froid: '▼' }

/** Temperature is never shown by colour alone: symbol + label. */
export function TemperatureBadge({ value, score }: { value: Temperature; score?: number }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${STYLES[value]}`}>
      <span aria-hidden="true">{MARKS[value]}</span>
      {TEMPERATURE_LABELS[value]}
      {score !== undefined && <span className="font-normal">· {score}/10</span>}
    </span>
  )
}
