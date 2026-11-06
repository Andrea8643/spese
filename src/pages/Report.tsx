import { ChevronDown, ClipboardList } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AllocationBar, DailyBars } from '../charts'
import { summarizeMonth, summarizePeriod, type CatSummary } from '../finance'
import { ExportButtons } from '../ExportButtons'
import { Recap } from '../Recap'
import type { Group } from '../types'
import { CatIcon, catColor, GROUP_COLOR, GROUP_LABEL, Money, PeriodNav, useApp } from '../ui'
import { addDays, addMonths, currentMonth, daysInMonth, fmt, fmt0, monthLabel, todayISO, weekLabel, weekStart } from '../utils'

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
      <div className="header"><h1>Bilancio</h1></div>
      <div className="row between wrap" style={{ marginBottom: 14, gap: 10 }}>
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

      <div className="stack stagger" style={{ gap: 12 }} key={view + from}>
        <div className="hero">
          <div className="hero-label">Uscite {view === 'mese' ? 'del mese' : 'della settimana'}</div>
          <div className="hero-value"><Money value={p.totalExpense} /></div>
          {p.voucherExpense > 0 && <div className="small text2">di cui <b className="tnum">{fmt(p.voucherExpense)}</b> pagati con buoni pasto</div>}
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 16, position: 'relative' }}>
            <div>
              <div className="xs muted row gap-s"><span className="dot" style={{ background: 'var(--needs)' }} /> Necessità</div>
              <div className="bold tnum" style={{ fontSize: 18 }}>{fmt(p.byGroup.necessita)}</div>
            </div>
            <div>
              <div className="xs muted row gap-s"><span className="dot" style={{ background: 'var(--personal)' }} /> Personale</div>
              <div className="bold tnum" style={{ fontSize: 18 }}>{fmt(p.byGroup.personale)}</div>
            </div>
          </div>
        </div>

        {view === 'mese' && ms && (
          <div className="card">
            <div className="kv"><span>Entrate del mese</span><span className="pos">{fmt(p.income)}</span></div>
            <div className="kv"><span>Uscite in euro</span><span>−{fmt(p.euroExpense)}</span></div>
            <div className="kv total"><span>Saldo</span><span className={balance < 0 ? 'neg' : 'pos'}>{fmt(balance)}</span></div>
            <div className="kv"><span>{ms.closed ? 'Avanzato (Personale + Necessità)' : 'Ancora da spendere (Pers. + Nec.)'}</span><span className={ms.personalLeft + ms.needsLeft < 0 ? 'neg' : ''}>{fmt(ms.personalLeft + ms.needsLeft)}</span></div>
            <button className="btn btn-block" style={{ marginTop: 12 }} onClick={() => setRecap(true)}><ClipboardList /> Recap del mese</button>
            <div className="xs muted" style={{ margin: '14px 0 8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Scarica il resoconto di {monthLabel(month, false).toLowerCase()}</div>
            <ExportButtons month={month} />
          </div>
        )}

        {view === 'mese' && ms && (
          <div className="card">
            <div className="card-title">Ripartizione di {fmt0(ms.base)}{ms.incomeIsEstimate ? ' (stima)' : ''}</div>
            <AllocationBar parts={[
              { label: 'Risparmi', value: ms.savingsAlloc, color: 'var(--savings)' },
              { label: 'Necessità', value: ms.needsBudget, color: 'var(--needs)' },
              { label: 'Personale', value: ms.personalBudget, color: 'var(--personal)' },
            ]} />
          </div>
        )}

        <div className="card">
          <div className="card-title">Spese giorno per giorno</div>
          <DailyBars data={p.byDay} weekly={view === 'settimana'} />
        </div>

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
        <div className="card-title" style={{ margin: 0 }}><span className="dot" style={{ background: GROUP_COLOR[group] }} /> {GROUP_LABEL[group]}</div>
        <b className="tnum">{fmt(total)}</b>
      </div>
      {used.length === 0 && <div className="small muted">Nessuna spesa in questo periodo.</div>}
      <div className="stack" style={{ gap: 6 }}>
        {used.map((c) => (
          <details key={c.cat.id}>
            <summary style={{ cursor: 'pointer', padding: '6px 0' }}>
              <div className="row" style={{ gap: 12 }}>
                <CatIcon cat={c.cat} size="sm" />
                <div className="grow">
                  <div className="row between small" style={{ marginBottom: 6, gap: 8 }}>
                    <span className="ellipsis bold">{c.cat.name} <span className="xs muted">({c.count})</span></span>
                    <span className="tnum nowrap">
                      <b>{fmt(c.spentTotal)}</b>
                      {showBudget && c.budget > 0 && !c.cat.fund && <span className="muted"> / {fmt0(c.budget)}</span>}
                    </span>
                  </div>
                  <div className="progress" style={{ height: 6 }}>
                    <span style={{ width: `${(c.spentTotal / max) * 100}%`, background: catColor(c.cat) }} />
                  </div>
                </div>
                <ChevronDown size={16} className="muted" />
              </div>
            </summary>
            <div style={{ padding: '4px 0 8px 46px' }}>
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
