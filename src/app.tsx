import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { IconChart, IconChat, IconCalendar, IconForm, IconReset, IconShield } from './components/icons'
import { initialState, type AppState } from './lib/app_state'
import { clearState, loadState, saveState } from './lib/storage'
import { AssistantTab } from './tabs/assistant_tab'
import { DashboardTab } from './tabs/dashboard_tab'
import { EditorialTab } from './tabs/editorial_tab'
import { FormTab } from './tabs/form_tab'
import { GuardrailsTab } from './tabs/guardrails_tab'

const TABS = [
  { id: 'assistant', label: 'Assistant de stand', icon: IconChat },
  { id: 'dashboard', label: 'Tableau de bord du salon', icon: IconChart },
  { id: 'editorial', label: 'Plan éditorial multi-clients', icon: IconCalendar },
  { id: 'form', label: 'Formulaire qualifiant', icon: IconForm },
  { id: 'guardrails', label: 'Garde-fous et architecture', icon: IconShield },
] as const
type TabId = (typeof TABS)[number]['id']

function readHash(): TabId {
  const h = window.location.hash.slice(1)
  return (TABS.find((t) => t.id === h)?.id ?? 'assistant') as TabId
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState(initialState()))
  const [tab, setTab] = useState<TabId>(readHash)
  const [resetKey, setResetKey] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => saveState(state), [state])

  useEffect(() => {
    const onHash = () => setTab(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const select = (id: TabId, focus = false) => {
    setTab(id)
    history.replaceState(null, '', `#${id}`)
    if (focus) tabRefs.current[TABS.findIndex((t) => t.id === id)]?.focus()
  }

  const onTabKey = (e: KeyboardEvent, index: number) => {
    const last = TABS.length - 1
    const next =
      e.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null
    if (next === null) return
    e.preventDefault()
    select(TABS[next].id, true)
  }

  const reset = () => {
    if (!window.confirm('Réinitialiser la démo ? Les visiteurs créés et les modifications du plan éditorial seront effacés.')) return
    clearState()
    setState(initialState())
    setResetKey((k) => k + 1)
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2">
        Aller au contenu
      </a>
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 32 32" width="34" height="34" aria-hidden="true">
              <rect width="32" height="32" rx="6" fill="#2c2e2a" />
              <path d="M9 22V10h4v8h6v4z" fill="#bfd22b" />
              <circle cx="22" cy="12" r="3" fill="#bfd22b" />
            </svg>
            <p className="font-display text-xl font-bold leading-none sm:text-2xl">
              atelier-linkup <span className="text-lime">·</span> <span className="font-semibold text-[#d6d8d0]">démonstrateur</span>
            </p>
          </div>
          <button type="button" onClick={reset} className="btn border border-white/40 text-white hover:bg-white/10">
            <IconReset /> Réinitialiser la démo
          </button>
        </div>
        <nav className="mx-auto max-w-6xl px-2 sm:px-4" aria-label="Sections du démonstrateur">
          <div role="tablist" aria-label="Sections" className="-mb-px flex gap-1 overflow-x-auto">
            {TABS.map((t, i) => {
              const Icon = t.icon
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[i] = el
                  }}
                  role="tab"
                  type="button"
                  id={`tab-${t.id}`}
                  aria-selected={active}
                  aria-controls={`panel-${t.id}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => select(t.id)}
                  onKeyDown={(e) => onTabKey(e, i)}
                  className={`flex shrink-0 items-center gap-2 rounded-t-lg border-b-4 px-3 py-2.5 text-sm font-semibold whitespace-nowrap ${
                    active ? 'border-lime bg-paper text-ink' : 'border-transparent text-[#d6d8d0] hover:text-white'
                  }`}
                >
                  <Icon /> {t.label}
                </button>
              )
            })}
          </div>
        </nav>
      </header>

      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={-1} key={`${tab}-${resetKey}`}>
          {tab === 'assistant' && (
            <AssistantTab onLead={(v) => setState((s) => ({ ...s, visitors: [...s.visitors, v] }))}
              onHandOff={(id) => setState((s) => ({ ...s, visitors: s.visitors.map((v) => (v.id === id ? { ...v, handedOff: true } : v)) }))}
              visitors={state.visitors}
              onSeeDashboard={() => select('dashboard')}
            />
          )}
          {tab === 'dashboard' && (
            <DashboardTab
              visitors={state.visitors}
              onHandOff={(id) => setState((s) => ({ ...s, visitors: s.visitors.map((v) => (v.id === id ? { ...v, handedOff: true } : v)) }))}
            />
          )}
          {tab === 'editorial' && <EditorialTab posts={state.posts} setPosts={(fn) => setState((s) => ({ ...s, posts: fn(s.posts) }))} />}
          {tab === 'form' && <FormTab />}
          {tab === 'guardrails' && <GuardrailsTab />}
        </div>
      </main>

      <footer className="border-t border-line bg-white">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-sm text-muted">
          Démonstrateur réalisé par Arx Systema - données fictives - www.arx-systema.fr
        </p>
      </footer>
    </div>
  )
}
