import {
  Car, ChevronLeft, ChevronRight, Coffee, Dumbbell, Fuel, Gamepad2, Gift, Package, PartyPopper, Pill, Plane, Scissors, Shirt,
  ShoppingCart, Smartphone, Tv, UtensilsCrossed, X, type LucideIcon,
} from 'lucide-react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { Backend } from './store'
import type { Category, Learned, Recurring, Settings, Tx } from './types'
import { fmt } from './utils'

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

export const GROUP_LABEL = { necessita: 'Necessità', personale: 'Personale' } as const
export const GROUP_COLOR = { necessita: 'var(--needs)', personale: 'var(--personal)' } as const
export const METHOD_LABEL = { carta: 'Carta', bancomat: 'Carta', contanti: 'Contanti', buoni: 'Buoni pasto' } as const

const CAT_ICONS: Record<string, LucideIcon> = {
  alimentari: ShoppingCart, trasporti: Fuel, 'fondo-auto': Car, salute: Pill, telefono: Smartphone,
  ristoranti: UtensilsCrossed, bar: Coffee, fitness: Dumbbell, abbigliamento: Shirt, tecnologia: Gamepad2,
  svago: PartyPopper, abbonamenti: Tv, cura: Scissors, viaggi: Plane, regali: Gift, altro: Package,
}

/** Un colore diverso per ogni categoria, così si riconoscono a colpo d'occhio. */
const CAT_COLORS: Record<string, string> = {
  alimentari: '#34c77b', trasporti: '#f5a524', 'fondo-auto': '#a393ff', salute: '#ff6b8b', telefono: '#38bdf8',
  ristoranti: '#ff7a45', bar: '#d9a46c', fitness: '#a3e635', abbigliamento: '#f472b6', tecnologia: '#818cf8',
  svago: '#facc15', abbonamenti: '#f87171', cura: '#2dd4bf', viaggi: '#60a5fa', regali: '#e879f9', altro: '#a1a1aa',
}
export const catColor = (cat: Category) => CAT_COLORS[cat.id] ?? GROUP_COLOR[cat.group]

/** Icona della categoria (vettoriale per quelle predefinite, emoji per quelle create da te). */
export function CatIcon({ cat, size = 'md' }: { cat: Category; size?: 'sm' | 'md' }) {
  const I = CAT_ICONS[cat.id]
  const c = catColor(cat)
  return (
    <span className={`cat-icon ${size === 'sm' ? 'sm' : ''}`} style={{ background: `color-mix(in srgb, ${c} 17%, transparent)`, color: c }} aria-hidden="true">
      {I ? <I strokeWidth={2.1} /> : cat.icon}
    </span>
  )
}

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Numero che "scorre" fino al valore. */
export function useCountUp(value: number, ms = 900) {
  const [v, setV] = useState(value)
  const from = useRef(0)
  useEffect(() => {
    if (reduced()) { setV(value); return }
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms)
      const e = 1 - Math.pow(1 - k, 3)
      setV(a + (value - a) * e)
      if (k < 1) raf = requestAnimationFrame(tick)
      else from.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); from.current = value }
  }, [value, ms])
  return v
}

export function Money({ value, className, format = fmt }: { value: number; className?: string; format?: (n: number) => string }) {
  const v = useCountUp(value)
  return <span className={`tnum ${className ?? ''}`}>{format(v)}</span>
}

/** Anello di avanzamento animato. */
export function Ring({ value, max, color, label, sub }: { value: number; max: number; color: string; label: string; sub: string }) {
  const r = 50
  const c = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : value > 0 ? 1 : 0
  const [shown, setShown] = useState(0)
  useEffect(() => { const t = requestAnimationFrame(() => setShown(pct)); return () => cancelAnimationFrame(t) }, [pct])
  const over = max > 0 ? value / max : 0
  const stroke = over > 1 ? 'var(--critical)' : over >= 0.85 ? 'var(--warning)' : color
  return (
    <div className="ring" role="img" aria-label={`${label} ${sub}`}>
      <svg viewBox="0 0 120 120">
        <circle className="track" cx="60" cy="60" r={r} />
        <circle className="bar" cx="60" cy="60" r={r} stroke={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - shown)} />
      </svg>
      <div className="ring-label"><div><b>{label}</b><span>{sub}</span></div></div>
    </div>
  )
}

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
          <button className="icon-btn" onClick={onClose} aria-label="Chiudi"><X /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function PageHeader({ title, eyebrow, right }: { title: string; eyebrow?: string; right?: React.ReactNode }) {
  return (
    <div className="header">
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
      </div>
      {right}
    </div>
  )
}

export function PeriodNav({ label, onPrev, onNext, disableNext }: { label: string; onPrev: () => void; onNext: () => void; disableNext?: boolean }) {
  return (
    <div className="period-nav">
      <button onClick={onPrev} aria-label="Periodo precedente"><ChevronLeft /></button>
      {label && <span className="label">{label}</span>}
      <button onClick={onNext} aria-label="Periodo successivo" disabled={disableNext}><ChevronRight /></button>
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
  if (r > 1) return <span className="badge badge-crit">Sforato</span>
  if (r >= 0.85) return <span className="badge badge-warn">Quasi al limite</span>
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
