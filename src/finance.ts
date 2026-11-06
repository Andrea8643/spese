import type { Allocation, Category, Group, Settings, Tx } from './types'
import { addDays, currentMonth, daysInMonth, monthOf, monthsBetween, round2, todayISO } from './utils'

export function allocationFor(settings: Settings, month: string): Allocation {
  const keys = Object.keys(settings.allocationHistory || {}).filter((k) => k <= month).sort()
  const key = keys[keys.length - 1]
  return (key && settings.allocationHistory[key]) || settings.allocation
}

export function voucherPart(tx: Tx, fallbackValue = 8): number {
  if (tx.type !== 'expense' || !tx.vouchers) return 0
  return round2(Math.min(tx.amount, tx.vouchers * (tx.voucherValue ?? fallbackValue)))
}
/** quanto della spesa è stato pagato in euro (conta per il budget) */
export function euroPart(tx: Tx, fallbackValue = 8): number {
  if (tx.type !== 'expense') return 0
  return round2(Math.max(0, tx.amount - voucherPart(tx, fallbackValue)))
}

export function catOf(categories: Category[], id?: string): Category {
  return categories.find((c) => c.id === id) ?? categories.find((c) => c.id === 'altro') ?? categories[categories.length - 1]
}

export interface CatSummary {
  cat: Category
  budget: number
  spentEuro: number
  spentTotal: number
  subs: { id: string; name: string; spentTotal: number; spentEuro: number }[]
  count: number
}

export interface MonthSummary {
  month: string
  closed: boolean
  income: number
  incomeIsEstimate: boolean
  base: number
  savingsAlloc: number
  needsBudget: number
  personalBudget: number
  fundQuota: number
  needsOperative: number
  needsSpent: number
  personalSpent: number
  fundSpent: number
  voucherSpent: number
  vouchersUsed: number
  vouchersIn: number
  totalExpense: number
  needsLeft: number
  personalLeft: number
  /** quota sicura + avanzi (massimo che può andare nei risparmi) */
  toSavings: number
  categories: CatSummary[]
  expenses: Tx[]
}

function summarizeCats(settings: Settings, expenses: Tx[], budgets?: { needsBudget: number; personalBudget: number; alloc: Allocation }): CatSummary[] {
  const map = new Map<string, CatSummary>()
  for (const cat of settings.categories) {
    const groupBudget = budgets ? (cat.group === 'necessita' ? budgets.needsBudget : budgets.personalBudget) : 0
    const pct = budgets ? budgets.alloc.catPct?.[cat.id] ?? cat.budgetPct ?? 0 : 0
    map.set(cat.id, {
      cat,
      budget: round2((groupBudget * pct) / 100),
      spentEuro: 0,
      spentTotal: 0,
      count: 0,
      subs: cat.subs.map((s) => ({ id: s.id, name: s.name, spentTotal: 0, spentEuro: 0 })),
    })
  }
  for (const tx of expenses) {
    const cat = catOf(settings.categories, tx.categoryId)
    const cs = map.get(cat.id)!
    const e = euroPart(tx, settings.voucherValue)
    cs.spentEuro += e
    cs.spentTotal += tx.amount
    cs.count++
    const s = cs.subs.find((x) => x.id === tx.subId) ?? cs.subs[0]
    if (s) {
      s.spentEuro += e
      s.spentTotal += tx.amount
    }
  }
  for (const cs of map.values()) {
    cs.spentEuro = round2(cs.spentEuro)
    cs.spentTotal = round2(cs.spentTotal)
    cs.subs.forEach((s) => {
      s.spentEuro = round2(s.spentEuro)
      s.spentTotal = round2(s.spentTotal)
    })
  }
  return [...map.values()]
}

