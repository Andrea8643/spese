import { useEffect, useMemo, useRef, useState } from 'react'
import { learnKey, suggestCategory } from './categorize'
import { catOf, computeBalances } from './finance'
import { ISpark, ITrash } from './icons'
import type { PayMethod, Recurring, Tx } from './types'
import { GROUP_LABEL, METHOD_LABEL, Sheet, useApp } from './ui'
import { addDays, fmt, parseAmount, parseISO, round2, todayISO, uid } from './utils'

type Mode = 'expense' | 'income' | 'voucher_in'

export function AddTx({ initial, onClose }: { initial?: Partial<Tx>; onClose: () => void }) {
  const { settings, learned, backend, toast, txs, recurring } = useApp()
  const editing = !!initial?.id
  const [mode, setMode] = useState<Mode>((initial?.type as Mode) && ['expense', 'income', 'voucher_in'].includes(initial!.type!) ? (initial!.type as Mode) : 'expense')
  const [desc, setDesc] = useState(initial?.description ?? '')
  const [amountStr, setAmountStr] = useState(initial?.amount ? String(initial.amount).replace('.', ',') : '')
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [catSel, setCatSel] = useState(initial?.categoryId ? `${initial.categoryId}|${initial.subId ?? ''}` : '')
  const [manualCat, setManualCat] = useState(editing)
  const [payKind, setPayKind] = useState<'euro' | 'buoni'>(initial?.vouchers ? 'buoni' : 'euro')
  const [euroMethod, setEuroMethod] = useState<Exclude<PayMethod, 'buoni'>>(
    initial?.method && initial.method !== 'buoni' ? initial.method : 'carta',
  )
  const [vouchers, setVouchers] = useState<number>(initial?.vouchers ?? 1)
  const [vouchersTouched, setVouchersTouched] = useState(editing)
  const [source, setSource] = useState(initial?.incomeSource ?? settings.incomeSources[0] ?? 'Stipendio')
  const [voucherIn, setVoucherIn] = useState(initial?.type === 'voucher_in' ? initial.vouchers ?? 20 : 20)
  const [voucherValue, setVoucherValue] = useState(String(initial?.voucherValue ?? settings.voucherValue).replace('.', ','))
  const [repeat, setRepeat] = useState(false)
  const [saving, setSaving] = useState(false)
  const descRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setTimeout(() => descRef.current?.focus(), 250)
  }, [editing])

  const vValue = settings.voucherValue
  const balances = useMemo(() => computeBalances(settings, txs), [settings, txs])
  const vouchersAvailable = balances.vouchers + (editing ? initial?.vouchers ?? 0 : 0)

  // importo scritto in fondo alla descrizione ("burger king 12,50")
  const trailing = desc.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur|euro)?\s*$/i)
  const amount = amountStr ? parseAmount(amountStr) : trailing ? parseAmount(trailing[1]) : NaN
  const cleanDesc = (amountStr || !trailing ? desc : desc.slice(0, trailing.index)).trim()

  const suggestion = useMemo(() => suggestCategory(cleanDesc, settings.categories, learned), [cleanDesc, settings.categories, learned])
  useEffect(() => {
    if (mode === 'expense' && !manualCat) setCatSel(suggestion ? `${suggestion.categoryId}|${suggestion.subId}` : '')
  }, [suggestion, manualCat, mode])

  // numero di buoni proposto: un buono ogni 8 € (gli spiccioli si pagano in euro)
  useEffect(() => {
    if (payKind !== 'buoni' || vouchersTouched || !Number.isFinite(amount)) return
    const n = Math.max(1, Math.floor(round2(amount) / vValue))
    setVouchers(Math.max(1, Math.min(n, Math.max(1, vouchersAvailable))))
  }, [amount, payKind, vouchersTouched, vValue, vouchersAvailable])

  const [catId, subId] = catSel.split('|')
  const cat = catSel ? catOf(settings.categories, catId) : null
  const voucherCover = payKind === 'buoni' && Number.isFinite(amount) ? Math.min(amount, vouchers * vValue) : 0
  const euroRest = Number.isFinite(amount) ? round2(Math.max(0, amount - voucherCover)) : 0
  const wasted = payKind === 'buoni' && Number.isFinite(amount) ? round2(Math.max(0, vouchers * vValue - amount)) : 0

  async function save() {
    if (saving) return
    let tx: Tx
    const id = initial?.id ?? uid()
    const base = { id, date, createdAt: initial?.createdAt ?? Date.now(), recurringId: initial?.recurringId }
    if (mode === 'expense') {
      if (!Number.isFinite(amount) || amount <= 0) return toast('Inserisci un importo valido')
      if (!cleanDesc) return toast('Scrivi cosa hai comprato')
      if (!catSel) return toast('Scegli una categoria')
      tx = {
        ...base, type: 'expense', description: cleanDesc, amount: round2(amount), categoryId: catId, subId,
        method: payKind === 'buoni' ? (euroRest > 0 ? euroMethod : 'buoni') : euroMethod,
        vouchers: payKind === 'buoni' ? vouchers : undefined,
        voucherValue: payKind === 'buoni' ? vValue : undefined,
      }
      // impara la categoria per la prossima volta
      const key = learnKey(cleanDesc)
      if (key && (manualCat || !suggestion || suggestion.source === 'learned') && (learned[key]?.c !== catId || learned[key]?.s !== subId)) {
        void backend.saveLearned({ ...learned, [key]: { c: catId, s: subId } })
      }
    } else if (mode === 'income') {
      if (!Number.isFinite(amount) || amount <= 0) return toast('Inserisci un importo valido')
      tx = { ...base, type: 'income', description: cleanDesc || source, amount: round2(amount), incomeSource: source }
    } else {
      const v = parseAmount(voucherValue)
      if (!voucherIn || voucherIn <= 0 || !Number.isFinite(v)) return toast('Controlla numero e valore dei buoni')
      tx = { ...base, type: 'voucher_in', description: desc.trim() || 'Buoni pasto Edenred', amount: round2(voucherIn * v), vouchers: voucherIn, voucherValue: v }
    }
    setSaving(true)
    try {
      await backend.saveTxs([tx])
      if (repeat && !editing && (mode === 'expense' || mode === 'income')) {
        const r: Recurring = {
          id: uid(), type: mode, description: tx.description, amount: tx.amount, categoryId: tx.categoryId, subId: tx.subId,
          method: tx.method === 'buoni' ? 'carta' : tx.method, incomeSource: tx.incomeSource, frequency: 'monthly',
          day: Math.min(28, parseISO(date).getDate()), startDate: addDays(date, 1), active: true,
        }
        await backend.saveRecurring(r)
      }
      toast(editing ? 'Modificato ✓' : mode === 'expense' ? `Spesa salvata in ${cat?.name ?? ''} ✓` : 'Salvato ✓')
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!initial?.id || !confirm('Eliminare questo movimento?')) return
    await backend.deleteTx(initial.id)
    if (initial.recurringId) {
      const r = recurring.find((x) => x.id === initial.recurringId)
      if (r) await backend.saveRecurring({ ...r, skip: [...(r.skip ?? []), initial.id] })
    }
    toast('Eliminato')
    onClose()
  }

  const necessita = settings.categories.filter((c) => c.group === 'necessita')
  const personale = settings.categories.filter((c) => c.group === 'personale')

  return (
    <Sheet title={editing ? 'Modifica movimento' : 'Nuovo movimento'} onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        {!editing && (
          <div className="seg full">
            <button type="button" className={mode === 'expense' ? 'on' : ''} onClick={() => setMode('expense')}>Spesa</button>
            <button type="button" className={mode === 'income' ? 'on' : ''} onClick={() => setMode('income')}>Entrata</button>
            <button type="button" className={mode === 'voucher_in' ? 'on' : ''} onClick={() => setMode('voucher_in')}>Buoni ricevuti</button>
          </div>
        )}

        {mode === 'expense' && (
          <>
            <div className="field">
              <label htmlFor="desc">Cosa hai comprato?</label>
              <input id="desc" ref={descRef} className="input" placeholder="es. Burger King, Conad, Coca Zero macchinetta…" value={desc} onChange={(e) => setDesc(e.target.value)} autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor="amt">Importo totale</label>
              <input id="amt" className="input input-amount tnum" inputMode="decimal" placeholder={trailing ? trailing[1] : '0,00'} value={amountStr} onChange={(e) => setAmountStr(e.target.value)} />
            </div>

            {suggestion && !manualCat && cat && (
              <div className="suggest">
                <ISpark />
                <span className="grow">
                  Riconosciuto: <b>{GROUP_LABEL[cat.group]} › {cat.name}</b>
                  {subId && <> › {cat.subs.find((s) => s.id === subId)?.name}</>}
                </span>
              </div>
            )}
            <div className="field">
              <label htmlFor="cat">Categoria</label>
              <select id="cat" className="input" value={catSel} onChange={(e) => { setCatSel(e.target.value); setManualCat(true) }}>
                <option value="">— scegli —</option>
                {[['🛒 Necessità', necessita], ['🎯 Personale', personale]].map(([label, list]) => (
                  <optgroup key={label as string} label={label as string}>
                    {(list as typeof necessita).flatMap((c) =>
                      c.subs.map((s) => (
                        <option key={`${c.id}|${s.id}`} value={`${c.id}|${s.id}`}>
                          {c.icon} {c.name} › {s.name}
                        </option>
                      )),
                    )}
                  </optgroup>
                ))}
              </select>
              {cat?.fund && <span className="xs muted">🚗 Questa spesa viene pagata dal Fondo auto, non dal budget del mese.</span>}
            </div>

            <div className="field">
              <label>Come hai pagato?</label>
              <div className="chips">
                {(['carta', 'bancomat', 'contanti'] as const).map((m) => (
                  <button type="button" key={m} className={`chip ${payKind === 'euro' && euroMethod === m ? 'on' : ''}`} onClick={() => { setPayKind('euro'); setEuroMethod(m) }}>
                    {METHOD_LABEL[m]}
                  </button>
                ))}
                <button type="button" className={`chip ${payKind === 'buoni' ? 'on' : ''}`} onClick={() => setPayKind('buoni')}>
                  🎟️ Buoni pasto
                </button>
              </div>
            </div>

            {payKind === 'buoni' && (
              <div className="split">
                <div className="row between">
                  <div>
                    <div className="bold">Buoni usati</div>
                    <div className="xs muted">{vValue.toLocaleString('it-IT')} € l'uno · disponibili: {vouchersAvailable}</div>
                  </div>
                  <div className="stepper">
                    <button type="button" onClick={() => { setVouchersTouched(true); setVouchers((v) => Math.max(1, v - 1)) }} aria-label="Meno buoni">−</button>
                    <span className="val tnum">{vouchers}</span>
                    <button type="button" onClick={() => { setVouchersTouched(true); setVouchers((v) => v + 1) }} aria-label="Più buoni">+</button>
                  </div>
                </div>
                <div className="row between small">
                  <span className="text2">Pagato con buoni</span>
                  <span className="tnum bold">{fmt(voucherCover)}</span>
                </div>
                <div className="row between small">
                  <span className="text2">Resto pagato in euro</span>
                  <span className="tnum bold">{fmt(euroRest)}</span>
                </div>
                {euroRest > 0 && (
                  <div className="chips">
                    {(['bancomat', 'carta', 'contanti'] as const).map((m) => (
                      <button type="button" key={m} className={`chip ${euroMethod === m ? 'on' : ''}`} onClick={() => setEuroMethod(m)}>
                        {METHOD_LABEL[m]}
                      </button>
                    ))}
                  </div>
                )}
                {euroRest === 0 && Number.isFinite(amount) && <span className="xs pos">✓ Pagato interamente con i buoni</span>}
                {wasted > 0 && <span className="xs" style={{ color: 'var(--warning)' }}>⚠ Il buono vale più della spesa: {fmt(wasted)} non utilizzati.</span>}
                {vouchers > vouchersAvailable && <span className="xs neg">⚠ Stai usando più buoni di quelli che risultano disponibili.</span>}
                <span className="xs muted">Al budget in euro conta solo il resto ({fmt(euroRest)}); i buoni scalano dal saldo buoni.</span>
              </div>
            )}
          </>
        )}

        {mode === 'income' && (
          <>
            <div className="field">
              <label>Tipo di entrata</label>
              <div className="chips">
                {settings.incomeSources.map((s) => (
                  <button type="button" key={s} className={`chip ${source === s ? 'on' : ''}`} onClick={() => setSource(s)}>{s}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label htmlFor="amt">Importo</label>
              <input id="amt" className="input input-amount tnum" inputMode="decimal" placeholder="0,00" value={amountStr} onChange={(e) => setAmountStr(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="desc">Nota (facoltativa)</label>
              <input id="desc" ref={descRef} className="input" placeholder="es. Stipendio ottobre" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <span className="xs muted">Il budget del mese viene calcolato sulle entrate registrate nel mese: {settings.allocation.savingsPct}% risparmi, {settings.allocation.needsPct}% necessità, {settings.allocation.personalPct}% personale.</span>
          </>
        )}

        {mode === 'voucher_in' && (
          <>
            <div className="split">
              <div className="row between">
                <div className="bold">Quanti buoni hai ricevuto?</div>
                <div className="stepper">
                  <button type="button" onClick={() => setVoucherIn((v) => Math.max(1, v - 1))} aria-label="Meno">−</button>
                  <input className="input tnum center" style={{ width: 70, minHeight: 40, padding: 6 }} inputMode="numeric" value={voucherIn} onChange={(e) => setVoucherIn(Math.max(0, parseInt(e.target.value) || 0))} aria-label="Numero buoni" />
                  <button type="button" onClick={() => setVoucherIn((v) => v + 1)} aria-label="Più">+</button>
                </div>
              </div>
              <div className="row between">
                <span className="text2">Valore di un buono (€)</span>
                <input className="input tnum center" style={{ width: 90, minHeight: 40 }} inputMode="decimal" value={voucherValue} onChange={(e) => setVoucherValue(e.target.value)} aria-label="Valore buono" />
              </div>
              <div className="row between">
                <span className="text2">Totale</span>
                <span className="bold tnum">{fmt(voucherIn * (parseAmount(voucherValue) || 0))}</span>
              </div>
            </div>
            <div className="field">
              <label htmlFor="desc">Nota</label>
              <input id="desc" className="input" placeholder="Buoni pasto Edenred" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
          </>
        )}

        <div className="field">
          <label htmlFor="date">Data</label>
          <input id="date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        {!editing && mode !== 'voucher_in' && (
          <label className="row small text2" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#d4b46a' }} />
            Ripeti ogni mese (spesa/entrata ricorrente)
          </label>
        )}

        <div className="row" style={{ marginTop: 4 }}>
          {editing && (
            <button type="button" className="btn btn-danger" onClick={remove} aria-label="Elimina">
              <ITrash /> Elimina
            </button>
          )}
          <button type="submit" className="btn btn-primary grow" disabled={saving}>
            {saving ? 'Salvataggio…' : editing ? 'Salva modifiche' : 'Aggiungi'}
          </button>
        </div>
      </form>
    </Sheet>
  )
}
