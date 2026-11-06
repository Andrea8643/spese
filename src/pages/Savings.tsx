import { useMemo, useState } from 'react'
import { SavingsLine } from '../charts'
import { catOf, computeBalances, summarizeMonth } from '../finance'
import { TxRow } from '../TxRow'
import type { TxType } from '../types'
import { Sheet, useApp } from '../ui'
import { currentMonth, fmt, fmt0, monthLabel, MONTHS, parseAmount, round2, todayISO, uid } from '../utils'

type Move = Extract<TxType, 'saving_in' | 'saving_out' | 'to_fund' | 'from_fund'>
const MOVE_LABEL: Record<Move, string> = {
  saving_in: 'Versa nei risparmi',
  saving_out: 'Preleva dai risparmi',
  to_fund: 'Risparmi → Fondo auto',
  from_fund: 'Fondo auto → Risparmi',
}

export function Savings() {
  const { settings, txs } = useApp()
  const b = useMemo(() => computeBalances(settings, txs), [settings, txs])
  const cur = useMemo(() => summarizeMonth(settings, txs, currentMonth()), [settings, txs])
  const [move, setMove] = useState<Move | null>(null)

  const points = useMemo(() => {
    const rows = [...b.savingsRows].reverse()
    const start = { label: 'Inizio', value: settings.initialSavings }
    return [start, ...rows.map((r) => ({ label: MONTHS[Number(r.month.slice(5)) - 1].slice(0, 3), value: r.balanceAfter, projected: !r.closed }))]
  }, [b.savingsRows, settings.initialSavings])

  const fundTx = txs.filter((t) => t.type === 'expense' && catOf(settings.categories, t.categoryId).fund).slice(0, 12)
  const moves = txs.filter((t) => ['saving_in', 'saving_out', 'to_fund', 'from_fund'].includes(t.type)).slice(0, 10)
  const voucherTx = txs.filter((t) => t.type === 'voucher_in' || (t.type === 'expense' && !!t.vouchers)).slice(0, 12)

  return (
    <>
      <div className="topbar"><h1>Risparmi & Fondi</h1></div>

      <div className="grid grid-2">
        <div className="hero">
          <div className="hero-label">💰 Risparmi accumulati</div>
          <div className="hero-value tnum">{fmt(b.savings)}</div>
          <div className="small text2">
            Questo mese entreranno sicuramente <b className="tnum pos">{fmt(cur.savingsAlloc)}</b> (quota {settings.allocation.savingsPct}%{cur.incomeIsEstimate ? ' sullo stipendio stimato' : ''})
            {cur.needsLeft + cur.personalLeft !== 0 && (
              <>, più quello che avanzerà di Necessità e Personale: oggi <b className="tnum">{fmt(cur.needsLeft + cur.personalLeft)}</b>, ma scende man mano che spendi</>
            )}.
            <div className="xs muted" style={{ marginTop: 6 }}>Massimo a fine {monthLabel(currentMonth(), false).toLowerCase()}, se non spendi più nulla: {fmt(b.savingsProjected)}</div>
          </div>
          <div className="row wrap" style={{ marginTop: 16 }}>
            <button className="btn btn-sm btn-primary" onClick={() => setMove('saving_in')}>+ Versa</button>
            <button className="btn btn-sm" onClick={() => setMove('saving_out')}>− Preleva</button>
            <button className="btn btn-sm" onClick={() => setMove('to_fund')}>→ Fondo auto</button>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Andamento</div>
          {points.length >= 2 ? <SavingsLine points={points} /> : <div className="small muted">Il grafico apparirà dal primo mese.</div>}
          <div className="xs muted" style={{ marginTop: 6 }}>Il punto vuoto è la previsione del mese in corso.</div>
        </div>
      </div>

      <h2 className="section-title">Mese per mese</h2>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr><th>Mese</th><th className="num">Quota</th><th className="num">Avanzo pers.</th><th className="num">Avanzo nec.</th><th className="num">Manuali</th><th className="num">Totale mese</th><th className="num">Saldo</th></tr>
          </thead>
          <tbody>
            {b.savingsRows.map((r) => (
              <tr key={r.month}>
                <td>{monthLabel(r.month)}{!r.closed && <span className="badge badge-muted" style={{ marginLeft: 6 }}>in corso</span>}</td>
                <td className="num">{fmt(r.quota)}</td>
                <td className={`num ${r.personalLeft < 0 ? 'neg' : ''}`}>{fmt(r.personalLeft)}</td>
                <td className={`num ${r.needsLeft < 0 ? 'neg' : ''}`}>{fmt(r.needsLeft)}</td>
                <td className="num">{r.manual ? fmt(r.manual) : '—'}</td>
                <td className="num bold pos">{fmt(r.total)}</td>
                <td className="num bold">{fmt(r.balanceAfter)}</td>
              </tr>
            ))}
            <tr><td className="muted">Saldo iniziale</td><td colSpan={5} /><td className="num">{fmt(settings.initialSavings)}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="row between">
            <div className="card-title" style={{ margin: 0 }}>🚗 Fondo auto (cumulativo)</div>
            <button className="btn btn-sm" onClick={() => setMove('from_fund')}>→ Risparmi</button>
          </div>
          <div className={`tile-value tnum ${b.fund < 0 ? 'neg' : ''}`} style={{ fontSize: 30, margin: '10px 0 2px' }}>{fmt(b.fund)}</div>
          <div className="small text2">Ogni mese entrano <b className="tnum">{fmt(cur.fundQuota)}</b> ({settings.allocation.catPct['fondo-auto'] ?? 0}% delle necessità). Assicurazione, bollo, revisione e tagliandi si pagano da qui.</div>
          {b.fund < 0 && <div className="small" style={{ color: 'var(--warning)', marginTop: 8 }}>⚠ Il fondo è sotto zero: si ricostituirà con le prossime quote. Se vuoi, copri la differenza con “→ Fondo auto” dai risparmi.</div>}
          <div className="list" style={{ marginTop: 10 }}>
            {fundTx.length ? fundTx.map((t) => <TxRow key={t.id} tx={t} showDate />) : <div className="small muted">Nessuna spesa auto ancora.</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-title">🎟️ Buoni pasto</div>
          <div className="tile-value tnum" style={{ fontSize: 30, margin: '4px 0 2px' }}>{b.vouchers} <span className="small muted">buoni</span></div>
          <div className="small text2">Valore residuo: <b className="tnum">{fmt(b.vouchersValue)}</b> ({fmt(settings.voucherValue)} l'uno)</div>
          <div className="list" style={{ marginTop: 10 }}>
            {voucherTx.length ? voucherTx.map((t) => <TxRow key={t.id} tx={t} showDate />) : <div className="small muted">Registra i buoni ricevuti con + → “Buoni ricevuti”.</div>}
          </div>
        </div>
      </div>

      {moves.length > 0 && (
        <>
          <h2 className="section-title">Movimenti manuali</h2>
          <div className="card" style={{ padding: '2px 14px' }}>
            <div className="list">{moves.map((t) => <MoveRow key={t.id} id={t.id}><TxRow tx={t} showDate /></MoveRow>)}</div>
          </div>
        </>
      )}

      {move && <MoveSheet kind={move} onClose={() => setMove(null)} />}
    </>
  )
}

function MoveRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { backend, toast } = useApp()
  return (
    <div className="row">
      <div className="grow">{children}</div>
      <button className="btn btn-ghost btn-sm" onClick={async () => { if (confirm('Eliminare questo movimento?')) { await backend.deleteTx(id); toast('Eliminato') } }} aria-label="Elimina">✕</button>
    </div>
  )
}

function MoveSheet({ kind, onClose }: { kind: Move; onClose: () => void }) {
  const { backend, toast } = useApp()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayISO())
  return (
    <Sheet title={MOVE_LABEL[kind]} onClose={onClose}>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault()
          const n = parseAmount(amount)
          if (!Number.isFinite(n) || n <= 0) return toast('Importo non valido')
          await backend.saveTxs([{ id: uid(), type: kind, amount: round2(n), date, description: note.trim() || MOVE_LABEL[kind], createdAt: Date.now() }])
          toast('Salvato ✓')
          onClose()
        }}
      >
        <div className="field"><label htmlFor="mv-amt">Importo</label><input id="mv-amt" autoFocus className="input input-amount tnum" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div className="field"><label htmlFor="mv-note">Nota</label><input id="mv-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="facoltativa" /></div>
        <div className="field"><label htmlFor="mv-date">Data</label><input id="mv-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <button className="btn btn-primary">Conferma</button>
      </form>
    </Sheet>
  )
}