export function summarizeMonth(settings: Settings, txs: Tx[], month: string): MonthSummary {
  const inMonth = txs.filter((t) => monthOf(t.date) === month)
  const expenses = inMonth.filter((t) => t.type === 'expense').sort((a, b) => (a.date < b.date ? 1 : -1))
  const income = round2(inMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0))
  const closed = month < currentMonth()
  const incomeIsEstimate = income === 0 && !closed
  const base = incomeIsEstimate ? settings.expectedIncome : income
  const alloc = allocationFor(settings, month)

  const savingsAlloc = round2((base * alloc.savingsPct) / 100)
  const needsBudget = round2((base * alloc.needsPct) / 100)
  const personalBudget = round2((base * alloc.personalPct) / 100)
  const categories = summarizeCats(settings, expenses, { needsBudget, personalBudget, alloc })

  const fundCats = categories.filter((c) => c.cat.fund)
  const fundQuota = round2(fundCats.reduce((s, c) => s + c.budget, 0))
  const needsOperative = round2(needsBudget - fundQuota)

  const sumGroup = (g: Group) => round2(categories.filter((c) => c.cat.group === g && !c.cat.fund).reduce((s, c) => s + c.spentEuro, 0))
  const needsSpent = sumGroup('necessita')
  const personalSpent = sumGroup('personale')
  const fundSpent = round2(fundCats.reduce((s, c) => s + c.spentEuro, 0))
  const voucherSpent = round2(expenses.reduce((s, t) => s + voucherPart(t, settings.voucherValue), 0))
  const vouchersUsed = expenses.reduce((s, t) => s + (t.vouchers || 0), 0)
  const vouchersIn = inMonth.filter((t) => t.type === 'voucher_in').reduce((s, t) => s + (t.vouchers || 0), 0)
  const totalExpense = round2(expenses.reduce((s, t) => s + t.amount, 0))

  const needsLeft = round2(needsOperative - needsSpent)
  const personalLeft = round2(personalBudget - personalSpent)
  const toSavings = round2(savingsAlloc + needsLeft + personalLeft)

  return {
    month, closed, income, incomeIsEstimate, base, savingsAlloc, needsBudget, personalBudget, fundQuota,
    needsOperative, needsSpent, personalSpent, fundSpent, voucherSpent, vouchersUsed, vouchersIn, totalExpense,
    needsLeft, personalLeft, toSavings, categories, expenses,
  }
}

export interface SavingsRow {
  month: string
  closed: boolean
  quota: number
  needsLeft: number
  personalLeft: number
  versed: number // avanzi versati per quel mese
  manual: number // altri movimenti manuali
  total: number
  balanceAfter: number
}

export interface PendingLeftover {
  ref: string
  month: string
  group: Group
  amount: number // positivo = avanzo da versare, negativo = sforamento
}

export interface Balances {
  savings: number // saldo attuale
  savingsSure: number // + quota del mese in corso (sicura)
  savingsMax: number // + avanzi possibili del mese in corso
  fund: number
  vouchers: number
  vouchersValue: number
  savingsRows: SavingsRow[]
  fundRows: { month: string; quota: number; spent: number; transfers: number; balanceAfter: number }[]
  pending: PendingLeftover[]
}

export const leftoverRef = (month: string, group: Group) => `avanzo:${month}:${group}`

