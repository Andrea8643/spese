import { catOf, euroPart } from './finance'
import { ArrowDownToLine, ArrowUpFromLine, Banknote, Car, Repeat, Ticket } from 'lucide-react'
import type { Tx } from './types'
import { CatIcon, catColor, METHOD_LABEL, useApp } from './ui'
import { dayLabel, fmt } from './utils'

export function TxRow({ tx, showDate }: { tx: Tx; showDate?: boolean }) {
  const { settings, openAdd } = useApp()
  const clickable = ['expense', 'income', 'voucher_in'].includes(tx.type)
  let icon: React.ReactNode = null
  let title = tx.description
  let subtitle = ''
  let amount = ''
  let cls = ''
  if (tx.type === 'expense') {
    const cat = catOf(settings.categories, tx.categoryId)
    icon = <CatIcon cat={cat} />
    subtitle = cat.name
    amount = `−${fmt(tx.amount)}`
  } else if (tx.type === 'income') {
    icon = <span className="cat-icon" style={{ background: 'rgba(70,212,131,.14)', color: 'var(--good-text)' }}><Banknote /></span>
    subtitle = tx.incomeSource ?? 'Entrata'
    amount = `+${fmt(tx.amount)}`
    cls = 'pos'
  } else if (tx.type === 'voucher_in') {
    icon = <span className="cat-icon" style={{ background: 'rgba(227,196,125,.14)', color: 'var(--accent)' }}><Ticket /></span>
    subtitle = `${tx.vouchers} buoni × ${fmt(tx.voucherValue ?? settings.voucherValue)}`
    amount = `+${tx.vouchers} buoni`
    cls = 'pos'
  } else {
    const I = tx.type === 'to_fund' || tx.type === 'from_fund' ? Car : tx.type === 'saving_in' ? ArrowDownToLine : ArrowUpFromLine
    icon = <span className="cat-icon" style={{ background: 'rgba(31,176,124,.14)', color: 'var(--savings)' }}><I /></span>
    subtitle = { saving_in: 'Versamento nei risparmi', saving_out: 'Prelievo dai risparmi', to_fund: 'Risparmi → Fondo auto', from_fund: 'Fondo auto → Risparmi' }[tx.type]
    amount = `${tx.type === 'saving_in' || tx.type === 'from_fund' ? '+' : '−'}${fmt(tx.amount)}`
  }
  const Tag = clickable ? 'button' : 'div'
  const euro = euroPart(tx, settings.voucherValue)
  const cat = tx.type === 'expense' ? catOf(settings.categories, tx.categoryId) : null
  return (
    <Tag className="list-item tx" onClick={clickable ? () => openAdd(tx) : undefined}>
      {icon}
      <span className="grow" style={{ minWidth: 0 }}>
        <span className="tx-title ellipsis">{title}</span>
        <span className="tx-sub ellipsis">
          <span style={{ color: cat ? catColor(cat) : undefined, fontWeight: 700 }}>{subtitle}</span>
          {showDate && <span className="muted"> · {dayLabel(tx.date)}</span>}
        </span>
      </span>
      <span className="tx-right">
        <span className={`tx-amount tnum ${cls}`}>{amount}</span>
        <span className="tx-meta">
          {tx.recurringId && <span className="badge badge-muted" title="Ricorrente"><Repeat size={11} /></span>}
          {tx.type === 'expense' && !!tx.vouchers && (
            <span className="badge badge-voucher">🎟 {tx.vouchers}{euro > 0 ? ` + ${fmt(euro)}` : ''}</span>
          )}
          {tx.type === 'expense' && !tx.vouchers && tx.method && <span>{METHOD_LABEL[tx.method]}</span>}
        </span>
      </span>
    </Tag>
  )
}
