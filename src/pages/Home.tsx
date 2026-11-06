import { Car, Lightbulb, PiggyBank, Settings2, ShoppingCart, Ticket } from 'lucide-react'
import { useMemo, useState } from 'react'
import { computeBalances, pace, summarizeMonth, type CatSummary } from '../finance'
import { PendingLeftovers } from '../Leftovers'
import { Recap } from '../Recap'
import { TxRow } from '../TxRow'
import type { Group } from '../types'
import { BudgetBadge, CatIcon, GROUP_COLOR, Money, PeriodNav, Progress, Ring, useApp } from '../ui'
import { addMonths, currentMonth, fmt, fmt0, monthLabel } from '../utils'

export function Home() {
  const { settings, txs, openAdd, go } = useApp()
  const [month, setMonth] = useState(currentMonth())
  const [group, setGroup] = useState<Group>('personale')
  const [showAll, setShowAll] = useState(false)
  const [recapMonth, openRecap] = useState<string | null>(null)
  const s = useMemo(() => summarizeMonth(settings, txs, month), [settings, txs, month])
  const b = useMemo(() => computeBalances(settings, txs), [settings, txs])
  const p = pace(s.personalLeft, month)
  const isCurrent = month === currentMonth()
  const recent = txs.filter((t) => t.date.startsWith(month)).slice(0, 5)
  const usedPct = s.personalBudget > 0 ? Math.round((s.personalSpent / s.personalBudget) * 100) : 0

  const cats = s.categories
    .filter((c) => c.cat.group === group)
    .sort((a, b) => b.spentEuro - a.spentEuro || b.budget - a.budget)
  const visible = showAll ? cats : cats.slice(0, 5)

  return (
    <>
      <div className="header">
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">Ciao Andrea 👋</div>
          <h1>{monthLabel(month)}</h1>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <PeriodNav label="" onPrev={() => setMonth(addMonths(month, -1))} onNext={() => setMonth(addMonths(month, 1))} disableNext={isCurrent} />
          <button className="icon-btn mobile-only" onClick={() => go('impostazioni')} aria-label="Impostazioni"><Settings2 /></button>
        </div>
      </div>

      <div className="stack stagger" style={{ gap: 12 }}>
        {s.incomeIsEstimate && (
          <div className="banner">
            <Lightbulb />
            <span className="grow small">Stipendio non ancora registrato: budget su una stima di <b>{fmt0(settings.expectedIncome)}</b>.</span>
            <button className="btn btn-sm btn-primary" onClick={() => openAdd({ type: 'income' })}>Registra</button>
          </div>
        )}

        {isCurrent && <PendingLeftovers compact onOpenRecap={openRecap} />}

        <div className="hero">
          <div className="budget-hero">
            <Ring value={s.personalSpent} max={s.personalBudget} color="var(--personal)" label={`${usedPct}%`} sub="usato" />
            <div className="grow">
              <div className="hero-label">Ti restano per te</div>
              <div className={`hero-value ${s.personalLeft < 0 ? 'neg' : ''}`}><Money value={s.personalLeft} /></div>
              <div className="small text2">di <b className="tnum">{fmt(s.personalBudget)}</b></div>
            </div>
          </div>
          {p && s.personalLeft > 0 && (
            <div className="row" style={{ marginTop: 16, gap: 8, position: 'relative' }}>
              <span className="badge badge-muted" style={{ padding: '6px 10px', fontSize: 12.5 }}>≈ <b className="tnum">{fmt0(p.perWeek)}</b>&nbsp;a settimana</span>
              <span className="badge badge-muted" style={{ padding: '6px 10px', fontSize: 12.5 }}>≈ <b className="tnum">{fmt0(p.perDay)}</b>&nbsp;al giorno</span>
              <span className="xs muted grow nowrap" style={{ textAlign: 'right' }}>{p.daysLeft} gg</span>
            </div>
          )}
          {s.personalLeft < 0 && <div className="small neg" style={{ marginTop: 12, position: 'relative' }}>Hai superato il budget personale di {fmt(-s.personalLeft)}.</div>}
        </div>

        <div className="grid grid-tiles four">
          <Tile icon={<ShoppingCart />} color="var(--needs)" label="Necessità" value={s.needsLeft} sub={`rimaste · spese ${fmt0(s.needsSpent)}/${fmt0(s.needsOperative)}`} />
          <Tile icon={<Car />} color="#9085e9" label="Fondo auto" value={b.fund} sub={`+${fmt0(s.fundQuota)} al mese`} onClick={() => go('risparmi')} />
          <Tile icon={<Ticket />} color="var(--accent)" label="Buoni pasto" value={b.vouchers} format={(n) => `${Math.round(n)} buoni`} sub={`= ${fmt(b.vouchersValue)}`} onClick={() => go('risparmi')} />
          <Tile icon={<PiggyBank />} color="var(--savings)" label="Risparmi" value={b.savings} format={fmt0} sub={isCurrent ? `+${fmt0(s.savingsAlloc)} a fine mese` : 'saldo attuale'} onClick={() => go('risparmi')} />
        </div>

        <div className="card">
          <div className="row between" style={{ marginBottom: 14 }}>
            <div className="card-title" style={{ margin: 0 }}>Budget per categoria</div>
            <div className="seg">
              <button className={group === 'personale' ? 'on' : ''} onClick={() => setGroup('personale')}>Personale</button>
              <button className={group === 'necessita' ? 'on' : ''} onClick={() => setGroup('necessita')}>Necessità</button>
            </div>
          </div>
          <div className="stack" style={{ gap: 16 }} key={group}>
            {visible.map((c) => <CatRow key={c.cat.id} c={c} />)}
          </div>
          {cats.length > 5 && (
            <button className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 10 }} onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Mostra meno' : `Mostra tutte (${cats.length})`}
            </button>
          )}
        </div>

        <div>
          <div className="row between">
            <h2 className="section-title" style={{ marginTop: 14 }}>Ultimi movimenti</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => go('movimenti')}>Vedi tutti</button>
          </div>
          <div className="card" style={{ padding: '4px 14px' }}>
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
        </div>
      </div>
      {recapMonth && <Recap month={recapMonth} onClose={() => openRecap(null)} />}
    </>
  )
}

