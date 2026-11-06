import { useMemo } from 'react'
import { computeBalances, summarizeMonth } from './finance'
import { TxRow } from './TxRow'
import { GROUP_COLOR, Progress, Sheet, useApp } from './ui'
import { fmt, monthLabel } from './utils'

/** Recap di fine mese: quanto hai speso, quanto avanza e dove va. */
export function Recap({ month, onClose }: { month: string; onClose: () => void }) {
  const { settings, txs } = useApp()
  const s = useMemo(() => summarizeMonth(settings, txs, month), [settings, txs, month])
  const b = useMemo(() => computeBalances(settings, txs), [settings, txs])
  const fundRow = b.fundRows.find((r) => r.month === month)
  const top = s.categories.filter((c) => c.spentTotal > 0).sort((a, b) => b.spentTotal - a.spentTotal).slice(0, 5)
  const verb = s.closed ? 'sono andati' : 'andranno'

  const Line = ({ label, value, strong, cls }: { label: string; value: number; strong?: boolean; cls?: string }) => (
    <div className="row between small" style={{ padding: '4px 0' }}>
      <span className={strong ? 'bold' : 'text2'}>{label}</span>
      <span className={`tnum ${strong ? 'bold' : ''} ${cls ?? ''}`}>{fmt(value)}</span>
    </div>
  )

  return (
    <Sheet title={`Recap di ${monthLabel(month)}`} onClose={onClose}>
      <div className="stack">
        <div className="hero" style={{ padding: 18 }}>
          <div className="hero-label">Questo mese hai speso in tutto</div>
          <div className="hero-value tnum" style={{ fontSize: 34 }}>{fmt(s.totalExpense)}</div>
          <div className="small text2">
            su {fmt(s.base)} di entrate{s.incomeIsEstimate ? ' (stimate)' : ''}
            {s.voucherSpent > 0 && <> · {s.vouchersUsed} buoni pasto usati ({fmt(s.voucherSpent)})</>}
          </div>
        </div>

        <div className="card">
          <div className="card-title row gap-s"><span className="dot" style={{ background: GROUP_COLOR.personale }} /> Personale</div>
          <div className="small" style={{ marginBottom: 8 }}>
            Avevi <b className="tnum">{fmt(s.personalBudget)}</b> da spendere per te, ne hai spesi <b className="tnum">{fmt(s.personalSpent)}</b>.
          </div>
          <Progress value={s.personalSpent} max={s.personalBudget} color="var(--personal)" />
          <div className="small" style={{ marginTop: 8 }}>
            {s.personalLeft >= 0
              ? <>✅ Ti sono avanzati <b className="pos tnum">{fmt(s.personalLeft)}</b> che {verb} nei risparmi.</>
              : <>⚠ Hai sforato di <b className="neg tnum">{fmt(-s.personalLeft)}</b>, tolti dai risparmi.</>}
          </div>
        </div>

        <div className="card">
          <div className="card-title row gap-s"><span className="dot" style={{ background: GROUP_COLOR.necessita }} /> Necessità</div>
          <div className="small" style={{ marginBottom: 8 }}>
            Budget necessità <b className="tnum">{fmt(s.needsBudget)}</b>: {fmt(s.fundQuota)} nel Fondo auto e <b className="tnum">{fmt(s.needsOperative)}</b> per le spese. Ne hai spesi <b className="tnum">{fmt(s.needsSpent)}</b>.
          </div>
          <Progress value={s.needsSpent} max={s.needsOperative} color="var(--needs)" />
          <div className="small" style={{ marginTop: 8 }}>
            {s.needsLeft >= 0
              ? <>✅ Avanzano <b className="pos tnum">{fmt(s.needsLeft)}</b> che {verb} nei risparmi.</>
              : <>⚠ Hai sforato di <b className="neg tnum">{fmt(-s.needsLeft)}</b>, tolti dai risparmi.</>}
          </div>
        </div>

        <div className="card">
          <div className="card-title">🚗 Fondo auto</div>
          <Line label="Quota del mese (resta nel fondo)" value={s.fundQuota} />
          <Line label="Spese auto pagate dal fondo" value={-s.fundSpent} />
          {fundRow && <Line label="Saldo del fondo" value={fundRow.balanceAfter} strong cls={fundRow.balanceAfter < 0 ? 'neg' : ''} />}
          {fundRow && fundRow.balanceAfter < 0 && <div className="xs muted" style={{ marginTop: 6 }}>Il fondo è in negativo: si ricostituisce con le quote dei prossimi mesi (o con un trasferimento dai risparmi).</div>}
        </div>

        <div className="card">
          <div className="card-title">💰 Risparmi del mese</div>
          <Line label={`Quota risparmio (${settings.allocation.savingsPct}%)`} value={s.savingsAlloc} />
          <Line label="Avanzo personale" value={s.personalLeft} cls={s.personalLeft < 0 ? 'neg' : ''} />
          <Line label="Avanzo necessità" value={s.needsLeft} cls={s.needsLeft < 0 ? 'neg' : ''} />
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6 }}>
            <Line label={`Totale che ${verb} nei risparmi`} value={s.toSavings} strong cls="pos" />
          </div>
          <div className="small text2" style={{ marginTop: 6 }}>Risparmi totali {s.closed ? 'accumulati' : 'previsti a fine mese'}: <b className="tnum">{fmt(s.closed ? b.savings : b.savingsProjected)}</b></div>
        </div>

        {top.length > 0 && (
          <div className="card">
            <div className="card-title">Dove sono andati i soldi</div>
            {top.map((c) => (
              <div key={c.cat.id} className="row between small" style={{ padding: '4px 0' }}>
                <span>{c.cat.icon} {c.cat.name} <span className="xs muted">({c.count})</span></span>
                <b className="tnum">{fmt(c.spentTotal)}</b>
              </div>
            ))}
          </div>
        )}

        <div className="card" style={{ paddingTop: 6, paddingBottom: 6 }}>
          <div className="card-title" style={{ marginTop: 10 }}>Tutte le spese ({s.expenses.length})</div>
          <div className="list">{s.expenses.map((t) => <TxRow key={t.id} tx={t} showDate />)}</div>
        </div>

        <button className="btn btn-primary btn-block" onClick={onClose}>Ok, chiudi</button>
      </div>
    </Sheet>
  )
}
