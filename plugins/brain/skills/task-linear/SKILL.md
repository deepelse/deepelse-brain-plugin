---
name: task-linear
description: Quando la persona risponde a «la chiudo?» su una task Linear, dice che una task è fatta o non è fatta, o scrive «sì», «no», «chiudila», «lasciala aperta», «DEE-123 è fatta» dopo un avviso del brain sulle task; o chiede «quali task devo chiudere?». Registra la risposta con brain_task_chiudi. Non serve per leggere le task né per crearle.
---

# Chiudere una task Linear

Il brain crea e aggiorna da solo le task su Linear. Non ne chiude mai una da solo: quando pensa che sia fatta, scrive alla persona un avviso (lo vedi con `brain_avvisi`, o te lo mostra l'apertura della sessione): «DEE-123 «[Rossi Impianti] Mandare la proposta» sembra fatta (…). La chiudo?». La risposta della persona arriva a te.

## Quando la persona risponde, o chiede cosa c'è da chiudere

1. Chiama `brain_task_da_chiudere`: dà le task in attesa di risposta di questa persona (`chiave`, `titolo`, `perche`). Se la persona chiede «quali task devo chiudere?», elencale una per riga con il perché e chiedi per ciascuna se la chiude.
2. Se la persona ha nominato una task, o ce n'è una sola, chiama `brain_task_chiudi` con `chiave` e `chiudi`: `true` solo con un sì esplicito, `false` con un no.
3. Se sono più d'una e non si capisce quale, chiedi quale. Un «sì» non vale per tutte.
4. Rispondi in una riga: «Ok, la chiudo tra pochi minuti.» oppure «Ok, resta aperta.»

## Regole

- Mai chiudere senza un sì della persona, nemmeno se dalle fonti sembra evidente.
- La lista è vuota o la task non c'è (lo strumento risponde «nessuna domanda aperta su DEE-123»): dillo in una riga. Non chiudere da altre strade (né con un altro strumento Linear, né a mano).
- Un no non si richiede: per quella task il brain non torna a chiedere.
- Le task su Linear non le cambi tu: niente priorità, etichette, stati o commenti.
