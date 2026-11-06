import { useMemo, useState } from 'react'
import { DailyBars } from '../charts'
import { summarizeMonth, summarizePeriod, type CatSummary } from '../finance'
import { Recap } from '../Recap'
import type { Group } from '../types'
import { GROUP_COLOR, GROUP_LABEL, PeriodNav, useApp } from '../ui'
import { addDays, addMonths, currentMonth, daysInMonth, fmt, monthLabel, todayISO, weekLabel, weekStart } from '../utils'

export function Report() {
  const { settings, txs } = useApp()
  const [view, setView] = useState<'mese' | 'settimana'>('mese')
  const [month, setMonth] = useState(currentMonth())
  const [week, setWeek] = useState(weekStart(todayISO()))
  const [recap, setRecap] = useState(false)

  const from = view === 'mese' ? `${month}-01` : week
  const to = view === 'mese' ? `${month}-${String(daysInMonth(month)).padStart(2, '0')}` : addDays(week, 6)
  const p = useMemo(() => summarizePeriod(settings, txs, from, to), [settings, txs, from, to])
  const ms = useMemo(() => (view === 'mese' ? summarizeMonth(settings, txs, month) : null), [settings, txs, month, view])
  const balance = p.income - p.euroExpense

  return (
    <>
      <div className="topbar wrap">
        <h1>Bilancio</h1>
        <div className="row wrap">
          <div className="seg">
            <button className={view === 'mese' ? 'on' : ''} onClick={() => setView('mese')}>Mese</button>
            <button className={view === 'settimana' ? 'on' : ''} onClick={() => setView('settimana')}>Settimana</button>
          </div>
          {view === 'mese' ? (
            <PeriodNav label={monthLabel(month)} onPrev={() => setMonth(addMonths(month, -1))} onNext={() => setMonth(addMonths(month, 1))} disableNext={month >= currentMonth()} />
          ) : (
            <PeriodNav label={weekLabel(week)} onPrev={() => setWeek(addDays(week, -7))} onNext={() => setWeek(addDays(week, 7))} disableNext={week >= weekStart(todayISO())} />
          )}
        </div>
      </div>

      <div className="grid grid-tiles">
        <div className="tile">
          <div className="tile-label">Entrate</div>
          <div className="tile-value tnum pos">{fmt(p.income)}</div>
        </div>
        <div className="tile">
          <div className="tile-label">Uscite totali</div>
          <div className="tile-value tnum">{fmt(p.totalExpense)}</div>
          {p.voucherExpense > 0 && <div className="tile-sub tnum">di cui {fmt(p.voucherExpense)} in buoni</div>}
        </div>
        <div className="tile">
          <div className="tile-label"><span className="dot" style={{ background: 'var(--needs)' }} /> Necessità</div>
          <div className="tile-value tnum">{fmt(p.byGroup.necessita)}</div>
        </div>
        <div className="tile">
          <div className="tile-label"><span className="dot" style={{ background: 'var(--personal)' }} /> Personale</div>
          <div className="tile-value tnum">{fmt(p.byGroup.personale)}</div>
        </div>
      </div>

      {view === 'mese' && ms && (
        <div className="card row wrap" style={{ marginTop: 14 }}>
          <div className="grow">
            <div className="small muted">Saldo del mese (entrate − uscite in euro)</div>
            <div className={`bold tnum ${balance < 0 ? 'neg' : 'pos'}`} style={{ fontSize: 22 }}>{fmt(balance)}</div>
          </div>
          <div className="grow">
            <div className="small muted">{ms.closed ? 'Andato nei risparmi' : 'Nei risparmi a fine mese (previsto)'}</div>
            <div className="bold tnum pos" style={{ fontSize: 22 }}>{fmt(ms.toSavings)}</div>
          </div>
          <button className="btn" onClick={() => setRecap(true)}>📋 Recap del mese</button>
        </div>
      )}

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-title">Spese giorno per giorno</div>
        <DailyBars data={p.byDay} weekly={view === 'settimana'} />
      </div>

      <div className="grid grid-2" style={{ marginTop: 14 }}>
        {(['personale', 'necessita'] as Group[]).map((g) => (
          <Breakdown key={g} group={g} cats={(ms ?? p).categories.filter((c) => c.cat.group === g)} total={p.byGroup[g]} showBudget={!!ms} />
        ))}
      </div>

      {recap && ms && <Recap month={month} onClose={() => setRecap(false)} />}
    </>
  )
}

function Breakdown({ group, cats, total, showBudget }: { group: Group; cats: CatSummary[]; total: number; showBudget: boolean }) {
  const used = cats.filter((c) => c.spentTotal > 0).sort((a, b) => b.spentTotal - a.spentTotal)
  const max = Math.max(1, ...used.map((c) => c.spentTotal))
  return (
    <div className="card">
      <div className="row between" style={{ marginBottom: 12 }}>
        <div className="card-title row gap-s" style={{ margin: 0 }}><span className="dot" style={{ background: GROUP_COLOR[group] }} /> {GROUP_LABEL[group]}</div>
        <b className="tnum">{fmt(total)}</b>
      </div>
      {used.length === 0 && <div className="small muted">Nessuna spesa in questo periodo.</div>}
      <div className="stack" style={{ gap: 4 }}>
        {used.map((c) => (
          <details key={c.cat.id}>
            <summary style={{ listStyle: 'none', cursor: 'pointer', padding: '6px 0' }}>
              <div className="row between small" style={{ marginBottom: 5 }}>
                <span className="row gap-s ellipsis"><span>{c.cat.icon}</span><span className="ellipsis">{c.cat.name}</span><span className="xs muted">({c.count})</span></span>
                <span className="tnum" style={{ whiteSpace: 'nowrap' }}>
                  <b>{fmt(c.spentTotal)}</b>
                  {showBudget && c.budget > 0 && !c.cat.fund && <span className="muted"> / {fmt(c.budget)}</span>}
                </span>
              </div>
              <div className="progress" style={{ height: 6 }}>
                <span style={{ width: `${(c.spentTotal / max) * 100}%`, background: GROUP_COLOR[group] }} />
              </div>
            </summary>
            <div style={{ padding: '6px 0 8px 26px' }}>
              {c.subs.filter((s) => s.spentTotal > 0).sort((a, b) => b.spentTotal - a.spentTotal).map((s) => (
                <div key={s.id} className="row between small" style={{ padding: '3px 0' }}>
                  <span className="text2">{s.name}</span>
                  <span className="tnum">{fmt(s.spentTotal)}{s.spentTotal > s.spentEuro && <span className="xs muted"> (🎟 {fmt(s.spentTotal - s.spentEuro)})</span>}</span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
