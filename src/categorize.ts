import type { Category, Learned } from './types'
import { normalize } from './utils'

export interface Suggestion {
  categoryId: string
  subId: string
  source: 'learned' | 'keyword'
  match: string
}

function contains(text: string, kw: string): boolean {
  if (!kw) return false
  const padded = ` ${text} `
  // parole corte: devono comparire intere; parole lunghe: basta l'inizio della parola (mcdonald -> mcdonalds)
  return kw.length <= 3 ? padded.includes(` ${kw} `) : padded.includes(` ${kw}`)
}

/** Riconosce categoria e sottocategoria dalla descrizione. */
export function suggestCategory(description: string, categories: Category[], learned: Learned): Suggestion | null {
  const text = normalize(description).replace(/\d+([.,]\d+)?/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return null
  const valid = (c: string, s: string) => categories.some((cat) => cat.id === c && cat.subs.some((x) => x.id === s))

  // 1. quello che hai insegnato tu ha la precedenza
  const exact = learned[text]
  if (exact && valid(exact.c, exact.s)) return { categoryId: exact.c, subId: exact.s, source: 'learned', match: text }
  let best: Suggestion | null = null
  for (const [key, v] of Object.entries(learned)) {
    if (key.length < 3 || !valid(v.c, v.s)) continue
    if (contains(text, key) && (!best || key.length > best.match.length)) {
      best = { categoryId: v.c, subId: v.s, source: 'learned', match: key }
    }
  }
  if (best) return best

  // 2. dizionario di parole chiave: vince la parola più specifica (più lunga)
  for (const cat of categories) {
    for (const s of cat.subs) {
      for (const raw of s.keywords) {
        const kw = normalize(raw)
        if (contains(text, kw) && (!best || kw.length > best.match.length)) {
          best = { categoryId: cat.id, subId: s.id, source: 'keyword', match: kw }
        }
      }
    }
  }
  return best
}

/** Chiave con cui memorizzare una correzione dell'utente. */
export function learnKey(description: string): string {
  return normalize(description).replace(/\d+([.,]\d+)?/g, ' ').replace(/\s+/g, ' ').trim()
}
