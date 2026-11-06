import type { Category, Learned } from './types'
import { normalize } from './utils'

export interface Suggestion {
  categoryId: string
  subId: string
  source: 'learned' | 'keyword' | 'word'
  match: string
}

// parole da ignorare quando si impara dalle singole parole
const STOP = new Set([
  'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci', 'uno', 'una', 'un', 'il', 'lo', 'la', 'i', 'gli',
  'le', 'di', 'da', 'del', 'della', 'dei', 'delle', 'dal', 'dalla', 'al', 'alla', 'ai', 'con', 'per', 'in', 'su', 'e', 'ed',
  'oggi', 'ieri', 'comprato', 'comprata', 'comprati', 'comprate', 'preso', 'presa', 'presi', 'pagato', 'speso', 'nuovo',
  'nuova', 'nuovi', 'nuove', 'euro', 'eur', 'pezzi', 'pezzo', 'paio', 'mio', 'mia', 'miei', 'mie', 'per', 'cosa', 'cose',
  'roba', 'spesa', 'acquisto', 'ordine', 'online', 'negozio',
])

/** "felpe" -> "felp", "pantaloni" -> "pantalon": così singolare e plurale coincidono */
export function stem(word: string): string {
  if (word.length >= 5 && /[aeio]$/.test(word)) return word.slice(0, -1)
  return word
}

function prepare(text: string): string {
  return normalize(text)
    .replace(/\d+([.,]\d+)?/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(stem)
    .join(' ')
}

function contains(text: string, kw: string): boolean {
  if (!kw) return false
  const padded = ` ${text} `
  // parole corte: devono comparire intere; parole lunghe: basta l'inizio della parola (mcdonald -> mcdonalds)
  return kw.length <= 3 ? padded.includes(` ${kw} `) : padded.includes(` ${kw}`)
}

// cache del dizionario già preparato
let cacheKey: Category[] | null = null
let cacheList: { kw: string; c: string; s: string }[] = []
function dictionary(categories: Category[]) {
  if (cacheKey === categories) return cacheList
  cacheList = []
  for (const cat of categories) for (const sub of cat.subs) for (const raw of sub.keywords) {
    const kw = prepare(raw)
    if (kw) cacheList.push({ kw, c: cat.id, s: sub.id })
  }
  cacheKey = categories
  return cacheList
}

/** Riconosce categoria e sottocategoria dalla descrizione. */
export function suggestCategory(description: string, categories: Category[], learned: Learned): Suggestion | null {
  const text = prepare(description)
  if (!text) return null
  const valid = (c: string, s: string) => categories.some((cat) => cat.id === c && cat.subs.some((x) => x.id === s))

  // 1. frasi che hai corretto tu: precedenza assoluta
  const exact = learned[text]
  if (exact && valid(exact.c, exact.s)) return { categoryId: exact.c, subId: exact.s, source: 'learned', match: text }
  let best: Suggestion | null = null
  for (const [key, v] of Object.entries(learned)) {
    if (key.startsWith('~') || key.length < 3 || !valid(v.c, v.s)) continue
    const k = prepare(key)
    if (contains(text, k) && (!best || k.length > best.match.length)) best = { categoryId: v.c, subId: v.s, source: 'learned', match: k }
  }
  if (best) return best

  // 2. dizionario: vince la parola chiave più specifica (più lunga)
  for (const { kw, c, s } of dictionary(categories)) {
    if (contains(text, kw) && (!best || kw.length > best.match.length)) best = { categoryId: c, subId: s, source: 'keyword', match: kw }
  }
  if (best) return best

  // 3. singole parole imparate dalle tue correzioni (es. "yorker" -> Abbigliamento)
  for (const w of text.split(' ')) {
    const v = learned['~' + w]
    if (v && valid(v.c, v.s) && (!best || w.length > best.match.length)) best = { categoryId: v.c, subId: v.s, source: 'word', match: w }
  }
  return best
}

/** Voci da memorizzare quando l'utente sceglie/corregge una categoria. */
export function learnEntries(description: string, c: string, s: string): Learned {
  const text = prepare(description)
  if (!text) return {}
  const out: Learned = { [text]: { c, s } }
  for (const w of text.split(' ')) {
    if (w.length >= 4 && !STOP.has(w) && !STOP.has(normalize(w))) out['~' + w] = { c, s }
  }
  return out
}

/** Testo leggibile di una voce imparata. */
export const learnedLabel = (key: string) => (key.startsWith('~') ? `parola “${key.slice(1)}…”` : `“${key}”`)
