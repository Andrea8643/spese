# 💶 Le mie spese

Web app personale per tracciare spese, entrate, budget mensile, risparmi, fondo auto e buoni pasto.
Ad accesso privato: solo l'account Google `foschiniandrea25@gmail.com` può entrare e leggere i dati.

**Indirizzo:** https://andrea8643.github.io/spese/

## Come funziona

- **Entrate → ripartizione automatica** (modificabile in Impostazioni): 60% Risparmi · 20% Necessità · 20% Personale.
  Il budget del mese si calcola sulle entrate registrate nel mese. Finché lo stipendio non è registrato, si usa una stima.
- **Riconoscimento automatico**: scrivi "Burger King 12,50" e l'app propone *Personale › Ristoranti & Fast food*.
  Se correggi la categoria, l'app se lo ricorda.
- **Fine mese**: la quota risparmio (60%) entra nei **Risparmi** in automatico. Il recap mostra quanto è avanzato di
  Personale e Necessità e con il tasto **Versa** lo sposti nei risparmi. Il **Fondo auto** invece è cumulativo: riceve la
  sua quota ogni mese e da lì si pagano assicurazione, bollo, revisione e tagliandi.
- **Buoni pasto**: registri i buoni ricevuti. Quando paghi con i buoni indichi quanti ne hai usati, e l'eventuale resto in euro
  (es. 17 € = 2 buoni + 1 € con carta). Al budget in euro conta solo il resto.
- **Ricorrenti**: abbonamenti e spese fisse registrati in automatico ogni mese o settimana.
- **Recap**: a inizio mese si apre il riepilogo del mese appena finito.

## Configurazione (una volta sola)

1. **Firebase** → https://console.firebase.google.com → *Aggiungi progetto* (piano gratuito Spark).
2. *Authentication* → *Inizia* → *Metodo di accesso* → abilita **Google**.
3. *Authentication* → *Impostazioni* → *Domini autorizzati* → aggiungi `andrea8643.github.io`.
4. *Firestore Database* → *Crea database* (modalità produzione, regione `eur3`) → scheda *Regole* → incolla il contenuto
   di [`firestore.rules`](firestore.rules) → *Pubblica*.
5. *Impostazioni progetto* (⚙️) → *Le tue app* → icona `</>` (Web) → registra l'app → copia i valori di `firebaseConfig`
   in [`src/firebase-config.ts`](src/firebase-config.ts).
6. **GitHub** → repository → *Settings* → *Pages* → *Source*: **GitHub Actions**.

A ogni push su `main` il sito si ricompila e si pubblica da solo.

## Sviluppo

```bash
npm install
npm run dev
```

Senza configurazione Firebase si può usare la *modalità prova* (dati salvati solo nel browser).
