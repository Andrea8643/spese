import { useEffect, useMemo, useRef, useState } from 'react'
import { learnEntries, suggestCategory } from './categorize'
import { catOf, computeBalances, euroPart } from './finance'
import { ISpark, ITrash } from './icons'
import type { Category, Recurring, Tx } from './types'
import { GROUP_LABEL, Sheet, useApp } from './ui'
import { addDays, fmt, parseAmount, parseISO, round2, todayISO, uid } from './utils'

type Mode = 'expense' | 'income' | 'voucher_in'
type EuroMethod = 'carta' | 'contanti'

export function AddTx({ initial, onClose }: { initial?: Partial<Tx>; onClose: () => void }) {
  const { settings, learned, backend, toast, txs, recurring } = useApp()
  const editing = !!initial?.id
  const vValue = settings.voucherValue
  const [mode, setMode] = useState<Mode>(initial?.type && ['expense', 'income', 'voucher_in'].includes(initial.type) ? (initial.type as Mode) : 'expense')
  const [desc, setDesc] = useState(initial?.description ?? '')
  const [amountStr, setAmountStr] = useState(initial?.amount && !initial?.vouchers ? String(initial.amount).replace('.', ',') : '')
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [catSel, setCatSel] = useState(initial?.categoryId ? `${initial.categoryId}|${initial.subId ?? ''}` : '')
  const [manualCat, setManualCat] = useState(editing)
  const [picking, setPicking] = useState(false)
  const [payKind, setPayKind] = useState<'euro' | 'buoni'>(initial?.vouchers ? 'buoni' : 'euro')
  const [euroMethod, setEuroMethod] = useState<EuroMethod>(initial?.method === 'contanti' ? 'contanti' : 'carta')
  const [vouchers, setVouchers] = useState<number>(initial?.vouchers ?? 1)
  const [restStr, setRestStr] = useState(initial?.vouchers ? String(euroPart(initial as Tx, vValue)).replace('.', ',') : '')
  const [source, setSource] = useState(initial?.incomeSource ?? settings.incomeSources[0] ?? 'Stipendio')
  const [voucherIn, setVoucherIn] = useState(initial?.type === 'voucher_in' ? initial.vouchers ?? 20 : 20)
  const [voucherValue, setVoucherValue] = useState(String(initial?.voucherValue ?? vValue).replace('.', ','))
  const [repeat, setRepeat] = useState(false)
  const [saving, setSaving] = useState(false)
  const descRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setTimeout(() => descRef.current?.focus(), 250)
  }, [editing])

  const balances = useMemo(() => computeBalances(settings, txs), [settings, txs])
  const vouchersAvailable = balances.vouchers + (editing ? initial?.vouchers ?? 0 : 0)

  // importo scritto in fondo alla descrizione ("burger king 12,50")
  const trailing = desc.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur|euro)?\s*$/i)
  const typedAmount = amountStr ? parseAmount(amountStr) : trailing ? parseAmount(trailing[1]) : NaN
  const cleanDesc = (amountStr || !trailing ? desc : desc.slice(0, trailing.index)).trim()

  // riconoscimento automatico mentre scrivi
  const suggestion = useMemo(() => suggestCategory(cleanDesc, settings.categories, learned), [cleanDesc, settings.categories, learned])
  useEffect(() => {
    if (mode === 'expense' && !manualCat) setCatSel(suggestion ? `${suggestion.categoryId}|${suggestion.subId}` : '')
  }, [suggestion, manualCat, mode])

  const [catId, subId] = catSel.split('|')
  const cat = catSel ? catOf(settings.categories, catId) : null
  const sub = cat?.subs.find((s) => s.id === subId)

  // pagamento con buoni: totale = buoni × valore + resto in euro
  const rest = restStr ? parseAmount(restStr) : 0
  const amount = payKind === 'buoni' ? round2(vouchers * vValue + (Number.isFinite(rest) ? rest : 0)) : typedAmount

  function chooseBuoni() {
    if (payKind === 'buoni') return
    setPayKind('buoni')
    // se avevi già scritto l'importo, propone buoni + resto (17 € → 2 buoni + 1 €)
    if (Number.isFinite(typedAmount) && typedAmount > 0) {
      const n = Math.max(1, Math.floor(round2(typedAmount) / vValue))
      setVouchers(n)
      const r = round2(Math.max(0, typedAmount - n * vValue))
      setRestStr(r ? String(r).replace('.', ',') : '')
    }
  }

  async function save() {
    if (saving) return
    let tx: Tx
    const id = initial?.id ?? uid()
    const base = { id, date, createdAt: initial?.createdAt ?? Date.now(), recurringId: initial?.recurringId }
    if (mode === 'expense') {
      if (!cleanDesc) return toast('Scrivi cosa hai comprato')
      if (!Number.isFinite(amount) || amount <= 0) return toast(payKind === 'buoni' ? 'Controlla buoni e resto' : 'Inserisci un importo valido')
      if (payKind === 'buoni' && !Number.isFinite(rest)) return toast('Resto in euro non valido')
      if (!catSel || !subId) {
        setPicking(true)
        return toast('Scegli una categoria')
      }
      const r = payKind === 'buoni' ? round2(rest || 0) : 0
      tx = {
        ...base, type: 'expense', description: cleanDesc, amount: round2(amount), categoryId: catId, subId,
        method: payKind === 'buoni' ? (r > 0 ? euroMethod : 'buoni') : euroMethod,
        vouchers: payKind === 'buoni' ? vouchers : undefined,
        voucherValue: payKind === 'buoni' ? vValue : undefined,
      }
      // se hai scelto tu la categoria, l'app se la ricorda (frase e singole parole)
      if (manualCat) void backend.saveLearned({ ...learned, ...learnEntries(cleanDesc, catId, subId) })
    } else if (mode === 'income') {
      if (!Number.isFinite(typedAmount) || typedAmount <= 0) return toast('Inserisci un importo valido')
      tx = { ...base, type: 'income', description: cleanDesc || source, amount: round2(typedAmount), incomeSource: source }
    } else {
      const v = parseAmount(voucherValue)
      if (!voucherIn || voucherIn <= 0 || !Number.isFinite(v)) return toast('Controlla numero e valore dei buoni')
      tx = { ...base, type: 'voucher_in', description: desc.trim() || 'Buoni pasto Edenred', amount: round2(voucherIn * v), vouchers: voucherIn, voucherValue: v }
    }
    setSaving(true)
    try {
      await backend.saveTxs([tx])
      if (repeat && !editing && (mode === 'expense' || mode === 'income')) {
        const rec: Recurring = {
          id: uid(), type: mode, description: tx.description, amount: tx.amount, categoryId: tx.categoryId, subId: tx.subId,
          method: tx.method === 'buoni' ? 'carta' : tx.method, incomeSource: tx.incomeSource, frequency: 'monthly',
          day: Math.min(28, parseISO(date).getDate()), startDate: addDays(date, 1), active: true,
        }
        await backend.saveRecurring(rec)
      }
      toast(editing ? 'Modificato ✓' : mode === 'expense' ? `Salvata in ${cat?.name ?? ''} ✓` : 'Salvato ✓')
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

  const amountField = (label: string) => (
    <div className="field">
      <label htmlFor="amt">{label}</label>
      <input id="amt" className="input input-amount tnum" inputMode="decimal" placeholder={trailing && mode !== 'voucher_in' ? trailing[1] : '0,00'} value={amountStr} onChange={(e) => setAmountStr(e.target.value)} />
    </div>
  )

  return (
    <Sheet title={editing ? 'Modifica movimento' : 'Nuovo movimento'} onClose={onClose}>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); void save() }}>
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
              <input id="desc" ref={descRef} className="input" placeholder="es. 2 felpe New Yorker, Burger King, Conad…" value={desc} onChange={(e) => setDesc(e.target.value)} autoComplete="off" />
            </div>

            {/* categoria: scelta in automatico, si cambia solo se sbagliata */}
            {!picking && (cat && sub ? (
              <div className={manualCat ? 'split' : 'suggest'} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{cat.icon}</span>
                <span className="grow" style={{ minWidth: 0 }}>
                  <span className="xs muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {!manualCat && <span style={{ width: 13, height: 13, display: 'inline-flex', color: 'var(--accent)' }}><ISpark /></span>}
                    {manualCat ? 'Categoria' : 'Riconosciuta in automatico'} · {GROUP_LABEL[cat.group]}
                  </span>
                  <span className="bold" style={{ display: 'block' }}>{cat.name} › {sub.name}</span>
                </span>
                <button type="button" className="btn btn-sm" onClick={() => setPicking(true)}>Cambia</button>
              </div>
            ) : cleanDesc ? (
              <div className="split" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="grow small text2">Non l'ho riconosciuto: scegli tu la categoria, la prossima volta me lo ricordo.</span>
                <button type="button" className="btn btn-sm btn-primary" onClick={() => setPicking(true)}>Scegli</button>
              </div>
            ) : null)}
            {picking && (
              <CategoryPicker
                categories={settings.categories}
                value={catSel}
                onPick={(v) => { setCatSel(v); setManualCat(true); setPicking(false) }}
                onCancel={() => setPicking(false)}
              />
            )}

            <div className="field">
              <label>Come hai pagato?</label>
              <div className="chips">
                {(['carta', 'contanti'] as const).map((m) => (
                  <button type="button" key={m} className={`chip ${payKind === 'euro' && euroMethod === m ? 'on' : ''}`} onClick={() => { setPayKind('euro'); setEuroMethod(m) }}>
                    {m === 'carta' ? '💳 Carta' : '💶 Contanti'}
                  </button>
                ))}
                <button type="button" className={`chip ${payKind === 'buoni' ? 'on' : ''}`} onClick={chooseBuoni}>🎟️ Buoni pasto</button>
              </div>
            </div>

            {payKind === 'euro' && amountField('Importo')}

            {payKind === 'buoni' && (
              <div className="split">
                <div className="row between">
                  <div>
                    <div className="bold">Buoni pasto</div>
                    <div className="xs muted">{fmt(vValue)} l'uno · ne hai {vouchersAvailable}</div>
                  </div>
                  <div className="stepper">
                    <button type="button" onClick={() => setVouchers((v) => Math.max(1, v - 1))} aria-label="Meno buoni">−</button>
                    <span className="val tnum">{vouchers}</span>
                    <button type="button" onClick={() => setVouchers((v) => v + 1)} aria-label="Più buoni">+</button>
                  </div>
                </div>
                <div className="row between small">
                  <span className="text2">{vouchers} {vouchers === 1 ? 'buono' : 'buoni'} × {fmt(vValue)}</span>
                  <span className="tnum bold">{fmt(vouchers * vValue)}</span>
                </div>
                <div className="field">
                  <label htmlFor="rest">Resto pagato in euro (se c'è)</label>
                  <input id="rest" className="input tnum" inputMode="decimal" placeholder="0,00" value={restStr} onChange={(e) => setRestStr(e.target.value)} />
                </div>
                {rest > 0 && (
                  <div className="chips">
                    {(['carta', 'contanti'] as const).map((m) => (
                      <button type="button" key={m} className={`chip ${euroMethod === m ? 'on' : ''}`} onClick={() => setEuroMethod(m)}>
                        {m === 'carta' ? '💳 Resto con carta' : '💶 Resto in contanti'}
                      </button>
                    ))}
                  </div>
                )}
                <div className="row between" style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  <span className="bold">Totale spesa</span>
                  <span className="tnum bold" style={{ fontSize: 18 }}>{Number.isFinite(amount) ? fmt(amount) : '—'}</span>
                </div>
                {vouchers > vouchersAvailable && <span className="xs neg">⚠ Stai usando più buoni di quelli che risultano disponibili.</span>}
                <span className="xs muted">Al budget in euro conta solo il resto; i buoni scalano dal saldo buoni.</span>
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
            {amountField('Importo')}
            <div className="field">
              <label htmlFor="desc">Nota (facoltativa)</label>
              <input id="desc" ref={descRef} className="input" placeholder="es. Stipendio ottobre" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <span className="xs muted">Il budget del mese si calcola sulle entrate registrate nel mese: {settings.allocation.savingsPct}% risparmi, {settings.allocation.needsPct}% necessità, {settings.allocation.personalPct}% personale.</span>
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
            <button type="button" className="btn btn-danger" onClick={remove} aria-label="Elimina"><ITrash /> Elimina</button>
          )}
          <button type="submit" className="btn btn-primary grow" disabled={saving}>
            {saving ? 'Salvataggio…' : editing ? 'Salva modifiche' : 'Aggiungi'}
          </button>
        </div>
      </form>
    </Sheet>
  )
}

