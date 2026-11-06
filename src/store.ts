import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore'
import { useEffect, useMemo, useRef, useState } from 'react'
import { db } from './firebase'
import { catPctFrom, DEFAULT_CATEGORIES, defaultSettings, SEED_RECURRING } from './defaults'
import type { Learned, Recurring, Settings, Tx } from './types'
import { addDays, clean, currentMonth, parseISO, todayISO, toISO } from './utils'

export interface Backend {
  onSettings(cb: (s: Settings | null) => void): () => void
  onLearned(cb: (l: Learned) => void): () => void
  onTxs(cb: (t: Tx[]) => void): () => void
  onRecurring(cb: (r: Recurring[]) => void): () => void
  saveSettings(s: Settings): Promise<void>
  saveLearned(l: Learned): Promise<void>
  saveTxs(txs: Tx[]): Promise<void>
  deleteTx(id: string): Promise<void>
  saveRecurring(r: Recurring): Promise<void>
  deleteRecurring(id: string): Promise<void>
}

// ───────── Firestore: users/{uid}/... ─────────
export function firestoreBackend(uid: string): Backend {
  const d = db!
  const base = `users/${uid}`
  return {
    onSettings: (cb) => onSnapshot(doc(d, base, 'meta', 'settings'), (s) => cb(s.exists() ? (s.data() as Settings) : null)),
    onLearned: (cb) => onSnapshot(doc(d, base, 'meta', 'learned'), (s) => cb((s.data()?.map as Learned) ?? {})),
    onTxs: (cb) => onSnapshot(collection(d, base, 'tx'), (q) => cb(q.docs.map((x) => ({ ...(x.data() as Tx), id: x.id })))),
    onRecurring: (cb) =>
      onSnapshot(collection(d, base, 'recurring'), (q) => cb(q.docs.map((x) => ({ ...(x.data() as Recurring), id: x.id })))),
    saveSettings: (s) => setDoc(doc(d, base, 'meta', 'settings'), s),
    saveLearned: (l) => setDoc(doc(d, base, 'meta', 'learned'), { map: l }),
    saveTxs: async (txs) => {
      for (let i = 0; i < txs.length; i += 400) {
        const b = writeBatch(d)
        for (const t of txs.slice(i, i + 400)) b.set(doc(d, base, 'tx', t.id), clean(t))
        await b.commit()
      }
    },
    deleteTx: (id) => deleteDoc(doc(d, base, 'tx', id)),
    saveRecurring: (r) => setDoc(doc(d, base, 'recurring', r.id), clean(r)),
    deleteRecurring: (id) => deleteDoc(doc(d, base, 'recurring', id)),
  }
}

// ───────── Modalità prova: tutto nel browser ─────────
export function localBackend(): Backend {
  const KEY = 'spese-demo-v1'
  type Data = { settings: Settings | null; learned: Learned; txs: Record<string, Tx>; recurring: Record<string, Recurring> }
  const load = (): Data => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) return JSON.parse(raw)
    } catch {
      /* ignore */
    }
    return { settings: null, learned: {}, txs: {}, recurring: {} }
  }
  let data = load()
  const listeners = new Set<() => void>()
  const commit = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l())
  }
  const sub = (fn: () => void) => {
    listeners.add(fn)
    queueMicrotask(fn)
    return () => void listeners.delete(fn)
  }
  return {
    onSettings: (cb) => sub(() => cb(data.settings)),
    onLearned: (cb) => sub(() => cb(data.learned)),
    onTxs: (cb) => sub(() => cb(Object.values(data.txs))),
    onRecurring: (cb) => sub(() => cb(Object.values(data.recurring))),
    saveSettings: async (s) => {
      data = { ...data, settings: s }
      commit()
    },
    saveLearned: async (l) => {
      data = { ...data, learned: l }
      commit()
    },
    saveTxs: async (txs) => {
      const t = { ...data.txs }
      txs.forEach((x) => (t[x.id] = clean(x)))
      data = { ...data, txs: t }
      commit()
    },
    deleteTx: async (id) => {
      const t = { ...data.txs }
      delete t[id]
      data = { ...data, txs: t }
      commit()
    },
    saveRecurring: async (r) => {
      data = { ...data, recurring: { ...data.recurring, [r.id]: clean(r) } }
      commit()
    },
    deleteRecurring: async (id) => {
      const r = { ...data.recurring }
      delete r[id]
      data = { ...data, recurring: r }
      commit()
    },
  }
}

/** Date in cui una spesa ricorrente cade tra from e to (inclusi). */
export function recurringDates(r: Recurring, from: string, to: string): string[] {
  const out: string[] = []
  const start = r.startDate > from ? r.startDate : from
  for (let d = start; d <= to; d = addDays(d, 1)) {
    const dt = parseISO(d)
    if (r.frequency === 'monthly' || r.frequency === 'yearly') {
      const last = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate()
      const monthOk = r.frequency === 'monthly' || dt.getMonth() + 1 === (r.month ?? 1)
      if (monthOk && dt.getDate() === Math.min(r.day, last)) out.push(d)
    } else if (((dt.getDay() + 6) % 7) + 1 === r.day) out.push(d)
    if (out.length > 400) break
  }
  return out
}

