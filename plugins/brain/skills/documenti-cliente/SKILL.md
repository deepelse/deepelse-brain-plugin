---
name: documenti-cliente
description: Quando la persona chiede un documento di un cliente, dalla proposta al recap («mandami la proposta di Rossi Impianti», «che proposta abbiamo fatto ad Acme», «il recap dell'incontro con…», «ho il PDF del preventivo?», «quanto costava…», un allegato, un verbale). Lo trova nel brain e dà il file (nome, tipo e link) con una o due righe, senza riassumerlo in tanti messaggi.
---

# Documenti di un cliente

Proposte, preventivi, recap e allegati mandati ai clienti sono **di tutti** nel brain: chiunque in Deepelse li può avere. Chi li chiede vuole il **file**, non un riassunto. Usa gli strumenti del server MCP `brain`.

## Procedura

1. **Trova il documento solo nel brain** (non nel CRM, non su Drive, non nelle caselle mail: ciò che è stato mandato a un cliente è già lì): `brain_entita` sul cliente (gruppi `documenti` e `mail`, campo `privata` compreso), poi `brain_documento` o `llm_wiki_search` se serve. Prendi la versione più recente, salvo che chiedano una data precisa.
2. **Prendi il file** con `brain_file` (id della Fonte, `@brain/<id>`): restituisce `nome_file`, `mime`, `dimensione` e `url`, non i byte. Se l'`url` è relativo (comincia con `/api/brain/file/`) anteponi l'indirizzo del brain, lo stesso del server MCP `brain`. Il link si apre nel browser con l'accesso Google @deepelse.com al brain.
3. **Rispondi** con:
   - una riga: che cosa è e di quando («Proposta ad Acme, versione dell'08/10.»);
   - il link al file, con il nome del file;
   - solo se la domanda lo chiede esplicitamente (prezzo, ore, scadenze), al massimo tre righe con quei numeri, letti dal testo del documento (`llm_wiki_read_file` sul suo `@brain/<id>`).

   Se il documento è solo testo (un recap salvato da Claude) e la persona vuole leggerlo, mostralo dal testo invece del link.

## Numeri che vengono da una trascrizione

Un fatto che `brain_entita` presenta come «secondo la trascrizione (da verificare): …», o un importo che leggi solo nel testo di una riunione, non è un prezzo concordato: la trascrizione può essere sbagliata. Se lo citi, di' che è «secondo la trascrizione (da verificare)» e, se la domanda era su un prezzo o un impegno, chiedi se c'è una mail o un documento che lo conferma invece di affermarlo.

## Se il file non c'è

- Il documento non è nel brain: dillo in una riga e chiedi chi l'ha mandato. Non inventare prezzi né ore.
- Il brain trova il testo ma non il file originale (`brain_file` non lo trova): dai le tre righe con i numeri e di' che il file non è disponibile.
- Non cercare nelle caselle dei colleghi e non chiedere a loro: ciò che è stato mandato a un cliente è già nel brain per tutti.