export function computeBalances(settings: Settings, txs: Tx[]): Balances {
  const now = currentMonth()
  const months = monthsBetween(settings.startMonth, now)
  let savings = settings.initialSavings
  let fund = settings.initialFund
  const savingsRows: SavingsRow[] = []
  const fundRows: Balances['fundRows'] = []
  const pending: PendingLeftover[] = []
  const dismissed = new Set(settings.leftoverDismissed ?? [])
  let cur: MonthSummary | null = null

  const savingDelta = (t: Tx) =>
    t.type === 'saving_in' || t.type === 'from_fund' ? t.amount : t.type === 'saving_out' || t.type === 'to_fund' ? -t.amount : 0
  const refMonth = (t: Tx) => (t.ref ? t.ref.split(':')[1] : null)

  for (const m of months) {
    const sum = summarizeMonth(settings, txs, m)
    const versed = round2(txs.filter((t) => t.ref && refMonth(t) === m).reduce((s, t) => s + savingDelta(t), 0))
    const inM = txs.filter((t) => !t.ref && monthOf(t.date) === m)
    const manual = round2(inM.reduce((s, t) => s + savingDelta(t), 0))
    const fundTransfers = round2(inM.reduce((s, t) => (t.type === 'to_fund' ? s + t.amount : t.type === 'from_fund' ? s - t.amount : s), 0))
    savings = round2(savings + manual + versed + (sum.closed ? sum.savingsAlloc : 0))
    if (!sum.closed) cur = sum
    if (sum.closed) {
      for (const [g, left] of [['personale', sum.personalLeft], ['necessita', sum.needsLeft]] as [Group, number][]) {
        const ref = leftoverRef(m, g)
        if (Math.abs(left) >= 0.01 && !dismissed.has(ref) && !txs.some((t) => t.ref === ref)) pending.push({ ref, month: m, group: g, amount: left })
      }
    }
    savingsRows.push({
      month: m, closed: sum.closed, quota: sum.savingsAlloc, needsLeft: sum.needsLeft, personalLeft: sum.personalLeft,
      versed, manual, total: round2((sum.closed ? sum.savingsAlloc : 0) + versed + manual), balanceAfter: savings,
    })
    fund = round2(fund + sum.fundQuota - sum.fundSpent + fundTransfers)
    fundRows.push({ month: m, quota: sum.fundQuota, spent: sum.fundSpent, transfers: fundTransfers, balanceAfter: fund })
  }

  const vouchers =
    (settings.initialVouchers || 0) +
    txs.reduce((s, t) => {
      if (t.date < settings.startMonth) return s
      if (t.type === 'voucher_in') return s + (t.vouchers || 0)
      if (t.type === 'expense') return s - (t.vouchers || 0)
      return s
    }, 0)

  const sure = round2(savings + (cur?.savingsAlloc ?? 0))
  return {
    savings,
    savingsSure: sure,
    savingsMax: round2(sure + Math.max(0, cur?.needsLeft ?? 0) + Math.max(0, cur?.personalLeft ?? 0)),
    fund,
    vouchers,
    vouchersValue: round2(vouchers * settings.voucherValue),
    savingsRows: savingsRows.reverse(),
    fundRows: fundRows.reverse(),
    pending,
  }
}

export interface PeriodSummary {
  from: string
  to: string
  expenses: Tx[]
  income: number
  totalExpense: number
  euroExpense: number
  voucherExpense: number
  byGroup: Record<Group, number>
  categories: CatSummary[]
  byDay: { date: string; necessita: number; personale: number }[]
}

export function summarizePeriod(settings: Settings, txs: Tx[], from: string, to: string): PeriodSummary {
  const inP = txs.filter((t) => t.date >= from && t.date <= to)
  const expenses = inP.filter((t) => t.type === 'expense').sort((a, b) => (a.date < b.date ? 1 : -1))
  const categories = summarizeCats(settings, expenses)
  const byGroup: Record<Group, number> = { necessita: 0, personale: 0 }
  const days: Record<string, { necessita: number; personale: number }> = {}
  for (let d = from; d <= to; d = addDays(d, 1)) days[d] = { necessita: 0, personale: 0 }
  for (const t of expenses) {
    const g = catOf(settings.categories, t.categoryId).group
    byGroup[g] = round2(byGroup[g] + t.amount)
    if (days[t.date]) days[t.date][g] = round2(days[t.date][g] + t.amount)
  }
  const totalExpense = round2(expenses.reduce((s, t) => s + t.amount, 0))
  const voucherExpense = round2(expenses.reduce((s, t) => s + voucherPart(t, settings.voucherValue), 0))
  return {
    from, to, expenses,
    income: round2(inP.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)),
    totalExpense,
    voucherExpense,
    euroExpense: round2(totalExpense - voucherExpense),
    byGroup,
    categories,
    byDay: Object.entries(days).map(([date, v]) => ({ date, ...v })),
  }
}

/** quanto puoi spendere per te al giorno / a settimana da qui a fine mese */
export function pace(personalLeft: number, month: string) {
  const today = todayISO()
  if (monthOf(today) !== month) return null
  const day = Number(today.slice(8, 10))
  const daysLeft = daysInMonth(month) - day + 1
  const weeksLeft = Math.max(1, daysLeft / 7)
  return {
    daysLeft,
    perDay: round2(Math.max(0, personalLeft) / daysLeft),
    perWeek: round2(Math.max(0, personalLeft) / weeksLeft),
  }
}
