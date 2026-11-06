import { useMemo, useState } from 'react'
import { summarizeMonth } from '../finance'
import { logout } from '../firebase'
import { ILogout, ITrash } from '../icons'
import type { Category, Group, PayMethod, Recurring, Settings } from '../types'
import { GROUP_COLOR, GROUP_LABEL, METHOD_LABEL, Sheet, useApp } from '../ui'
import { currentMonth, fmt, fmt0, parseAmount, round2, todayISO, uid, WEEKDAYS_SHORT } from '../utils'

const num = (s: string) => {
  const n = parseAmount(s)
  return Number.isFinite(n) ? n : 0
}

export function SettingsPage({ email }: { email?: string | null }) {
  const { settings, txs, backend, toast, recurring, learned, demo } = useApp()
  const [draft, setDraft] = useState<Settings>(settings)
  const [newRec, setNewRec] = useState(false)
  const dirty = JSON.stringify({ ...draft, recapSeen: [] }) !== JSON.stringify({ ...settings, recapSeen: [] })
  const base = useMemo(() => summarizeMonth(draft, txs, currentMonth()).base, [draft, txs])
  const a = draft.allocation
  const totalPct = a.savingsPct + a.needsPct + a.personalPct

  const setAlloc = (patch: Partial<Settings['allocation']>) => setDraft((d) => ({ ...d, allocation: { ...d.allocation, ...patch } }))
  const setCat = (id: string, patch: Partial<Category>) =>
    setDraft((d) => ({ ...d, categories: d.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))

  async function save() {
    if (totalPct !== 100) return toast('Le tre percentuali devono fare 100%')
    const m = currentMonth()
    const next: Settings = { ...draft, recapSeen: settings.recapSeen, allocationHistory: { ...draft.allocationHistory, [m]: draft.allocation } }
    await backend.saveSettings(next)
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
      <div className="topbar"><h1>Impostazioni</h1></div>

      <div className="stack" style={{ gap: 14 }}>
        <div className="card">
          <div className="card-title">Ripartizione delle entrate</div>
          <div className="small text2" style={{ marginBottom: 12 }}>Ogni entrata del mese viene divisa così. Su {fmt0(base)}:</div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
            {([['savingsPct', '💰 Risparmi', 'var(--savings)'], ['needsPct', '🛒 Necessità', 'var(--needs)'], ['personalPct', '🎯 Personale', 'var(--personal)']] as const).map(([k, l, c]) => (
              <div className="field" key={k}>
                <label htmlFor={k}><span className="dot" style={{ background: c, marginRight: 6 }} />{l}</label>
                <div className="row gap-s"><input id={k} className="input tnum center" inputMode="numeric" value={a[k]} onChange={(e) => setAlloc({ [k]: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })} /><span>%</span></div>
                <span className="xs muted tnum">{fmt0((base * a[k]) / 100)}</span>
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
          const cats = draft.categories.filter((c) => c.group === g)
          const sum = cats.reduce((s, c) => s + (a.catPct[c.id] ?? 0), 0)
          return (
            <div className="card" key={g}>
              <div className="card-title row gap-s"><span className="dot" style={{ background: GROUP_COLOR[g] }} /> Budget {GROUP_LABEL[g]} per categoria ({fmt0(groupBudget)})</div>
              <div className="stack" style={{ gap: 8 }}>
                {cats.map((c) => (
                  <div className="row" key={c.id}>
                    <span className="grow ellipsis small">{c.icon} {c.name}{c.fund && <span className="badge badge-muted" style={{ marginLeft: 6 }}>cumulativo</span>}</span>
                    <input className="input tnum center" style={{ width: 70, minHeight: 38, padding: 6 }} inputMode="numeric" aria-label={`Percentuale ${c.name}`} value={a.catPct[c.id] ?? 0} onChange={(e) => setAlloc({ catPct: { ...a.catPct, [c.id]: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) } })} />
                    <span className="small">%</span>
                    <span className="tnum small text2" style={{ width: 70, textAlign: 'right' }}>{fmt0((groupBudget * (a.catPct[c.id] ?? 0)) / 100)}</span>
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
                        {c.subs.length > 1 && <button className="icon-btn" aria-label="Elimina sottocategoria" onClick={() => setCat(c.id, { subs: c.subs.filter((_, j) => j !== i) })}><ITrash /></button>}
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
            <button className="btn btn-sm" onClick={() => setNewRec(true)}>+ Ricorrente</button>
          </div>
          {recurring.length === 0 && <div className="small muted">Nessuna. Aggiungi abbonamenti (Netflix, palestra, telefono…) e verranno registrati in automatico.</div>}
          <div className="list">
            {recurring.map((r) => {
              const c = settings.categories.find((x) => x.id === r.categoryId)
              return (
                <div className="list-item" key={r.id} style={{ opacity: r.active ? 1 : 0.5 }}>
                  <span className="cat-icon">{r.type === 'income' ? '💶' : c?.icon ?? '📦'}</span>
                  <span className="grow">
                    <span className="bold ellipsis" style={{ display: 'block' }}>{r.description}</span>
                    <span className="xs muted">{r.frequency === 'monthly' ? `ogni mese il giorno ${r.day}` : `ogni ${WEEKDAYS_SHORT[r.day - 1]}`}{c ? ` · ${c.name}` : ''}</span>
                  </span>
                  <span className={`tnum bold ${r.type === 'income' ? 'pos' : ''}`}>{r.type === 'income' ? '+' : '−'}{fmt(r.amount)}</span>
                  <button className="btn btn-sm" onClick={() => backend.saveRecurring({ ...r, active: !r.active })}>{r.active ? 'Pausa' : 'Attiva'}</button>
                  <button className="icon-btn" aria-label="Elimina ricorrente" onClick={() => confirm('Eliminare questa ricorrenza? I movimenti già registrati restano.') && backend.deleteRecurring(r.id)}><ITrash /></button>
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
                    “{k}” → {c?.icon} {c?.subs.find((s) => s.id === v.s)?.name ?? c?.name}
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
          {!demo && <button className="btn" onClick={() => logout()}><span style={{ width: 18, height: 18, display: 'inline-flex' }}><ILogout /></span> Esci</button>}
          {demo && <button className="btn btn-danger" onClick={() => { if (confirm('Cancellare tutti i dati della prova?')) { localStorage.removeItem('spese-demo-v1'); location.reload() } }}>Azzera dati prova</button>}
        </div>
      </div>

      {dirty && (
        <div style={{ position: 'sticky', bottom: 'calc(84px + var(--safe-bottom))', marginTop: 16, zIndex: 30 }}>
          <div className="card row" style={{ boxShadow: 'var(--shadow)', borderColor: 'rgba(212,180,106,.4)' }}>
            <span className="grow small">Hai modifiche non salvate</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setDraft(settings)}>Annulla</button>
            <button className="btn btn-primary btn-sm" onClick={save}>Salva</button>
          </div>
        </div>
      )}

      {newRec && <RecurringSheet onClose={() => setNewRec(false)} />}
    </>
  )
}

function RecurringSheet({ onClose }: { onClose: () => void }) {
  const { settings, backend, toast } = useApp()
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [cat, setCat] = useState(`${settings.categories.find((c) => c.id === 'abbonamenti')?.id ?? settings.categories[0].id}|${(settings.categories.find((c) => c.id === 'abbonamenti') ?? settings.categories[0]).subs[0].id}`)
  const [freq, setFreq] = useState<'monthly' | 'weekly'>('monthly')
  const [day, setDay] = useState(1)
  const [method, setMethod] = useState<Exclude<PayMethod, 'buoni'>>('carta')
  const [source, setSource] = useState(settings.incomeSources[0] ?? 'Stipendio')
  const [start, setStart] = useState(todayISO())

  return (
    <Sheet title="Nuova ricorrenza" onClose={onClose}>
      <form className="stack" onSubmit={async (e) => {
        e.preventDefault()
        const n = parseAmount(amount)
        if (!desc.trim() || !Number.isFinite(n) || n <= 0) return toast('Compila descrizione e importo')
        const [c, s] = cat.split('|')
        const r: Recurring = {
          id: uid(), type, description: desc.trim(), amount: round2(n), frequency: freq, day, startDate: start, active: true,
          ...(type === 'expense' ? { categoryId: c, subId: s, method } : { incomeSource: source }),
        }
        await backend.saveRecurring(r)
        toast('Ricorrenza creata ✓')
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
            <div className="chips">{(['carta', 'bancomat', 'contanti'] as const).map((m) => <button type="button" key={m} className={`chip ${method === m ? 'on' : ''}`} onClick={() => setMethod(m)}>{METHOD_LABEL[m]}</button>)}</div>
          </>
        ) : (
          <div className="chips">{settings.incomeSources.map((s) => <button type="button" key={s} className={`chip ${source === s ? 'on' : ''}`} onClick={() => setSource(s)}>{s}</button>)}</div>
        )}
        <div className="row">
          <div className="field grow"><label>Frequenza</label>
            <select className="input" value={freq} onChange={(e) => { setFreq(e.target.value as 'monthly' | 'weekly'); setDay(1) }}>
              <option value="monthly">Ogni mese</option>
              <option value="weekly">Ogni settimana</option>
            </select>
          </div>
          <div className="field grow"><label>{freq === 'monthly' ? 'Giorno del mese' : 'Giorno'}</label>
            <select className="input" value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {freq === 'monthly'
                ? Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)
                : WEEKDAYS_SHORT.map((w, i) => <option key={w} value={i + 1}>{w}</option>)}
            </select>
          </div>
        </div>
        <div className="field"><label htmlFor="r-s">A partire dal</label><input id="r-s" type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <span className="xs muted">Se la data di partenza è già passata, i movimenti fino a oggi vengono registrati subito.</span>
        <button className="btn btn-primary">Crea ricorrenza</button>
      </form>
    </Sheet>
  )
}
