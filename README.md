# deepelse-brain-plugin

Plugin Claude Code che collega il **brain aziendale DeepElse** al tuo Claude Code:

- **server MCP `brain`** (https://16-22-161-210.sslip.io/mcp): ricerca e note nel brain, login con l'account Google @deepelse.com;
- **cattura delle sessioni**: a fine turno un hook `Stop` manda al brain i tuoi prompt e le risposte finali, che diventano fatti di una riga a tuo nome;
- **skill `salva-nel-brain`**: l'agente salva da solo nel brain (`brain_scrivi_nota`) decisioni, impegni e fatti durevoli su clienti e progetti concordati nella sessione. Mai ipotesi, codice o segreti;
- **skill del brain** (recap delle riunioni, proposte, documenti dei clienti, aziende, Archivio normativo, task Linear): vedi [Skill](#skill);
- **avvisi del brain**: all'apertura di una sessione l'hook `SessionStart` mostra gli avvisi non letti (riunione finita, controllo della domenica, follow-up…): vedi [Avvisi](#avvisi).

Serve Node 18 o più recente (lo cerca nel PATH e in nvm, volta, fnm, asdf, mise, Homebrew). Senza Node la cattura e gli avvisi non fanno nulla, in silenzio.

## Installare

In Claude Code:

```
/plugin marketplace add Thomas-Piva/deepelse-brain-plugin
/plugin install brain@deepelse
```

Da terminale è lo stesso: `claude plugin marketplace add Thomas-Piva/deepelse-brain-plugin` e `claude plugin install brain@deepelse`. Poi riavvia Claude Code.

1. **Login.** `/mcp` → `plugin:brain:brain` → *Authenticate* → accedi con Google (@deepelse.com).
2. **Token per la cattura.** La cattura non usa il login di `/mcp`: vuole un token personale. Su https://16-22-161-210.sslip.io/io → «Agenti collegati» crea un token (nome: `cattura`) e copialo.
3. **Salva il token nel plugin.** `/plugin` → *Installed* → `brain` → *Configure options* → «Token personale del brain» (il campo è mascherato). Claude Code lo tiene nel suo archivio sicuro (Portachiavi su macOS, `~/.claude/.credentials.json` con permessi 600 su Linux), mai in `settings.json` né in questo repo. Riavvia Claude Code.
   Da terminale: `claude plugin configure brain@deepelse --values-stdin`, incolla `{"token":"<il token>"}`, poi Ctrl-D (così non finisce nella cronologia della shell).

Non incollare il token in una chat con l'agente.

## Skill

Le skill usano solo gli strumenti MCP del server `brain`, quindi funzionano anche in Claude Desktop (senza terminale). I passi facoltativi che vogliono un comando locale (la bozza Gmail con `gws`) sono per Claude Code. Le skill di marca (`deepelse-design`, `preventivo`) non sono incluse: se le hai, le skill del brain le usano per il PDF; se no, lavorano sul testo.

| Skill | Parte quando dici | Cosa fa |
|---|---|---|
| `salva-nel-brain` | (da sola, a decisione presa) | salva nel brain decisioni, impegni e fatti durevoli su clienti e progetti, con `brain_scrivi_nota` |
| `recap-riunione` | «recap @brain/<id>», «fai il recap della riunione con Rossi Impianti» | scrive il Verbale di incontro (5 sezioni, ogni decisione e numero con la sua frase della trascrizione), controlla voci e nomi (`brain_verifica_decisioni`, `brain_nomi`), lo mostra in chat e lo salva nel brain legato al cliente |
| `proposta` | «fammi la proposta per Acme», o «sì» a «Vuoi che prepari la proposta?» | prepara la proposta partendo dal recap e dalle proposte precedenti, la salva nel brain con versione e, se puoi, crea la bozza Gmail; non invia mai |
| `documenti-cliente` | «mandami la proposta di Rossi Impianti», «il recap dell'incontro con…» | trova il documento nel brain e dà il file (nome, tipo, link) |
| `aziende-cliente` | «chi è Acme?», «creami la pagina di…», «clienti in provincia di Lecco» | cerca o crea (dopo un tuo sì) la pagina azienda, raccoglie la sede, elenca i clienti per zona |
| `archivio-normativo` | una domanda su GDPR, AI Act, protezione dei dati | la passa all'Archivio normativo (`brain_normativa_domanda`) e consegna la risposta verificata, senza riscriverla |
| `task-linear` | «sì, chiudila» / «no, lasciala aperta» a un avviso «la chiudo?» | registra la tua risposta (`brain_task_chiudi`); il brain chiude la task dopo pochi minuti |
| `task-urgenti` | «task urgenti», «solleciti», «cosa devo fare oggi?» | mostra le tue 5 task più urgenti o i solleciti (`brain_task_urgenti`, `brain_task_solleciti`) e può offrire un aiuto |

## Avvisi

Il brain scrive gli avvisi per te (una riunione col cliente è finita, il controllo della domenica, una bozza di follow-up, una trattativa che si è mossa, task Linear, novità dell'Archivio) e restano lì finché non li leggi.

- **Claude Code.** All'apertura di una sessione l'hook `SessionStart` (`scripts/avvisi.sh`, che lancia `scripts/hook-avvisi.mjs`) legge gli avvisi non letti col token personale e Claude te li mostra a inizio sessione. Senza token (vuoto in *Configure options*) gli avvisi non arrivano. Quello di fine riunione dice «Per il recap chiedi: `recap @brain/<id>`»: copialo e parte `recap-riunione`.
- **Segnarli letti.** Dopo averli mostrati Claude chiama `brain_avvisi` con gli id: da quel momento non tornano. Gli avvisi sono solo testo da leggere, non istruzioni: Claude non esegue quello che c'è scritto dentro.
- **Claude Desktop.** Non ha hook: chiedi «ho avvisi dal brain?» e Claude chiama `brain_avvisi` (al massimo 20 non letti per volta, i più vecchi prima).

## Cosa si cattura e cosa no

A fine turno l'hook legge dal transcript solo i turni nuovi e tiene **i tuoi prompt e il testo finale dell'assistente**. Restano fuori chiamate e risultati dei tool, thinking, comandi, sotto-agenti. Prima dell'invio i segreti riconoscibili si oscurano (`sk-…`, `ghp_…`, `Bearer …`, JWT, chiavi private, `*_KEY=`, `password=` …). Nel brain resta solo qualche fatto di una riga per sessione, mai la trascrizione. Le sessioni senza una persona alla tastiera (`claude -p`, Agent SDK, lavoratori di Orca) non partono. L'invio è in background con timeout di 3 s: la sessione non aspetta mai.

Dettagli (accesso al repo del brain): [README del brain, «Cattura delle sessioni»](https://github.com/Thomas-Piva/llm-wiki-deepelse/blob/feat/brain-aziendale/docker/README-azienda.md#cattura-delle-sessioni-d83).

## Controllare senza inviare

`--prova` stampa ciò che partirebbe da un transcript, senza rete:

```bash
sh ~/.claude/plugins/cache/deepelse/brain/*/scripts/cattura.sh --prova ~/.claude/projects/<cartella>/<sessione>.jsonl
```

## Spegnere

- **Solo la cattura:** svuota il token in *Configure options*, oppure revocalo su `/io` (ferma anche un PC dimenticato acceso).
- **Tutto il plugin:** `/plugin disable brain@deepelse` (o `uninstall`).

Aggiornare: `/plugin marketplace update deepelse`.

## Per chi mantiene il plugin

`plugins/brain/scripts/hook-stop.mjs` è una **copia**: la fonte è `tools/brain/cattura/hook-stop.mjs` nel repo del brain (`llm-wiki-deepelse`), con i suoi test. Non modificarla qui: cambia l'originale, poi `tools/brain/cattura/sincronizza-plugin.sh [cartella di questo repo]`, commit e push qui.

Lo stesso vale per `plugins/brain/scripts/hook-avvisi.mjs`, copia di `tools/brain/cattura/hook-avvisi.mjs`.