export function recurringToTx(r: Recurring, date: string): Tx {
  return clean({
    id: `rec_${r.id}_${date}`, // id deterministico: niente doppioni
    type: r.type,
    date,
    description: r.description,
    amount: r.amount,
    categoryId: r.type === 'expense' ? r.categoryId : undefined,
    subId: r.type === 'expense' ? r.subId : undefined,
    method: r.type === 'expense' ? r.method : undefined,
    incomeSource: r.type === 'income' ? r.incomeSource : undefined,
    recurringId: r.id,
    createdAt: Date.now(),
  }) as Tx
}

export function useStore(backend: Backend | null) {
  const [settings, setSettings] = useState<Settings | null | undefined>(undefined)
  const [learned, setLearned] = useState<Learned>({})
  const [txs, setTxs] = useState<Tx[] | undefined>(undefined)
  const [recurring, setRecurring] = useState<Recurring[] | undefined>(undefined)

  useEffect(() => {
    if (!backend) return
    const u = [backend.onSettings(setSettings), backend.onLearned(setLearned), backend.onTxs(setTxs), backend.onRecurring(setRecurring)]
    return () => u.forEach((f) => f())
  }, [backend])

  // primo accesso: crea le impostazioni di base
  useEffect(() => {
    if (backend && settings === null) void backend.saveSettings(defaultSettings(currentMonth()))
  }, [backend, settings])

  // aggiornamento una tantum: trasporti solo auto (GPL), nuove percentuali, abbonamenti e palestra annuale
  const migrating = useRef(false)
  useEffect(() => {
    if (!backend || !settings || !recurring || migrating.current || (settings.schema ?? 1) >= 2) return
    migrating.current = true
    void (async () => {
      const month = currentMonth()
      const defT = DEFAULT_CATEGORIES.find((c) => c.id === 'trasporti')!
      const categories = settings.categories.map((c) => (c.id === 'trasporti' ? { ...c, subs: defT.subs } : c))
      const allocation = { ...settings.allocation, catPct: { ...settings.allocation.catPct, ...catPctFrom(DEFAULT_CATEGORIES) } }
      for (const r of SEED_RECURRING) {
        if (recurring.some((x) => x.description === r.description)) continue
        const { key, ...rest } = r
        await backend.saveRecurring({ ...rest, id: `seed-${key}`, startDate: `${month}-01`, active: true } as Recurring)
      }
      await backend.saveSettings({ ...settings, categories, allocation, allocationHistory: { ...settings.allocationHistory, [month]: allocation }, schema: 2 })
    })()
  }, [backend, settings, recurring])

  // genera le spese/entrate ricorrenti fino a oggi
  useEffect(() => {
    if (!backend || !txs || !recurring) return
    const existing = new Set(txs.map((t) => t.id))
    const today = todayISO()
    const missing: Tx[] = []
    for (const r of recurring) {
      if (!r.active) continue
      const deleted = new Set(r.skip ?? [])
      const from = toISO(new Date(Math.max(parseISO(r.startDate).getTime(), Date.now() - 400 * 864e5)))
      for (const d of recurringDates(r, from, today)) {
        const tx = recurringToTx(r, d)
        if (!existing.has(tx.id) && !deleted.has(tx.id)) missing.push(tx)
      }
    }
    if (missing.length) void backend.saveTxs(missing)
  }, [backend, txs, recurring])

  // aggiunge alle categorie salvate le nuove parole chiave del dizionario
  const merged = useMemo(() => (settings ? withDefaultKeywords(settings) : settings), [settings])

  const loading = settings === undefined || settings === null || txs === undefined || recurring === undefined
  const sortedTxs = useMemo(
    () => (txs ?? []).slice().sort((a, b) => (a.date === b.date ? (b.createdAt ?? 0) - (a.createdAt ?? 0) : a.date < b.date ? 1 : -1)),
    [txs],
  )
  return { loading, settings: merged as Settings, learned, txs: sortedTxs, recurring: recurring ?? [] }
}

export function safeGet(k: string): string | null {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
export function safeSet(k: string, v: string) {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* ignore */
  }
}

function withDefaultKeywords(s: Settings): Settings {
  return {
    ...s,
    categories: s.categories.map((c) => {
      const def = DEFAULT_CATEGORIES.find((d) => d.id === c.id)
      if (!def) return c
      return {
        ...c,
        subs: c.subs.map((sub) => {
          const ds = def.subs.find((x) => x.id === sub.id)
          if (!ds) return sub
          const kws = new Set(sub.keywords)
          const extra = ds.keywords.filter((k) => !kws.has(k))
          return extra.length ? { ...sub, keywords: [...sub.keywords, ...extra] } : sub
        }),
      }
    }),
  }
}
