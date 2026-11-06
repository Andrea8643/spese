import { useMemo } from 'react'
import { computeBalances, leftoverRef, summarizeMonth } from './finance'
import { ExportButtons } from './ExportButtons'
import { LeftoverActions } from './Leftovers'
import { TxRow } from './TxRow'
import type { Group } from './types'
import { GROUP_COLOR, GROUP_LABEL, Progress, Sheet, useApp } from './ui'
import { fmt, monthLabel } from './utils'

/** Recap di fine mese: quanto avevi, quanto hai speso, quanto ti resta da versare. */
export function Recap({ month, onClose }: { month: string; onClose: () => void }) {
  const { settings, txs } = useApp()
  const s = useMemo(() => summarizeMonth(settings, txs, month), [settings, txs, month])
  const b = useMemo(() => computeBalances(settings, txs), [settings, txs])
  const fundRow = b.fundRows.find((r) => r.month === month)
  const top = s.categories.filter((c) => c.spentTotal > 0).sort((a, b) => b.spentTotal - a.spentTotal).slice(0, 5)
  const name = monthLabel(month, false).toLowerCase()

  const Line = ({ label, value, strong, cls }: { label: string; value: number; strong?: boolean; cls?: string }) => (
    <div className="row between small" style={{ padding: '4px 0' }}>
      <span className={strong ? 'bold' : 'text2'}>{label}</span>
      <span className={`tnum ${strong ? 'bold' : ''} ${cls ?? ''}`}>{fmt(value)}</span>
    </div>
  )

  function GroupCard({ group }: { group: Group }) {
    const budget = group === 'personale' ? s.personalBudget : s.needsOperative
    const spent = group === 'personale' ? s.personalSpent : s.needsSpent
    const left = group === 'personale' ? s.personalLeft : s.needsLeft
    const ref = leftoverRef(month, group)
    const versed = txs.find((t) => t.ref === ref)
    const p = b.pending.find((x) => x.ref === ref)
    const dismissed = (settings.leftoverDismissed ?? []).includes(ref)
    return (
      <div className="card">
        <div className="card-title row gap-s"><span className="dot" style={{ background: GROUP_COLOR[group] }} /> {GROUP_LABEL[group]}</div>
        <div className="small" style={{ marginBottom: 8 }}>
          {group === 'personale'
            ? <>Come budget personale avevi <b className="tnum">{fmt(budget)}</b>. Ne hai usati <b className="tnum">{fmt(spent)}</b>.</>
            : <>Per le necessità avevi <b className="tnum">{fmt(budget)}</b> (più {fmt(s.fundQuota)} andati nel Fondo auto). Ne hai usati <b className="tnum">{fmt(spent)}</b>.</>}
        </div>
        <Progress value={spent} max={budget} color={GROUP_COLOR[group]} />
        <div className="small" style={{ margin: '10px 0' }}>
          {left >= 0
            ? <>Ti {s.closed ? 'sono rimasti' : 'restano per ora'} <b className="pos tnum">{fmt(left)}</b>{s.closed ? ': versali nei risparmi.' : '. A fine mese potrai versarli nei risparmi.'}</>
            : <>⚠ Hai sforato di <b className="neg tnum">{fmt(-left)}</b>.</>}
        </div>
        {versed && <div className="badge badge-ok">✓ {versed.type === 'saving_in' ? 'Versati' : 'Tolti dai risparmi'} {fmt(versed.amount)}</div>}
        {!versed && dismissed && <div className="badge badge-muted">Non versato</div>}
        {p && <LeftoverActions p={p} />}
      </div>
    )
  }

  return (
    <Sheet title={`Recap di ${monthLabel(month)}`} onClose={onClose}>
      <div className="stack">
        <div className="hero" style={{ padding: 18 }}>
          <div className="hero-label">{s.closed ? `A ${name} hai speso in tutto` : 'Finora questo mese hai speso'}</div>
          <div className="hero-value tnum" style={{ fontSize: 34 }}>{fmt(s.totalExpense)}</div>
          <div className="small text2">
            su {fmt(s.base)} di entrate{s.incomeIsEstimate ? ' (stimate)' : ''}
            {s.voucherSpent > 0 && <> · {s.vouchersUsed} buoni pasto usati ({fmt(s.voucherSpent)})</>}
          </div>
        </div>

        <div className="card">
          <div className="card-title">📥 Scarica il resoconto del mese</div>
          <ExportButtons month={month} />
          <div className="xs muted" style={{ marginTop: 8 }}>Tutte le uscite, il riepilogo del budget e il dettaglio per categoria.</div>
        </div>

        <GroupCard group="personale" />
        <GroupCard group="necessita" />

        <div className="card">
          <div className="card-title">💰 Risparmi</div>
          <Line label={`Quota risparmio (${settings.allocation.savingsPct}%), automatica`} value={s.savingsAlloc} />
          <div className="small text2" style={{ marginTop: 6 }}>Saldo risparmi attuale: <b className="tnum">{fmt(b.savings)}</b></div>
        </div>

        <div className="card">
          <div className="card-title">🚗 Fondo auto</div>
          <Line label="Quota del mese (resta nel fondo)" value={s.fundQuota} />
          <Line label="Spese auto pagate dal fondo" value={-s.fundSpent} />
          {fundRow && <Line label="Saldo del fondo" value={fundRow.balanceAfter} strong cls={fundRow.balanceAfter < 0 ? 'neg' : ''} />}
          {fundRow && fundRow.balanceAfter < 0 && <div className="xs muted" style={{ marginTop: 6 }}>Il fondo è in negativo: si ricostituisce con le quote dei prossimi mesi (o con un trasferimento dai risparmi).</div>}
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
