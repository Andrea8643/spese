// ⚙️ Configurazione Firebase (questi valori NON sono segreti: identificano il progetto.
// La protezione dei dati è garantita dalle regole di sicurezza di Firestore).
// Sostituisci i valori con quelli del tuo progetto: Console Firebase → Impostazioni progetto → Le tue app → Web.
export const firebaseConfig = {
  apiKey: 'INSERISCI_API_KEY',
  authDomain: 'INSERISCI.firebaseapp.com',
  projectId: 'INSERISCI_PROJECT_ID',
  storageBucket: 'INSERISCI.appspot.com',
  messagingSenderId: '000000000000',
  appId: 'INSERISCI_APP_ID',
}

/** L'unico account autorizzato ad accedere all'app. */
export const ALLOWED_EMAIL = 'foschiniandrea25@gmail.com'
