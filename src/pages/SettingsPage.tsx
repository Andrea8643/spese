import { useMemo, useState } from 'react'
import { learnedLabel } from '../categorize'
import { summarizeMonth } from '../finance'
import { logout } from '../firebase'
import { LogOut, Pencil, Trash2 } from 'lucide-react'
import type { Category, Group, PayMethod, Recurring, Settings } from '../types'
import { CatIcon, GROUP_COLOR, GROUP_LABEL, METHOD_LABEL, Sheet, useApp } from '../ui'
import { addDays, cap, currentMonth, fmt, fmt0, MONTHS, parseAmount, round2, todayISO, uid, WEEKDAYS_SHORT } from '../utils'

const num = (s: string) => {
  const n = parseAmount(s)
  return Number.isFinite(n) ? n : 0
}

export function SettingsPage({ email }: { email?: string | null }) {
  const { settings, txs, backend, toast, recurring, learned, demo } = useApp()
  const [draft, setDraft] = useState<Settings>(settings)
  // campi che si modificano da questa pagina (il resto non viene mai sovrascritto)
  const editable = (x: Settings) => ({
    categories: x.categories, allocation: x.allocation, expectedIncome: x.expectedIncome, initialSavings: x.initialSavings,
    initialFund: x.initialFund, initialVouchers: x.initialVouchers, voucherValue: x.voucherValue, incomeSources: x.incomeSources,
  })
  const [recEdit, setRecEdit] = useState<Recurring | 'new' | null>(null)
  // ordine delle categorie per percentuale (si aggiorna quando finisci di modificare)
  const sortIds = (d: Settings) => d.categories.slice().sort((x, y) => (d.allocation.catPct[y.id] ?? 0) - (d.allocation.catPct[x.id] ?? 0)).map((c) => c.id)
  const pos = (id: string) => (order.includes(id) ? order.indexOf(id) : 999)
  const [order, setOrder] = useState<string[]>(() => sortIds(settings))
  const resort = () => setOrder(sortIds(draft))
  const dirty = JSON.stringify(editable(draft)) !== JSON.stringify(editable(settings))
  // se le impostazioni cambiano altrove e qui non stai modificando nulla, aggiorna la bozza
  const [seen, setSeen] = useState(settings)
  if (seen !== settings) {
    setSeen(settings)
    if (!dirty) setDraft(settings)
  }
  const base = useMemo(() => summarizeMonth(draft, txs, currentMonth()).base, [draft, txs])
  const a = draft.allocation
  const totalPct = a.savingsPct + a.needsPct + a.personalPct

  const setAlloc = (patch: Partial<Settings['allocation']>) => setDraft((d) => ({ ...d, allocation: { ...d.allocation, ...patch } }))
  const setCat = (id: string, patch: Partial<Category>) =>
    setDraft((d) => ({ ...d, categories: d.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))

  async function save() {
    if (totalPct !== 100) return toast('Le tre percentuali devono fare 100%')
    const m = currentMonth()
    const next: Settings = { ...settings, ...editable(draft), allocationHistory: { ...settings.allocationHistory, [m]: draft.allocation } }
    await backend.saveSettings(next)
    resort()
    toast('Impostazioni salvate ✓')
  }

  function exportData(kind: 'json' | 'csv') {
    let blob: Blob
    if (kind === 'json') {
      blob = new Blob([JSON.stringify({ settings, txs, recurring, learned }, null, 2)], { type: 'application/json' })
    } else {
      const rows = [['data', 'tipo', 'descrizione', 'importo', 'categoria', 'sottocategoria', 'metodo', 'buoni']]
      for (const t of txs) {
        const c = settings.categories.find((x) => x.id === t.categoryId)
        rows.push([t.date, t.type, t.description, String(t.amount).replace('.', ','), c?.name ?? '', c?.subs.find((s) => s.id === t.subId)?.name ?? '', t.method ?? '', String(t.vouchers ?? '')])
      }
      blob = new Blob(['﻿' + rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(';')).join('\n')], { type: 'text/csv' })
    }
    const url = URL.createObjectURL(blob)
    const el = document.createElement('a')
    el.href = url
    el.download = `spese-${todayISO()}.${kind}`
    el.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="header"><h1>Impostazioni</h1></div>

      <div className="stack stagger" style={{ gap: 12 }}>
        <div className="card">
          <div className="card-title">Ripartizione delle entrate</div>
          <div className="small text2" style={{ marginBottom: 12 }}>Ogni entrata del mese viene divisa così. Su {fmt0(base)}:</div>
          <div className="stack" style={{ gap: 16 }}>
            {([['savingsPct', 'Risparmi', 'var(--savings)'], ['needsPct', 'Necessità', 'var(--needs)'], ['personalPct', 'Personale', 'var(--personal)']] as const).map(([k, l, c]) => (
              <div key={k}>
                <div className="row between small" style={{ marginBottom: 8 }}>
                  <label htmlFor={k} className="row gap-s bold"><span className="dot" style={{ background: c }} />{l}</label>
                  <span className="tnum"><b>{a[k]}%</b> <span className="muted">· {fmt0((base * a[k]) / 100)}</span></span>
                </div>
                <input id={k} type="range" min={0} max={100} step={1} value={a[k]} style={{ ['--thumb' as string]: c }} onChange={(e) => setAlloc({ [k]: Number(e.target.value) })} />
              </div>
            ))}
          </div>
          <div className={`small ${totalPct === 100 ? 'pos' : 'neg'}`} style={{ marginTop: 8 }}>Totale: {totalPct}% {totalPct !== 100 && '— deve essere 100%'}</div>
          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="exp">Entrata stimata (usata finché non registri lo stipendio del mese)</label>
            <input id="exp" className="input tnum" inputMode="decimal" value={draft.expectedIncome} onChange={(e) => setDraft({ ...draft, expectedIncome: num(e.target.value) })} />
          </div>
        </div>

        {(['necessita', 'personale'] as Group[]).map((g) => {
          const groupBudget = (base * (g === 'necessita' ? a.needsPct : a.personalPct)) / 100
          const cats = draft.categories.filter((c) => c.group === g).sort((x, y) => pos(x.id) - pos(y.id))
          const sum = cats.reduce((s, c) => s + (a.catPct[c.id] ?? 0), 0)
          return (
            <div className="card" key={g}>
              <div className="card-title"><span className="dot" style={{ background: GROUP_COLOR[g] }} /> {GROUP_LABEL[g]} per categoria · {fmt0(groupBudget)}</div>
              <div className="stack" style={{ gap: 12 }}>
                {cats.map((c) => (
                  <div className="row" key={c.id} style={{ gap: 10 }}>
                    <CatIcon cat={c} size="sm" />
                    <span className="grow small" style={{ minWidth: 0 }}>
                      <span className="ellipsis bold" style={{ display: 'block' }}>{c.name}</span>
                      <span className="xs muted tnum">{fmt0((groupBudget * (a.catPct[c.id] ?? 0)) / 100)} al mese{c.fund ? ' · cumulativo' : ''}</span>
                    </span>
                    <input className="input tnum center" style={{ width: 64, minHeight: 42, padding: 6 }} inputMode="numeric" aria-label={`Percentuale ${c.name}`} value={a.catPct[c.id] ?? 0} onBlur={resort} onChange={(e) => setAlloc({ catPct: { ...a.catPct, [c.id]: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) } })} />
                    <span className="small muted">%</span>
                  </div>
                ))}
              </div>
              <div className={`small ${sum === 100 ? 'pos' : ''}`} style={{ marginTop: 8, color: sum === 100 ? undefined : 'var(--warning)' }}>Totale: {sum}% {sum !== 100 && '— consigliato 100%'}</div>
            </div>
          )
        })}

        <div className="card">
          <div className="card-title">Saldi iniziali e buoni</div>
          <div className="grid grid-2">
            <div className="field"><label htmlFor="is">Risparmi iniziali (€)</label><input id="is" className="input tnum" inputMode="decimal" value={draft.initialSavings} onChange={(e) => setDraft({ ...draft, initialSavings: num(e.target.value) })} /></div>
            <div className="field"><label htmlFor="if">Fondo auto iniziale (€)</label><input id="if" className="input tnum" inputMode="decimal" value={draft.initialFund} onChange={(e) => setDraft({ ...draft, initialFund: num(e.target.value) })} /></div>
            <div className="field"><label htmlFor="iv">Buoni pasto già in possesso</label><input id="iv" className="input tnum" inputMode="numeric" value={draft.initialVouchers} onChange={(e) => setDraft({ ...draft, initialVouchers: parseInt(e.target.value) || 0 })} /></div>
            <div className="field"><label htmlFor="vv">Valore di un buono (€)</label><input id="vv" className="input tnum" inputMode="decimal" value={draft.voucherValue} onChange={(e) => setDraft({ ...draft, voucherValue: num(e.target.value) || 8 })} /></div>
            <div className="field"><label htmlFor="src">Tipi di entrata (separati da virgola)</label><input id="src" className="input" value={draft.incomeSources.join(', ')} onChange={(e) => setDraft({ ...draft, incomeSources: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} /></div>
          </div>
          <div className="xs muted" style={{ marginTop: 8 }}>Il conteggio parte da {draft.startMonth}.</div>
        </div>

        <div className="card">
          <div className="row between" style={{ marginBottom: 10 }}>
            <div className="card-title" style={{ margin: 0 }}>Categorie e parole chiave</div>
            <button className="btn btn-sm" onClick={() => {
              const id = 'cat-' + uid()
              setDraft((d) => ({ ...d, categories: [...d.categories, { id, name: 'Nuova categoria', icon: '🏷️', group: 'personale', budgetPct: 0, subs: [{ id: 'sub-' + uid(), name: 'Generale', keywords: [] }] }] }))
            }}>+ Categoria</button>
          </div>
          <div className="small muted" style={{ marginBottom: 10 }}>Le parole chiave servono al riconoscimento automatico. Quando correggi una categoria, l'app se lo ricorda da sola.</div>
          <div className="stack" style={{ gap: 8 }}>
            {draft.categories.map((c) => (
              <details className="cat-edit" key={c.id}>
                <summary>
                  <span style={{ fontSize: 18 }}>{c.icon}</span>
                  <span className="grow bold small">{c.name}</span>
                  <span className="dot" style={{ background: GROUP_COLOR[c.group] }} />
                  <span className="xs muted">{c.subs.length} sottocat.</span>
                </summary>
                <div className="cat-edit-body">
                  <div className="row wrap">
                    <input className="input" style={{ width: 64, textAlign: 'center' }} value={c.icon} onChange={(e) => setCat(c.id, { icon: e.target.value })} aria-label="Icona" />
                    <input className="input grow" value={c.name} onChange={(e) => setCat(c.id, { name: e.target.value })} aria-label="Nome categoria" />
                    <select className="input" style={{ width: 'auto' }} value={c.group} onChange={(e) => setCat(c.id, { group: e.target.value as Group })} aria-label="Gruppo">
                      <option value="necessita">Necessità</option>
                      <option value="personale">Personale</option>
                    </select>
                  </div>
                  <label className="row small text2"><input type="checkbox" checked={!!c.fund} onChange={(e) => setCat(c.id, { fund: e.target.checked })} style={{ accentColor: '#d4b46a' }} /> Fondo cumulativo (non va nei risparmi, si accumula)</label>
                  {c.subs.map((s, i) => (
                    <div key={s.id} className="split">
                      <div className="row">
                        <input className="input grow" value={s.name} aria-label="Nome sottocategoria" onChange={(e) => setCat(c.id, { subs: c.subs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                        {c.subs.length > 1 && <button className="icon-btn" aria-label="Elimina sottocategoria" onClick={() => setCat(c.id, { subs: c.subs.filter((_, j) => j !== i) })}><Trash2 /></button>}
                      </div>
                      <textarea className="input small" rows={2} aria-label="Parole chiave" placeholder="parole chiave separate da virgola" value={s.keywords.join(', ')} onChange={(e) => setCat(c.id, { subs: c.subs.map((x, j) => (j === i ? { ...x, keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) } : x)) })} />
                    </div>
                  ))}
                  <div className="row">
                    <button className="btn btn-sm" onClick={() => setCat(c.id, { subs: [...c.subs, { id: 'sub-' + uid(), name: 'Nuova sottocategoria', keywords: [] }] })}>+ Sottocategoria</button>
                    <button className="btn btn-sm btn-danger" style={{ marginLeft: 'auto' }} onClick={() => confirm(`Eliminare la categoria "${c.name}"? Le spese già registrate finiranno in "Altro".`) && setDraft((d) => ({ ...d, categories: d.categories.filter((x) => x.id !== c.id) }))}>Elimina categoria</button>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="row between" style={{ marginBottom: 10 }}>
            <div className="card-title" style={{ margin: 0 }}>Spese ed entrate ricorrenti</div>
            <button className="btn btn-sm" onClick={() => setRecEdit('new')}>+ Ricorrente</button>
          </div>
          {recurring.length === 0 && <div className="small muted">Nessuna. Aggiungi abbonamenti (Netflix, palestra, telefono…) e verranno registrati in automatico.</div>}
          <div className="list">
            {recurring.map((r) => {
              const c = settings.categories.find((x) => x.id === r.categoryId)
              return (
                <div className="list-item" key={r.id} style={{ opacity: r.active ? 1 : 0.5 }}>
                  {c && r.type === 'expense' ? <CatIcon cat={c} size="sm" /> : <span className="cat-icon sm" style={{ background: 'rgba(70,212,131,.14)' }}>💶</span>}
                  <span className="grow">
                    <span className="bold ellipsis" style={{ display: 'block' }}>{r.description}</span>
                    <span className="xs muted">{freqLabel(r)}{c ? ` · ${c.name}` : ''}</span>
                  </span>
                  <span className={`tnum bold ${r.type === 'income' ? 'pos' : ''}`}>{r.type === 'income' ? '+' : '−'}{fmt(r.amount)}</span>
                  <button className="icon-btn" aria-label="Modifica ricorrente" onClick={() => setRecEdit(r)}><Pencil /></button>
                  <button className="icon-btn" aria-label="Elimina ricorrente" onClick={() => confirm('Eliminare questa ricorrenza? I movimenti già registrati restano.') && backend.deleteRecurring(r.id)}><Trash2 /></button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Riconoscimenti imparati ({Object.keys(learned).length})</div>
          {Object.keys(learned).length === 0 ? <div className="small muted">Ancora nessuno: quando correggi una categoria, comparirà qui.</div> : (
            <div className="chips">
              {Object.entries(learned).map(([k, v]) => {
                const c = settings.categories.find((x) => x.id === v.c)
                return (
                  <span key={k} className="chip">
                    {learnedLabel(k)} → {c?.icon} {c?.subs.find((s) => s.id === v.s)?.name ?? c?.name}
                    <button className="btn-ghost" style={{ border: 0, background: 'none', padding: 0, marginLeft: 4 }} aria-label="Dimentica" onClick={() => { const n = { ...learned }; delete n[k]; void backend.saveLearned(n) }}>✕</button>
                  </span>
                )
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Backup</div>
          <div className="row wrap">
            <button className="btn" onClick={() => exportData('csv')}>⬇ Esporta CSV (Excel)</button>
            <button className="btn" onClick={() => exportData('json')}>⬇ Backup completo (JSON)</button>
          </div>
        </div>

        <div className="card row wrap">
          <div className="grow small">{demo ? <>Modalità prova: i dati sono salvati solo in questo browser.</> : <>Accesso come <b>{email}</b></>}</div>
          {!demo && <button className="btn" onClick={() => logout()}><LogOut /> Esci</button>}
          {demo && <button className="btn btn-danger" onClick={() => { if (confirm('Cancellare tutti i dati della prova?')) { localStorage.removeItem('spese-demo-v1'); location.reload() } }}>Azzera dati prova</button>}
        </div>
      </div>

      {dirty && (
        <div style={{ position: 'sticky', bottom: 'calc(92px + var(--safe-bottom))', marginTop: 16, zIndex: 30 }}>
          <div className="card row" style={{ boxShadow: 'var(--shadow)', borderColor: 'rgba(212,180,106,.4)' }}>
            <span className="grow small">Hai modifiche non salvate</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setDraft(settings)}>Annulla</button>
            <button className="btn btn-primary btn-sm" onClick={save}>Salva</button>
          </div>
        </div>
      )}

      {recEdit && <RecurringSheet initial={recEdit === 'new' ? undefined : recEdit} onClose={() => setRecEdit(null)} />}
    </>
  )
}

function freqLabel(r: Recurring) {
  if (r.frequency === 'weekly') return `ogni ${WEEKDAYS_SHORT[r.day - 1]}`
  if (r.frequency === 'yearly') return `ogni anno il ${r.day} ${MONTHS[(r.month ?? 1) - 1]}`
  return `ogni mese il giorno ${r.day}`
}

function RecurringSheet({ onClose, initial }: { onClose: () => void; initial?: Recurring }) {
  const { settings, backend, toast } = useApp()
  const [type, setType] = useState<'expense' | 'income'>(initial?.type ?? 'expense')
  const [desc, setDesc] = useState(initial?.description ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount).replace('.', ',') : '')
  const [month, setMonth] = useState(initial?.month ?? 1)
  const [active, setActive] = useState(initial?.active ?? true)
  const [cat, setCat] = useState(initial?.categoryId ? `${initial.categoryId}|${initial.subId}` : `${settings.categories.find((c) => c.id === 'abbonamenti')?.id ?? settings.categories[0].id}|${(settings.categories.find((c) => c.id === 'abbonamenti') ?? settings.categories[0]).subs[0].id}`)
  const [freq, setFreq] = useState<Recurring['frequency']>(initial?.frequency ?? 'monthly')
  const [day, setDay] = useState(initial?.day ?? 1)
  const [method, setMethod] = useState<Exclude<PayMethod, 'buoni'>>(initial?.method === 'contanti' ? 'contanti' : 'carta')
  const [source, setSource] = useState(initial?.incomeSource ?? settings.incomeSources[0] ?? 'Stipendio')
  const [start, setStart] = useState(initial?.startDate ?? todayISO())

  return (
    <Sheet title={initial ? 'Modifica ricorrenza' : 'Nuova ricorrenza'} onClose={onClose}>
      <form className="stack" onSubmit={async (e) => {
        e.preventDefault()
        const n = parseAmount(amount)
        if (!desc.trim() || !Number.isFinite(n) || n <= 0) return toast('Compila descrizione e importo')
        const [c, s] = cat.split('|')
        const scheduleChanged = initial && (initial.frequency !== freq || initial.day !== day || (initial.month ?? 1) !== month)
        const startDate = scheduleChanged && start === initial.startDate && start <= todayISO() ? addDays(todayISO(), 1) : start
        const r: Recurring = {
          id: initial?.id ?? uid(), type, description: desc.trim(), amount: round2(n), frequency: freq, day, startDate, active,
          skip: initial?.skip, month: freq === 'yearly' ? month : undefined,
          ...(type === 'expense' ? { categoryId: c, subId: s, method } : { incomeSource: source }),
        }
        await backend.saveRecurring(r)
        toast(initial ? 'Ricorrenza aggiornata ✓' : 'Ricorrenza creata ✓')
        onClose()
      }}>
        <div className="seg full">
          <button type="button" className={type === 'expense' ? 'on' : ''} onClick={() => setType('expense')}>Spesa</button>
          <button type="button" className={type === 'income' ? 'on' : ''} onClick={() => setType('income')}>Entrata</button>
        </div>
        <div className="field"><label htmlFor="r-d">Descrizione</label><input id="r-d" className="input" placeholder="es. Netflix, Palestra, Ricarica Iliad" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <div className="field"><label htmlFor="r-a">Importo</label><input id="r-a" className="input tnum" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        {type === 'expense' ? (
          <>
            <div className="field"><label htmlFor="r-c">Categoria</label>
              <select id="r-c" className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
                {settings.categories.flatMap((c) => c.subs.map((s) => <option key={c.id + s.id} value={`${c.id}|${s.id}`}>{c.icon} {c.name} › {s.name}</option>))}
              </select>
            </div>
            <div className="chips">{(['carta', 'contanti'] as const).map((m) => <button type="button" key={m} className={`chip ${method === m ? 'on' : ''}`} onClick={() => setMethod(m)}>{METHOD_LABEL[m]}</button>)}</div>
          </>
        ) : (
          <div className="chips">{settings.incomeSources.map((s) => <button type="button" key={s} className={`chip ${source === s ? 'on' : ''}`} onClick={() => setSource(s)}>{s}</button>)}</div>
        )}
        <div className="row">
          <div className="field grow"><label>Frequenza</label>
            <select className="input" value={freq} onChange={(e) => { setFreq(e.target.value as Recurring['frequency']); setDay(1) }}>
              <option value="monthly">Ogni mese</option>
              <option value="weekly">Ogni settimana</option>
              <option value="yearly">Ogni anno</option>
            </select>
          </div>
          <div className="field grow"><label>{freq === 'weekly' ? 'Giorno' : 'Giorno del mese'}</label>
            <select className="input" value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {freq !== 'weekly'
                ? Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)
                : WEEKDAYS_SHORT.map((w, i) => <option key={w} value={i + 1}>{w}</option>)}
            </select>
          </div>
        </div>
        {freq === 'yearly' && (
          <div className="field"><label htmlFor="r-m">Mese</label>
            <select id="r-m" className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{cap(m)}</option>)}
            </select>
          </div>
        )}
        <div className="field"><label htmlFor="r-s">A partire dal</label><input id="r-s" type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <span className="xs muted">Se la data di partenza è già passata, i movimenti fino a oggi vengono registrati subito.</span>
        {initial && (
          <label className="row small text2" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#d4b46a' }} /> Attiva
          </label>
        )}
        <button className="btn btn-primary">{initial ? 'Salva' : 'Crea ricorrenza'}</button>
      </form>
    </Sheet>
  )
}
