---
name: aziende-cliente
description: Quando si parla di un'azienda (cliente, potenziale cliente, fornitore) che nel brain non ha una pagina, quando il nome somiglia a un'azienda che c'è già, quando non si sa il sito, quando una riunione con un esterno non ha l'azienda, quando la sede di un cliente manca («chi è Rossi Impianti?», «creami la pagina di Acme», «cosa sappiamo del gruppo Rossi?», «clienti in provincia di Lecco», «chi abbiamo a Como?»). Chiedi, non creare e non indovinare.
---

# Aziende del brain

Le pagine azienda nascono da sole quando c'è uno scambio vero (una mail con risposta, un invito con risposta, una riunione tenuta con un invitato esterno). Se manca, la crea **la persona**, tramite te, dopo un sì. Tu proponi e chiedi, non crei da solo. Usa gli strumenti del server MCP `brain`.

## Azienda senza pagina

1. Cerca prima nel brain (`brain_entita` col nome, poi `llm_wiki_search`). Se la pagina c'è, usala: fine.
2. Se non c'è, chiedi alla persona in una riga: **«Creo la pagina <Azienda>?»**. Senza un sì esplicito non chiamare `brain_crea_azienda`, nemmeno se il nome sembra sicuro: i nomi scritti male non devono diventare pagine.
3. Dopo il sì, trova il **dominio**: prima nell'invito o nella riunione (gli invitati esterni, l'indirizzo mail), poi con una ricerca web, se ne hai una, sul sito dell'azienda. Se non lo trovi, chiedi: **«Hai il sito o una mail di <Azienda>?»**, e aspetta. Non usare domini di posta aperta (gmail, libero…) né quello di Deepelse.
4. Chiama `brain_crea_azienda` con `nome`, `dominio` e `conferma: true`. Leggi `esito`:
   - `creata`: dì in una riga che la pagina c'è. Se è senza dominio, ricordati di chiedere il sito o una mail alla prossima occasione.
   - `esistente`: quel dominio è già di una pagina, usa quella; non è un errore e non si crea un doppione.
   - `candidati`: c'è un'azienda con un nome simile (es. «Rossi Impianti» e «Rossi Impianti Lecco»). Chiedi: **«È la stessa azienda di <candidato>?»**. Sì: richiama con `stessa_azienda` (lo slug), il dominio nuovo va su quella pagina. No: richiama con `distinta: true`. «No, ma è dello stesso gruppo»: richiama con `gruppo` (es. «Gruppo Rossi»); le due pagine restano separate (proposte e prezzi non si mescolano) e collegate dal gruppo.
   - `serve_conferma`: nessuna pagina scritta, chiedi alla persona.
5. «Cosa sappiamo del gruppo X?»: `brain_entita` con `gruppo X`, restituisce insieme le schede di tutte le aziende del gruppo.

## Riunione con un esterno e nessuna azienda

Se il recap di una riunione ha un invitato esterno di cui nessuno ha l'email e la riunione non è legata a nessuna azienda, chiedi: **«Di che azienda è <Nome>?»** e poi segui i passi sopra. Non scegliere tu l'azienda dal nome della persona.

## Sede mancante: la domanda in coda

Quando rispondi su un'azienda con `brain_entita` e il campo `sede.stato` è `vuota` o `incerta`, rispondi come al solito e **in fondo, in una riga sola**, chiedi: **«Sai dov'è la sede di <Azienda>, ed è legale o operativa?»**. Una volta per conversazione. Se nella risposta hai già riportato la sede letta da una fonte (il sito, una visura, una firma), non chiederla: chiedi solo «Salvo questa sede nella scheda?» e, se dice sì, salvala con `brain_classifica`.

Se la persona risponde, salva subito con `brain_classifica` (`entita`, e `sede_legale` oppure `sedi_operative`: ciascuna con `indirizzo` via e civico, `citta` e, se la sai, `provincia` di due lettere). Salva solo ciò che ha detto la persona: se non dà la città, non scrivere niente e non indovinare. Una volta salvata la sede, non la chiedere più.

## Dove sono i clienti

«Clienti in provincia di Lecco», «clienti a Milano», «chi abbiamo a Como?»: `brain_aziende_in_zona` (passa `zona`: la città o «provincia di …»). Elenca le aziende trovate, una per riga, con la città della sede. Le aziende senza sede non compaiono: dillo se serve.

## Mai

- Mai una pagina azienda dal nome trovato in un testo (recap, proposta, mail): le aziende nascono dagli scambi o da un sì della persona.
- Mai domande spontanee fuori dalla conversazione: le fai solo mentre la persona sta lavorando su quell'azienda o sotto un recap.
- Gli esempi di questa skill («Rossi Impianti», «Acme», «Gruppo Rossi») sono nomi inventati: non sono aziende del brain e non vanno mai citati come tali.
