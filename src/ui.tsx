import { createContext, useContext, useEffect, useState } from 'react'
import type { Backend } from './store'
import type { Learned, Recurring, Settings, Tx } from './types'
import { IChevL, IChevR, IX } from './icons'

export interface AppCtx {
  settings: Settings
  txs: Tx[]
  recurring: Recurring[]
  learned: Learned
  backend: Backend
  demo: boolean
  openAdd: (tx?: Partial<Tx>) => void
  toast: (msg: string) => void
  go: (page: Page) => void
}
export type Page = 'home' | 'movimenti' | 'bilancio' | 'risparmi' | 'impostazioni'

export const Ctx = createContext<AppCtx | null>(null)
export const useApp = () => useContext(Ctx)!

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', k)
      document.body.style.overflow = ''
    }
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Chiudi">
            <IX />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function PeriodNav({ label, onPrev, onNext, disableNext }: { label: string; onPrev: () => void; onNext: () => void; disableNext?: boolean }) {
  return (
    <div className="period-nav">
      <button className="icon-btn" onClick={onPrev} aria-label="Periodo precedente">
        <IChevL />
      </button>
      <span className="label">{label}</span>
      <button className="icon-btn" onClick={onNext} aria-label="Periodo successivo" disabled={disableNext} style={disableNext ? { opacity: 0.35 } : undefined}>
        <IChevR />
      </button>
    </div>
  )
}

export function Progress({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : value > 0 ? 100 : 0
  const over = max > 0 ? value / max : value > 0 ? 2 : 0
  const c = over > 1 ? 'var(--critical)' : over >= 0.85 ? 'var(--warning)' : color
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${pct}%`, background: c }} />
    </div>
  )
}

export function BudgetBadge({ spent, budget }: { spent: number; budget: number }) {
  if (budget <= 0) return null
  const r = spent / budget
  if (r > 1) return <span className="badge badge-crit">⚠ Sforato</span>
  if (r >= 0.85) return <span className="badge badge-warn">⚠ Quasi al limite</span>
  return null
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 2600)
    return () => clearTimeout(t)
  }, [msg])
  return { msg, show: setMsg }
}

export const GROUP_LABEL = { necessita: 'Necessità', personale: 'Personale' } as const
export const GROUP_COLOR = { necessita: 'var(--needs)', personale: 'var(--personal)' } as const
export const METHOD_LABEL = { carta: 'Carta', bancomat: 'Carta', contanti: 'Contanti', buoni: 'Buoni pasto' } as const
