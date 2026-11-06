import { useMemo, useState } from 'react'
import { computeBalances, type PendingLeftover } from './finance'
import { GROUP_COLOR, GROUP_LABEL, useApp } from './ui'
import { fmt, monthLabel, todayISO, uid } from './utils'

/** Pulsanti per versare (o coprire) l'avanzo di un gruppo a fine mese. */
export function LeftoverActions({ p }: { p: PendingLeftover }) {
  const { backend, settings, toast } = useApp()
  const [busy, setBusy] = useState(false)
  const label = GROUP_LABEL[p.group].toLowerCase()
  const name = monthLabel(p.month, false).toLowerCase()

  async function verse() {
    setBusy(true)
    try {
      await backend.saveTxs([{
        id: uid(), type: p.amount > 0 ? 'saving_in' : 'saving_out', amount: Math.abs(p.amount), date: todayISO(), ref: p.ref,
        description: p.amount > 0 ? `Avanzo ${label} di ${name}` : `Sforamento ${label} di ${name}`, createdAt: Date.now(),
      }])
      toast(p.amount > 0 ? `Versati ${fmt(p.amount)} nei risparmi ✓` : `Coperti ${fmt(-p.amount)} dai risparmi`)
    } finally {
      setBusy(false)
    }
  }
  async function dismiss() {
    if (!confirm(p.amount > 0 ? 'Non versare questo avanzo nei risparmi?' : 'Ignorare lo sforamento senza toglierlo dai risparmi?')) return
    await backend.saveSettings({ ...settings, leftoverDismissed: [...(settings.leftoverDismissed ?? []), p.ref] })
  }

  return (
    <div className="row wrap" style={{ gap: 8 }}>
      <button className={`btn btn-sm ${p.amount > 0 ? 'btn-primary' : ''}`} disabled={busy} onClick={verse}>
        {p.amount > 0 ? `📥 Versa ${fmt(p.amount)} nei risparmi` : `Togli ${fmt(-p.amount)} dai risparmi`}
      </button>
      <button className="btn btn-sm btn-ghost" onClick={dismiss}>{p.amount > 0 ? 'Non verso' : 'Ignora'}</button>
    </div>
  )
}

/** Riquadro con tutti gli avanzi ancora da versare. */
export function PendingLeftovers({ compact, onOpenRecap }: { compact?: boolean; onOpenRecap?: (month: string) => void }) {
  const { settings, txs } = useApp()
  const pending = useMemo(() => computeBalances(settings, txs).pending, [settings, txs])
  if (!pending.length) return null
  const total = pending.filter((p) => p.amount > 0).reduce((s, p) => s + p.amount, 0)
  return (
    <div className="card" style={{ borderColor: 'rgba(25,158,112,.45)', background: 'linear-gradient(180deg, rgba(25,158,112,.08), var(--surface))', marginBottom: 14 }}>
      <div className="card-title" style={{ color: 'var(--good-text)' }}>📥 Avanzi da versare nei risparmi{total > 0 && ` · ${fmt(total)}`}</div>
      <div className="stack" style={{ gap: 14 }}>
        {pending.map((p) => (
          <div key={p.ref} className="stack" style={{ gap: 8 }}>
            <div className="small">
              <span className="dot" style={{ background: GROUP_COLOR[p.group], marginRight: 6 }} />
              <b>{GROUP_LABEL[p.group]}</b> di {monthLabel(p.month).toLowerCase()}:{' '}
              {p.amount > 0 ? <>ti sono avanzati <b className="pos tnum">{fmt(p.amount)}</b></> : <>hai sforato di <b className="neg tnum">{fmt(-p.amount)}</b></>}
            </div>
            <LeftoverActions p={p} />
          </div>
        ))}
        {compact && onOpenRecap && (
          <button className="btn btn-sm btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => onOpenRecap(pending[0].month)}>Vedi il recap di {monthLabel(pending[0].month, false).toLowerCase()} →</button>
        )}
      </div>
    </div>
  )
}
