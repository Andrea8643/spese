import { useMemo, useState } from 'react'
import { AllocationBar } from '../charts'
import { computeBalances, pace, summarizeMonth, type CatSummary } from '../finance'
import { PendingLeftovers } from '../Leftovers'
import { Recap } from '../Recap'
import { TxRow } from '../TxRow'
import type { Group } from '../types'
import { BudgetBadge, GROUP_COLOR, GROUP_LABEL, PeriodNav, Progress, useApp } from '../ui'
import { addMonths, currentMonth, fmt, fmt0, monthLabel } from '../utils'

export function Home() {
  const { settings, txs, openAdd, go } = useApp()
  const [month, setMonth] = useState(currentMonth())
  const s = useMemo(() => summarizeMonth(settings, txs, month), [settings, txs, month])
  const b = useMemo(() => computeBalances(settings, txs), [settings, txs])
  const p = pace(s.personalLeft, month)
  const isCurrent = month === currentMonth()
  const [recapMonth, openRecap] = useState<string | null>(null)
  const recent = txs.filter((t) => t.date.startsWith(month)).slice(0, 6)

  return (
    <>
      <div className="topbar wrap">
        <div>
          <h1>Ciao Andrea 👋</h1>
          <div className="small muted">Ecco come stai andando questo mese</div>
        </div>
        <PeriodNav label={monthLabel(month)} onPrev={() => setMonth(addMonths(month, -1))} onNext={() => setMonth(addMonths(month, 1))} disableNext={isCurrent} />
      </div>

      {s.incomeIsEstimate && (
        <div className="card row wrap" style={{ marginBottom: 14, borderColor: 'rgba(212,180,106,.35)' }}>
          <span className="grow small">
            💡 Non hai ancora registrato entrate a {monthLabel(month, false).toLowerCase()}: il budget è calcolato su una <b>stima di {fmt0(settings.expectedIncome)}</b>.
          </span>
          <button className="btn btn-sm btn-primary" onClick={() => openAdd({ type: 'income' })}>Registra stipendio</button>
        </div>
      )}

      {isCurrent && <PendingLeftovers compact onOpenRecap={openRecap} />}

      <div className="grid grid-2">
        <div className="hero">
          <div className="hero-label">🎯 Budget personale: ti restano</div>
          <div className={`hero-value tnum ${s.personalLeft < 0 ? 'neg' : ''}`}>{fmt(s.personalLeft)}</div>
          <div className="small text2" style={{ marginBottom: 12 }}>
            hai speso <b className="tnum">{fmt(s.personalSpent)}</b> di <span className="tnum">{fmt(s.personalBudget)}</span>
          </div>
          <Progress value={s.personalSpent} max={s.personalBudget} color="var(--personal)" />
          {p && s.personalLeft > 0 && (
            <div className="small text2" style={{ marginTop: 12 }}>
              Per stare nel budget: circa <b className="tnum">{fmt(p.perWeek)}</b> a settimana · <b className="tnum">{fmt(p.perDay)}</b> al giorno ({p.daysLeft} giorni rimasti)
            </div>
          )}
          {s.personalLeft < 0 && <div className="small neg" style={{ marginTop: 12 }}>⚠ Hai superato il budget personale.</div>}
        </div>

        <div className="grid grid-tiles" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))' }}>
          <div className="tile">
            <div className="tile-label"><span className="dot" style={{ background: 'var(--needs)' }} /> Necessità rimaste</div>
            <div className={`tile-value tnum ${s.needsLeft < 0 ? 'neg' : ''}`}>{fmt(s.needsLeft)}</div>
            <div className="tile-sub tnum">spese {fmt0(s.needsSpent)} di {fmt0(s.needsOperative)}</div>
          </div>
          <button className="tile" style={{ textAlign: 'left' }} onClick={() => go('risparmi')}>
            <div className="tile-label">🚗 Fondo auto</div>
            <div className={`tile-value tnum ${b.fund < 0 ? 'neg' : ''}`}>{fmt(b.fund)}</div>
            <div className="tile-sub">+{fmt0(s.fundQuota)} al mese</div>
          </button>
          <div className="tile">
            <div className="tile-label">🎟️ Buoni pasto</div>
            <div className="tile-value tnum">{b.vouchers} <span className="small muted">buoni</span></div>
            <div className="tile-sub tnum">= {fmt(b.vouchersValue)}</div>
          </div>
          <button className="tile" style={{ textAlign: 'left' }} onClick={() => go('risparmi')}>
            <div className="tile-label"><span className="dot" style={{ background: 'var(--savings)' }} /> Risparmi</div>
            <div className="tile-value tnum">{fmt0(b.savings)}</div>
            <div className="tile-sub tnum">{isCurrent ? `+${fmt0(s.savingsAlloc)} a fine mese` : 'saldo attuale'}</div>
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="row between" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ margin: 0 }}>Ripartizione di {fmt0(s.base)}{s.incomeIsEstimate ? ' (stima)' : ''}</div>
          <span className="xs muted">{settings.allocation.savingsPct}/{settings.allocation.needsPct}/{settings.allocation.personalPct}</span>
        </div>
        <AllocationBar
          parts={[
            { label: 'Risparmi', value: s.savingsAlloc, color: 'var(--savings)' },
            { label: 'Necessità', value: s.needsBudget, color: 'var(--needs)' },
            { label: 'Personale', value: s.personalBudget, color: 'var(--personal)' },
          ]}
        />
        <div className="small text2" style={{ marginTop: 12 }}>
          A fine mese la quota di <b className="tnum pos">{fmt0(s.savingsAlloc)}</b> va nei risparmi in automatico. Quello che avanza di Necessità e Personale lo versi tu con un tasto quando il mese è chiuso.
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 14 }}>
        {(['personale', 'necessita'] as Group[]).map((g) => (
          <CategoryBudgets key={g} group={g} cats={s.categories.filter((c) => c.cat.group === g)} />
        ))}
      </div>

      <div className="row between">
        <h2 className="section-title">Ultimi movimenti</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => go('movimenti')}>Vedi tutti</button>
      </div>
      <div className="card" style={{ paddingTop: 6, paddingBottom: 6 }}>
        {recent.length ? (
          <div className="list">{recent.map((t) => <TxRow key={t.id} tx={t} showDate />)}</div>
        ) : (
          <div className="empty">
            <div className="big">🧾</div>
            Nessun movimento in questo mese.
            <div style={{ marginTop: 12 }}><button className="btn btn-primary" onClick={() => openAdd()}>Aggiungi la prima spesa</button></div>
          </div>
        )}
      </div>
      {recapMonth && <Recap month={recapMonth} onClose={() => openRecap(null)} />}
    </>
  )
}

