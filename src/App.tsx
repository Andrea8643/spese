import { onAuthStateChanged, type User } from 'firebase/auth'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AddTx } from './AddTx'
import { ALLOWED_EMAIL } from './firebase-config'
import { auth, isConfigured, login, logout } from './firebase'
import { BarChart3, House, ListOrdered, PiggyBank, Plus, Settings2, type LucideIcon } from 'lucide-react'
import { Home } from './pages/Home'
import { Movements } from './pages/Movements'
import { Report } from './pages/Report'
import { Savings } from './pages/Savings'
import { SettingsPage } from './pages/SettingsPage'
import { Recap } from './Recap'
import { firestoreBackend, localBackend, safeGet, safeSet, useStore, type Backend } from './store'
import type { Tx } from './types'
import { Ctx, useToast, type Page } from './ui'
import { addMonths, currentMonth } from './utils'

const NAV: [Page, string, LucideIcon][] = [
  ['home', 'Home', House],
  ['movimenti', 'Movimenti', ListOrdered],
  ['bilancio', 'Bilancio', BarChart3],
  ['risparmi', 'Risparmi', PiggyBank],
  ['impostazioni', 'Impostazioni', Settings2],
]

const Aurora = () => <div className="aurora" aria-hidden="true"><span /><span /><span /></div>

const demoAllowed = !isConfigured || import.meta.env.VITE_DEMO === '1'

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(isConfigured ? undefined : null)
  const [demo, setDemo] = useState(() => demoAllowed && safeGet('spese-demo') === '1')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, async (u) => {
      if (u && u.email?.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
        setErr(`L'account ${u.email} non è autorizzato.`)
        await logout()
        return
      }
      setUser(u)
    })
  }, [])

  const backend = useMemo<Backend | null>(() => (demo ? localBackend() : user ? firestoreBackend(user.uid) : null), [demo, user])

  if (user === undefined && !demo) return <Splash />
  if (!backend) {
    return (
      <div className="login">
        <Aurora />
        <div className="login-card">
          <div className="brand-mark">€</div>
          <h1>Le mie spese</h1>
          <p className="text2">Budget, spese e risparmi. Accesso privato.</p>
          {isConfigured ? (
            <button className="btn btn-primary btn-block" style={{ marginTop: 18, minHeight: 50 }} onClick={() => login().catch((e) => setErr(String(e?.message ?? e)))}>
              <GoogleG /> Accedi con Google
            </button>
          ) : (
            <div className="card small text2" style={{ marginTop: 18, textAlign: 'left' }}>
              ⚙️ Firebase non è ancora configurato. Inserisci i dati del progetto in <code>src/firebase-config.ts</code>.
              <button className="btn btn-block" style={{ marginTop: 12 }} onClick={() => { safeSet('spese-demo', '1'); setDemo(true) }}>Prova l'app (dati solo in questo browser)</button>
            </div>
          )}
          {isConfigured && demoAllowed && (
            <button className="btn btn-block" style={{ marginTop: 12 }} onClick={() => { safeSet('spese-demo', '1'); setDemo(true) }}>Modalità test</button>
          )}
          {err && <p className="small neg" style={{ marginTop: 14 }}>{err}</p>}
        </div>
      </div>
    )
  }
  return <Shell backend={backend} demo={demo} email={user?.email} />
}

