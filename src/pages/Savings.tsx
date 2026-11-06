import { useMemo, useState } from 'react'
import { SavingsLine } from '../charts'
import { catOf, computeBalances, summarizeMonth } from '../finance'
import { PendingLeftovers } from '../Leftovers'
import { ArrowDownToLine, ArrowUpFromLine, Car, Ticket } from 'lucide-react'
import { TxRow } from '../TxRow'
import type { TxType } from '../types'
import { Money, Sheet, useApp } from '../ui'
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
    return [start, ...rows.map((r) => ({ label: MONTHS[Number(r.month.slice(5)) - 1].slice(0, 3), value: r.closed ? r.balanceAfter : b.savingsSure, projected: !r.closed }))]
  }, [b.savingsRows, b.savingsSure, settings.initialSavings])

  const fundTx = txs.filter((t) => t.type === 'expense' && catOf(settings.categories, t.categoryId).fund).slice(0, 12)
  const moves = txs.filter((t) => ['saving_in', 'saving_out', 'to_fund', 'from_fund'].includes(t.type)).slice(0, 10)
  const voucherTx = txs.filter((t) => t.type === 'voucher_in' || (t.type === 'expense' && !!t.vouchers)).slice(0, 12)

  return (
    <>
      <div className="header"><h1>Risparmi</h1></div>

      <div className="stack stagger" style={{ gap: 12 }}>
        <div className="hero" style={{ background: 'radial-gradient(120% 120% at 100% 0%, rgba(31,176,124,.22), transparent 55%), linear-gradient(160deg, rgba(34,35,44,.9), rgba(18,19,25,.9))' }}>
          <div className="hero-label">Saldo risparmi</div>
          <div className="hero-value"><Money value={b.savings} /></div>
          <div className="small text2" style={{ position: 'relative' }}>
            A fine {monthLabel(currentMonth(), false).toLowerCase()} entra in automatico la quota del {settings.allocation.savingsPct}%: <b className="tnum pos">+{fmt(cur.savingsAlloc)}</b>{cur.incomeIsEstimate ? ' (su stima)' : ''}.
          </div>
          <div className="xs muted" style={{ marginTop: 6, position: 'relative' }}>
            Gli avanzi di Personale e Necessità li versi tu a fine mese (oggi ne restano {fmt(Math.max(0, cur.personalLeft) + Math.max(0, cur.needsLeft))}).
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16, position: 'relative' }}>
            <button className="btn btn-sm btn-green" onClick={() => setMove('saving_in')}><ArrowDownToLine /> Versa</button>
            <button className="btn btn-sm" onClick={() => setMove('saving_out')}><ArrowUpFromLine /> Preleva</button>
            <button className="btn btn-sm" onClick={() => setMove('to_fund')}><Car /> Fondo</button>
          </div>
        </div>

        <PendingLeftovers />

        {points.length >= 2 && (
          <div className="card">
            <div className="card-title">Andamento</div>
            <SavingsLine points={points} />
            <div className="xs muted" style={{ marginTop: 6 }}>Il punto vuoto è la previsione a fine mese.</div>
          </div>
        )}

        <div className="card">
          <div className="card-title">Mese per mese</div>
          {b.savingsRows.map((r) => (
            <div className="month-row" key={r.month}>
              <div className="row between">
                <span className="bold">{monthLabel(r.month)} {!r.closed && <span className="badge badge-muted" style={{ marginLeft: 4 }}>in corso</span>}</span>
                <span className="bold tnum">{fmt(r.closed ? r.balanceAfter : b.savingsSure)}</span>
              </div>
              <div className="chips" style={{ gap: 6 }}>
                <span className="badge badge-ok">Quota {r.closed ? '' : 'prevista '}{fmt0(r.quota)}</span>
                {r.versed !== 0 && <span className="badge badge-ok">Avanzi versati {fmt0(r.versed)}</span>}
                {r.manual !== 0 && <span className="badge badge-muted">Altri movimenti {fmt0(r.manual)}</span>}
                {!r.closed && <span className="badge badge-muted">Rimasti da spendere {fmt0(Math.max(0, r.personalLeft) + Math.max(0, r.needsLeft))}</span>}
              </div>
            </div>
          ))}
          <div className="kv" style={{ marginTop: 4 }}><span>Saldo iniziale</span><span>{fmt(settings.initialSavings)}</span></div>
        </div>

        <div className="card">
          <div className="row between" style={{ marginBottom: 6 }}>
            <div className="card-title" style={{ margin: 0 }}><Car size={15} /> Fondo auto</div>
            <button className="btn btn-sm" onClick={() => setMove('from_fund')}>→ Risparmi</button>
          </div>
          <div className={`hero-value ${b.fund < 0 ? 'neg' : ''}`} style={{ fontSize: 32 }}><Money value={b.fund} /></div>
          <div className="small text2">Ogni mese entrano <b className="tnum">{fmt(cur.fundQuota)}</b>. Assicurazione, bollo, revisione e tagliandi si pagano da qui.</div>
          {b.fund < 0 && <div className="small" style={{ color: 'var(--warning)', marginTop: 8 }}>Il fondo è sotto zero: si ricostituirà con le prossime quote, oppure copri la differenza con “Al fondo”.</div>}
          <div className="list" style={{ marginTop: 8 }}>
            {fundTx.length ? fundTx.map((t) => <TxRow key={t.id} tx={t} showDate />) : <div className="small muted">Nessuna spesa auto ancora.</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-title"><Ticket size={15} /> Buoni pasto</div>
          <div className="hero-value" style={{ fontSize: 32 }}>{b.vouchers} <span className="small muted">buoni</span></div>
          <div className="small text2">Valore residuo <b className="tnum">{fmt(b.vouchersValue)}</b> ({fmt(settings.voucherValue)} l'uno)</div>
          <div className="list" style={{ marginTop: 8 }}>
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