/** Griglia di categorie con icone, poi sottocategorie. */
function CategoryPicker({ categories, value, onPick, onCancel }: { categories: Category[]; value: string; onPick: (v: string) => void; onCancel: () => void }) {
  const [open, setOpen] = useState<string | null>(value ? value.split('|')[0] : null)
  const openCat = categories.find((c) => c.id === open)
  return (
    <div className="split" style={{ gap: 12 }}>
      <div className="row between">
        <span className="bold">Scegli la categoria</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Annulla</button>
      </div>
      {(['personale', 'necessita'] as const).map((g) => (
        <div key={g}>
          <div className="xs muted" style={{ marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 650 }}>{GROUP_LABEL[g]}</div>
          <div className="cat-grid">
            {categories.filter((c) => c.group === g).map((c) => (
              <button
                type="button"
                key={c.id}
                className={`cat-tile ${open === c.id ? 'on' : ''}`}
                onClick={() => (c.subs.length === 1 ? onPick(`${c.id}|${c.subs[0].id}`) : setOpen(c.id))}
              >
                <span style={{ fontSize: 22 }}>{c.icon}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
          {openCat && openCat.group === g && openCat.subs.length > 1 && (
            <div className="chips" style={{ marginTop: 10 }}>
              {openCat.subs.map((s) => (
                <button type="button" key={s.id} className={`chip ${value === `${openCat.id}|${s.id}` ? 'on' : ''}`} onClick={() => onPick(`${openCat.id}|${s.id}`)}>
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