function Shell({ backend, demo, email }: { backend: Backend; demo: boolean; email?: string | null }) {
  const store = useStore(backend)
  const [page, setPage] = useState<Page>('home')
  const [adding, setAdding] = useState<Partial<Tx> | null>(null)
  const [recapMonth, setRecapMonth] = useState<string | null>(null)
  const toast = useToast()
  const openAdd = useCallback((tx?: Partial<Tx>) => setAdding(tx ?? {}), [])
  const go = useCallback((p: Page) => { setPage(p); window.scrollTo({ top: 0 }) }, [])
  const [fatal, setFatal] = useState<string | null>(null)
  const showToast = toast.show
  useEffect(() => {
    const onErr = (e: Event) => showToast(`⚠ Errore: ${(e as CustomEvent).detail}`)
    const onFatal = (e: Event) => setFatal(String((e as CustomEvent).detail))
    window.addEventListener('spese-error', onErr)
    window.addEventListener('spese-fatal', onFatal)
    return () => { window.removeEventListener('spese-error', onErr); window.removeEventListener('spese-fatal', onFatal) }
  }, [showToast])

  // a inizio mese mostra il recap del mese appena finito
  useEffect(() => {
    if (store.loading) return
    const prev = addMonths(currentMonth(), -1)
    const s = store.settings
    if (prev >= s.startMonth && !(s.recapSeen ?? []).includes(prev)) {
      setRecapMonth(prev)
      void backend.saveSettings({ ...s, recapSeen: [...(s.recapSeen ?? []), prev].slice(-24) })
    }
  }, [store.loading, store.settings, backend])

  if (fatal && store.loading) {
    return (
      <div className="login">
        <Aurora />
        <div className="login-card card">
          <h1 style={{ fontSize: 22 }}>Non riesco a leggere i dati</h1>
          <p className="small text2">Motivo: <code>{fatal}</code></p>
          <p className="xs muted">Se dice “permission-denied”, controlla le regole di sicurezza di Firestore o di aver fatto l'accesso con l'account giusto.</p>
          <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
            <button className="btn" onClick={() => location.reload()}>Riprova</button>
            <button className="btn btn-ghost" onClick={() => logout()}>Esci</button>
          </div>
        </div>
      </div>
    )
  }
  if (store.loading) return <Splash />

  const ctx = { ...store, backend, demo, openAdd, toast: toast.show, go }
  return (
    <Ctx.Provider value={ctx}>
      <Aurora />
      <div className="app">
        <aside className="sidebar">
          <div className="brand"><span className="brand-mark">€</span> Le mie spese</div>
          {NAV.map(([p, l, I]) => (
            <button key={p} className={`side-link ${page === p ? 'active' : ''}`} onClick={() => go(p)}><I /> {l}</button>
          ))}
          <button className="btn btn-primary side-add" onClick={() => openAdd()}><Plus /> Nuovo movimento</button>
          {demo && <div className="xs muted" style={{ marginTop: 'auto', padding: 8 }}>Modalità test</div>}
        </aside>
        <main className="main">
          <div className="page" key={page}>
            {page === 'home' && <Home />}
            {page === 'movimenti' && <Movements />}
            {page === 'bilancio' && <Report />}
            {page === 'risparmi' && <Savings />}
            {page === 'impostazioni' && <SettingsPage email={email} />}
          </div>
        </main>
        <nav className="tabbar" aria-label="Navigazione">
          {NAV.slice(0, 2).map(([p, l, I]) => (
            <button key={p} className={`tab ${page === p ? 'active' : ''}`} onClick={() => go(p)} aria-label={l}><I /><span>{l}</span></button>
          ))}
          <button className="tab-add" onClick={() => openAdd()} aria-label="Nuovo movimento"><Plus strokeWidth={2.6} /></button>
          {NAV.slice(2, 4).map(([p, l, I]) => (
            <button key={p} className={`tab ${page === p ? 'active' : ''}`} onClick={() => go(p)} aria-label={l}><I /><span>{l}</span></button>
          ))}
        </nav>
      </div>
      {adding && <AddTx initial={adding} onClose={() => setAdding(null)} />}
      {recapMonth && <Recap month={recapMonth} onClose={() => setRecapMonth(null)} />}
      {toast.msg && <div className="toast" role="status">{toast.msg}</div>}
    </Ctx.Provider>
  )
}

function Splash() {
  return <div className="login"><div className="login-card"><div className="brand-mark">€</div></div></div>
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  )
}