function Tile({ icon, color, label, value, sub, format = fmt, onClick }: {
  icon: React.ReactNode; color: string; label: string; value: number; sub: string; format?: (n: number) => string; onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className="tile" onClick={onClick}>
      <span className="tile-head">
        <span className="tile-icon" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>{icon}</span>
        <span className="tile-label ellipsis">{label}</span>
      </span>
      <span className={`tile-value ${value < 0 ? 'neg' : ''}`}><Money value={value} format={format} /></span>
      <span className="tile-sub ellipsis">{sub}</span>
    </Tag>
  )
}

function CatRow({ c }: { c: CatSummary }) {
  return (
    <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
      <CatIcon cat={c.cat} size="sm" />
      <div className="grow">
        <div className="row between" style={{ marginBottom: 7, gap: 8 }}>
          <span className="row gap-s" style={{ minWidth: 0 }}>
            <span className="ellipsis bold small">{c.cat.name}</span>
            {c.cat.fund ? <span className="badge badge-muted">fondo</span> : <BudgetBadge spent={c.spentEuro} budget={c.budget} />}
          </span>
          <span className="tnum small nowrap">
            <b>{fmt0(c.spentEuro)}</b><span className="muted"> / {fmt0(c.budget)}</span>
          </span>
        </div>
        {c.cat.fund
          ? <div className="xs muted">+{fmt0(c.budget)} al mese nel fondo · le spese auto non toccano il budget</div>
          : <Progress value={c.spentEuro} max={c.budget} color={GROUP_COLOR[c.cat.group]} />}
        {c.spentTotal > c.spentEuro && <div className="xs muted" style={{ marginTop: 4 }}>+ {fmt(c.spentTotal - c.spentEuro)} con buoni pasto</div>}
      </div>
    </div>
  )
}
