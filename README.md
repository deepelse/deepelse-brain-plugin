# deepelse-brain-plugin

Plugin Claude Code che collega il **brain aziendale DeepElse** al tuo Claude Code:

- **server MCP `brain`** (https://16-22-161-210.sslip.io/mcp): ricerca e note nel brain, login con l'account Google @deepelse.com;
- **cattura delle sessioni**: a fine turno un hook `Stop` manda al brain i tuoi prompt e le risposte finali, che diventano fatti di una riga a tuo nome;
- **skill `salva-nel-brain`**: l'agente salva da solo nel brain (`brain_scrivi_nota`) decisioni, impegni e fatti durevoli su clienti e progetti concordati nella sessione. Mai ipotesi, codice o segreti.

Serve Node 18 o più recente (lo cerca nel PATH e in nvm, volta, fnm, asdf, mise, Homebrew). Senza Node la cattura non fa nulla, in silenzio.

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