function CategoryBudgets({ group, cats }: { group: Group; cats: CatSummary[] }) {
  const sorted = [...cats].sort((a, b) => b.spentEuro - a.spentEuro || b.budget - a.budget)
  return (
    <div className="card">
      <div className="card-title row gap-s"><span className="dot" style={{ background: GROUP_COLOR[group] }} /> {GROUP_LABEL[group]} per categoria</div>
      <div className="stack" style={{ gap: 14 }}>
        {sorted.map((c) => (
          <div key={c.cat.id}>
            <div className="row between small" style={{ marginBottom: 6 }}>
              <span className="row gap-s ellipsis">
                <span>{c.cat.icon}</span>
                <span className="ellipsis">{c.cat.name}</span>
                {c.cat.fund ? <span className="badge badge-muted">dal fondo</span> : <BudgetBadge spent={c.spentEuro} budget={c.budget} />}
              </span>
              <span className="tnum text2" style={{ whiteSpace: 'nowrap' }}>
                <b style={{ color: 'var(--text)' }}>{fmt(c.spentEuro)}</b> / {fmt0(c.budget)}
              </span>
            </div>
            {c.cat.fund
              ? <div className="xs muted">Quota mensile {fmt0(c.budget)} che si accumula nel fondo; le spese auto non toccano il budget del mese.</div>
              : <Progress value={c.spentEuro} max={c.budget} color={GROUP_COLOR[group]} />}
            {c.spentTotal > c.spentEuro && <div className="xs muted" style={{ marginTop: 4 }}>+ {fmt(c.spentTotal - c.spentEuro)} pagati con buoni pasto</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
