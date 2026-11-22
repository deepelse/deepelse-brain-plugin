---
name: proposta
description: Proposta Deepelse per un cliente, SOLO quando la persona la chiede («fammi la proposta per Rossi Impianti», «prepara la proposta», «fammi il preventivo per Acme») o risponde sì alla domanda «Vuoi che prepari la proposta?» in fondo a un recap («sì», «vai con la proposta», «preparala», «ok procedi»). Prepara il testo (e il PDF se hai le skill di marca), lo salva nel brain legato al cliente con versione e, se puoi, crea la bozza Gmail verso il referente. Non invia mai niente. A ogni correzione nasce una nuova versione.
---

# Proposta

Si usa **solo** su richiesta esplicita della persona. Un recap di riunione non la fa partire, e non la prepari «già che ci sei». Il sì vale solo se risponde alla domanda «Vuoi che prepari la proposta?» di un recap: un sì a un'altra domanda, o senza quella domanda prima, non vale.

**Dopo un recap**: cliente, riunione e recap sono quelli dell'ultimo recap di questa conversazione. Se non ci sono, cerca nel brain l'ultimo documento `Recap …` del cliente (`brain_entita`, gruppo documenti, o `llm_wiki_search` con «Recap» e il cliente, il più recente). Se i recap recenti sono più d'uno e non capisci quale intenda, chiedi quale in una riga. Parti da decisioni, azioni e prossimo passo del recap e dalla trascrizione della riunione (`llm_wiki_read_file`) per prezzi e perimetro detti a voce.

## Mai

- Non inviare niente: nessun `drafts send`, `messages send`, `+send`, nessun invio da qui. La mail la manda la persona dalla sua casella, dopo aver letto la bozza.
- Non inventare prezzi, persone o date: dal listino o dal brain, altrimenti segnaposto fra quadre (`[prezzo da validare]`), e li elenchi alla persona. Mai il prezzo di un altro cliente copiato.
- Non usare Drive: il documento sta nel brain.
- Non dare per concordato un importo, una percentuale o un impegno che trovi **solo** in una trascrizione o in un fatto «secondo la trascrizione (da verificare)»: la trascrizione può essere sbagliata. Senza una seconda fonte (mail, documento, listino) non lo affermi: lo chiedi alla persona in una riga e intanto resta un segnaposto da validare.

## Procedura

1. **Cliente e contesto.** `brain_entita` col nome del cliente (non `brain_risolvi`): azienda, persone e referenti, riunioni e fatti, documenti già salvati (una proposta precedente = si parte da lì), sezione **Lezioni** (applicale: valgono per questo cliente e per le proposte in generale). Poi `brain_lezioni` (`entita`, `tipo_lavoro` = `proposta`) e `brain_procedura` (`entita`, o `settore` / `tipo_lavoro`) per la procedura e i casi simili. Leggi anche il recap dell'ultima riunione.
2. **Proposte precedenti.** Parti dalle due o tre più vicine (stesso cliente, poi stesso settore o tipo di lavoro): quelle del cliente le trovi in `brain_entita` (documenti), le altre con `brain_documento` e `llm_wiki_search` («proposta», «preventivo», il settore). Poi `brain_reference` con `tipo` = `proposta` e `cliente`: dà i tre Reference più vicini, proposte davvero inviate; leggi di ciascuno `testo` e `storia` (`id` + `parte`). Prima viene il brain, poi i Reference; sono esempi di struttura, pacchetti, ore e correzioni, mai la regola, e i prezzi sono quelli di quel cliente. Di' alla persona in una riga da quali sei partito. Con «basati sulle proposte precedenti» è questo passo, fatto con più cura.
3. **Dati del deal.** Quelli che il brain non ha li chiedi alla persona, tutti in una volta: dipendenti, persone coinvolte, esigenze, pacchetto, prossimo passo, referente.
4. **Scrivi la proposta.** Se hai la skill `preventivo` (e `deepelse-design`), usala: modello, listino, testi con lo standard di Giovanni (voi formale, controlli di scrittura) e PDF col marchio. Senza, scrivi il testo in markdown con la struttura delle proposte più vicine e i prezzi solo se vengono dal listino o dalla persona; il resto `[prezzo da validare]`. Riporta alla persona i segnaposto rimasti e le voci da validare.
5. **Salva nel brain** con `brain_salva_documento`: `titolo` = `Proposta <Cliente>` (sempre lo stesso: stesso titolo e stessa entità = nuova versione), `entita` = il cliente, `testo` = il testo leggibile della proposta in markdown (serve alla ricerca), e dalla seconda versione `motivo` = la correzione della persona in una frase («a Rossi Impianti prezzo a corpo»). Il PDF non si passa al brain (è troppo pesante da copiare in una chiamata): resta alla persona e va in allegato alla bozza. Il brain tiene tutte le versioni, legate a cliente, autore e data.
6. **Bozza Gmail** (facoltativa: se hai un connettore Gmail, o in Claude Code il comando `gws` della skill `google-workspace`). Senza, dai alla persona oggetto e corpo da copiare.
   - Destinatario: il referente preso dalla pagina del cliente (persone). Se non c'è un indirizzo sicuro, **la bozza resta senza destinatario** e lo dici; non indovinare.
   - Oggetto `Proposta Deepelse per <Cliente>`. Corpo di 60-150 parole, prima frase = perché si scrive, un prossimo passo con la data; il registro con il referente lo chiedi se non è noto. Se la skill `deepelse-design` c'è, segui la sua guida per le mail.
   - Il corpo va scritto su file e usato da lì, mai incollato inline fra apici nel comando (mangia apostrofi e accenti: «l'endpoint», «perché»). Allegato: l'ultimo PDF. Con `gws`: costruisci l'`.eml` con `email.message.EmailMessage` e poi `gws gmail users drafts create --params '{"userId":"me"}' --upload bozza.eml`.
   - **Correzione = aggiornamento, non una seconda bozza**: cerca la bozza esistente per oggetto esatto (`drafts list`, poi `get`); se c'è, `drafts update` con l'id trovato; se no, creala.
   - Rileggi la bozza (`drafts get`): destinatario, oggetto, corpo e nome dell'allegato, prima di dire che è fatta.
7. **Rispondi**: versione salvata nel brain, bozza pronta nella tua casella (destinatario o «senza destinatario») o testo da copiare, segnaposto e voci da validare, e che la mail la invii tu. Mai «inviata».

## Quando la persona corregge

Ogni correzione («a Rossi Impianti il prezzo a corpo, non a giorni») riparte dal punto 4 con lo stesso titolo: versione v2, v3… nel brain con la differenza e il `motivo`, bozza aggiornata con l'ultima. Il brain tiene la correzione come lezione; se vale oltre questo cliente, dillo alla persona. Quando la persona invia la mail, il brain legge l'allegato inviato e lo lega alla mail: non devi fare niente.
