export type Group = 'necessita' | 'personale'

export interface Subcategory {
  id: string
  name: string
  keywords: string[]
}

export interface Category {
  id: string
  name: string
  icon: string
  group: Group
  /** quota del budget del gruppo (in %) */
  budgetPct: number
  /** se true, le spese vengono pagate dal Fondo auto (cumulativo) e non dal budget del mese */
  fund?: boolean
  subs: Subcategory[]
}

export type PayMethod = 'carta' | 'bancomat' | 'contanti' | 'buoni'

export type TxType =
  | 'expense' // spesa
  | 'income' // entrata in euro (stipendio, altro)
  | 'voucher_in' // buoni pasto ricevuti
  | 'saving_in' // versamento manuale nei risparmi
  | 'saving_out' // prelievo dai risparmi
  | 'to_fund' // trasferimento risparmi -> fondo auto
  | 'from_fund' // trasferimento fondo auto -> risparmi

export interface Tx {
  id: string
  type: TxType
  date: string // YYYY-MM-DD
  description: string
  /** valore totale (per expense: incluso il valore dei buoni) */
  amount: number
  categoryId?: string
  subId?: string
  /** metodo per la parte in euro */
  method?: PayMethod
  /** numero di buoni (usati per expense, ricevuti per voucher_in) */
  vouchers?: number
  voucherValue?: number
  incomeSource?: string
  recurringId?: string
  createdAt?: number
}

export interface Allocation {
  savingsPct: number
  needsPct: number
  personalPct: number
  /** quota % di ogni categoria rispetto al budget del suo gruppo */
  catPct: Record<string, number>
}

export interface Settings {
  categories: Category[]
  allocation: Allocation
  /** storico delle percentuali: mese YYYY-MM -> allocazione valida da quel mese */
  allocationHistory: Record<string, Allocation>
  startMonth: string // YYYY-MM
  initialSavings: number
  initialFund: number
  initialVouchers: number
  voucherValue: number
  expectedIncome: number
  incomeSources: string[]
  recapSeen: string[] // mesi di cui è stato mostrato il recap
}

export interface Recurring {
  id: string
  type: 'expense' | 'income'
  description: string
  amount: number
  categoryId?: string
  subId?: string
  method?: PayMethod
  incomeSource?: string
  frequency: 'monthly' | 'weekly'
  /** giorno del mese (1-28) per monthly, giorno settimana (1=lun..7=dom) per weekly */
  day: number
  startDate: string
  active: boolean
  /** occorrenze cancellate a mano (da non rigenerare) */
  skip?: string[]
}

export type Learned = Record<string, { c: string; s: string }>
