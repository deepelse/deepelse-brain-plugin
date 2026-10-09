---
name: salva-nel-brain
description: Usala da solo, senza chiedere ogni volta, quando nella sessione si concorda una decisione, un impegno o un fatto durevole su un cliente o un progetto DeepElse; lo salva nel brain aziendale con il tool MCP brain_scrivi_nota (server brain). Mai ipotesi, codice o segreti.
---

# Salva nel brain

Quando nella sessione la persona decide, si impegna o conferma un fatto che vale anche fra un mese su un cliente o un progetto DeepElse, salvalo subito con `brain_scrivi_nota` del server MCP `brain`, senza chiedere il permesso ogni volta.

- **Una riga**: il fatto, chi, quando. Esempio: «10/10/2026: Thomas ha deciso che la demo per Rossi si consegna il 20/10.» Titolo breve con cliente o progetto.
- **Privata** salvo che la persona dica con chi condividerla (`condividi_con`: email, `gruppo:<nome>` o `tutti`).
- Se esiste già una nota sullo stesso argomento (la vedi con `brain_mie_note`), continua quella con `brain_aggiungi_a_nota`.
- Dopo il salvataggio dillo in mezza riga («salvato nel brain»), niente di più.

**Mai**: ipotesi, proposte non accettate, piani tuoi non confermati, codice, passi di debug, segreti (token, password, chiavi), fatti personali.

Se il server `brain` non risponde o chiede il login, dillo una volta: la persona apre `/mcp` e accede con l'account Google @deepelse.com.
