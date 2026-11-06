import { useMemo, useState } from 'react'
import { catOf } from '../finance'
import { Search } from 'lucide-react'
import { TxRow } from '../TxRow'
import type { Tx } from '../types'
import { PeriodNav, useApp } from '../ui'
import { addMonths, currentMonth, dayLabel, fmt, monthLabel, normalize } from '../utils'

type Filter = 'tutti' | 'spese' | 'necessita' | 'personale' | 'entrate' | 'buoni'
const FILTERS: [Filter, string][] = [
  ['tutti', 'Tutti'], ['spese', 'Spese'], ['necessita', 'Necessità'], ['personale', 'Personale'], ['entrate', 'Entrate'], ['buoni', 'Buoni pasto'],
]

export function Movements() {
  const { settings, txs } = useApp()
  const [month, setMonth] = useState(currentMonth())
  const [filter, setFilter] = useState<Filter>('tutti')
  const [q, setQ] = useState('')
  const [catId, setCatId] = useState('')

  const list = useMemo(() => {
    const nq = normalize(q)
    return txs.filter((t) => {
      if (!nq && !t.date.startsWith(month)) return false
      if (nq && !normalize(t.description).includes(nq)) return false
      const cat = t.type === 'expense' ? catOf(settings.categories, t.categoryId) : null
      if (catId && cat?.id !== catId) return false
      switch (filter) {
        case 'spese': return t.type === 'expense'
        case 'necessita': return cat?.group === 'necessita'
        case 'personale': return cat?.group === 'personale'
        case 'entrate': return t.type === 'income'
        case 'buoni': return t.type === 'voucher_in' || (t.type === 'expense' && !!t.vouchers)
        default: return true
      }
    })
  }, [txs, month, filter, q, catId, settings.categories])

  const byDay = useMemo(() => {
    const m = new Map<string, Tx[]>()
    list.forEach((t) => m.set(t.date, [...(m.get(t.date) ?? []), t]))
    return [...m.entries()]
  }, [list])

  const total = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <>
      <div className="header">
        <h1>Movimenti</h1>
        {!q && <PeriodNav label={monthLabel(month)} onPrev={() => setMonth(addMonths(month, -1))} onNext={() => setMonth(addMonths(month, 1))} disableNext={month >= currentMonth()} />}
      </div>
      <div className="stack" style={{ marginBottom: 6 }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: 13, width: 18, height: 18, color: 'var(--muted)' }}><Search size={18} /></span>
          <input className="input" style={{ paddingLeft: 40 }} placeholder="Cerca in tutti i movimenti (es. kebab)…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="chips scroll">
          {FILTERS.map(([f, l]) => (
            <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{l}</button>
          ))}
          <select className="input" style={{ width: 'auto', flexShrink: 0, minHeight: 40, padding: '6px 12px', fontSize: 13.5, borderRadius: 99 }} value={catId} onChange={(e) => setCatId(e.target.value)} aria-label="Filtra per categoria">
            <option value="">Tutte le categorie</option>
            {settings.categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <div className="small muted">{list.length} movimenti · spese totali <b className="tnum" style={{ color: 'var(--text)' }}>{fmt(total)}</b></div>
      </div>
      {byDay.length === 0 && <div className="empty"><div className="big">🔍</div>Nessun movimento trovato.</div>}
      <div className="stagger">
      {byDay.map(([day, items]) => {
        const dayTotal = items.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        return (
          <div key={day}>
            <div className="day-head"><span>{dayLabel(day)}{q && ` ${day.slice(0, 4)}`}</span>{dayTotal > 0 && <span className="tnum">−{fmt(dayTotal)}</span>}</div>
            <div className="card" style={{ padding: '4px 14px' }}>
              <div className="list">{items.map((t) => <TxRow key={t.id} tx={t} />)}</div>
            </div>
          </div>
        )
      })}
      </div>
    </>
  )
}
