#!/usr/bin/env node
// Hook `Stop` di Claude Code per la cattura delle sessioni nel brain aziendale (D83). Node, nessuna dipendenza, nessun modello.
//
// Claude Code lo lancia a fine turno con un JSON su stdin (session_id, transcript_path, cwd). Legge il transcript dall'ultimo offset
// (~/.cache/brain-cattura/<sessione>.json), tiene i prompt della persona e il testo finale dell'assistente (niente tool_use/tool_result/thinking,
// promemoria di sistema, comandi, sotto-agenti), oscura i segreti, taglia i pezzi lunghi e li manda a $BRAIN_URL/api/brain/cattura col token
// personale di $BRAIN_CATTURA_TOKEN (lo passa il plugin Claude Code deepelse-brain-plugin) o di ~/.config/brain-cattura/token. L'invio e' in un processo figlio staccato (timeout 3 s): il hook esce subito e sempre con 0,
// qualunque cosa succeda. L'offset avanza solo dopo una risposta 2xx (lo scrive il figlio).
// Solo sessioni con una persona alla tastiera: `claude -p`, Agent SDK, `claude mcp serve`, GitHub Action (CLAUDE_CODE_ENTRYPOINT o il campo `entrypoint`
// delle righe del transcript) e i lavoratori smistati da Orca (preambolo di Orca nel primo prompt) non partono, perche' i loro prompt li scrive un
// programma o un altro agente e finirebbero nel brain come detti dalla persona. BRAIN_CATTURA_FORZA=1 le manda lo stesso.
//
//   node hook-stop.mjs                         (da Claude Code: JSON su stdin)
//   node hook-stop.mjs --prova <transcript>    stampa cio' che manderebbe dell'intero transcript, senza rete e senza cache
import { spawn } from "node:child_process"
import { closeSync, fstatSync, mkdirSync, openSync, readFileSync, readSync, renameSync, rmSync, writeFileSync, writeSync } from "node:fs"
import { homedir } from "node:os"
import { basename, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const PEZZO_MAX = 4000          // caratteri per pezzo: oltre si taglia (il brain ne accetta 8000)
const PEZZI_MAX = 100           // per invio: il resto parte al prossimo Stop (il brain ne accetta 200)
const BYTE_MAX = 200_000        // testo per invio (il brain accetta 512 KB di JSON)
const LETTURA_MAX = 32 * 1024 * 1024
const TIMEOUT_MS = 3000
const SESSIONE = /^[A-Za-z0-9_-]{1,100}$/
const CONTROLLO = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g
const COMANDO = /^\s*<(command-name|command-message|command-args|local-command-[a-z]+|bash-[a-z]+|task-notification|user-prompt-submit-hook)\b/
const PROMEMORIA = /<system-reminder>[\s\S]*?<\/system-reminder>/g
const NON_INTERATTIVO = /^(sdk-|mcp$|claude-code-github-action$)/ // sdk-cli = claude -p, sdk-ts/sdk-py = Agent SDK (Claude Code 2.1)
const ORCA_LAVORATORE = "You are working inside Orca, a multi-agent IDE." // lo stesso prefisso con cui Orca riconosce i suoi prompt di smistamento
/** La sessione e' guidata da un programma, non da una persona (valore di CLAUDE_CODE_ENTRYPOINT o del campo `entrypoint` di una riga). */
export const nonInterattiva = (entrypoint) => NON_INTERATTIVO.test(String(entrypoint ?? ""))

const O = "[oscurato]"
const SEGRETI = [
  [/-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z0-9 ]*PRIVATE KEY-----|$)/g, "[chiave privata oscurata]"],
  [/\b(?:sk|rk|pk)-(?:[A-Za-z0-9]+-)*[A-Za-z0-9_]{16,}(?:-[A-Za-z0-9_]+)*/g, O], // sk-..., sk-ant-api03-..., sk-or-v1-..., sk-proj-..., coda compresa
  [/\bABSK[A-Za-z0-9+/=]{20,}/g, O],                                     // chiave API di Amazon Bedrock
  [/\b(?:gsk|xai|pplx|tvly|nvapi|r8|fw|csk|jina)[_-][A-Za-z0-9]{20,}/g, O],  // chiavi con prefisso del fornitore (Groq, xAI, Perplexity, Tavily, NVIDIA, Replicate, Fireworks, Cerebras, Jina) anche senza «key:» davanti
  [/\bgh[pousr]_[A-Za-z0-9]{20,}/g, O],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}/g, O],
  [/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, O],
  [/\bxox[abposr]-[A-Za-z0-9-]{10,}/g, O],
  [/\bAIza[0-9A-Za-z_-]{35}/g, O],
  [/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, O],   // JWT
  [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi, `$1 ${O}`],
  [/(\w+:\/\/)[^\s/:@]+:[^\s/@]+@/g, `$1${O}@`],                          // utente:password@ negli URL
  // NOME_KEY=, NOME_TOKEN=, NOME_SECRET=, password= ... (anche in JSON e YAML): il valore, il nome resta
  // anche in Markdown e a parole: `Password: \`x\``, `| Password | \`x\` |`, «con password \`x\`», «la password è x», «the password is x»
  [/(\b[A-Za-z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|PASSWD|PWD)\b|\b(?:password|passwd|pwd|secret|token|api[_-]?key)\b)(["'`*]*[ \t]*(?:[:=|]|[ \t](?:è|e'|is)(?=[ \t])|(?<=[ \t])(?=[`"']))[ \t]*["'`*]*)(?!\[)([^\s"'`,;*|]{4,})/gi, `$1$2${O}`],
  // stringa lunga con maiuscole, minuscole e cifre insieme (token, chiave in base64): meglio un id oscurato in piu' che una chiave in chiaro.
  // Hash esadecimali, UUID e percorsi non hanno le tre classi in 32 caratteri di fila e restano.
]
const CODICE_LUNGO = /(?<![A-Za-z0-9+/_-])(?=[A-Za-z0-9+]*\d)(?=[A-Za-z0-9+]*[a-z])(?=[A-Za-z0-9+]*[A-Z])[A-Za-z0-9+]{32,}={0,2}/g

/** Toglie dal testo i segreti piu' comuni. Meglio oscurare troppo: il testo serve solo a ricavarne fatti.
 *  codiciLunghi: false lascia le stringhe lunghe senza nome davanti (id nei link), per oscura-fonti.ts --solo-credenziali (#428). */
export function oscura(testo, { codiciLunghi = true } = {}) {
  let t = String(testo)
  for (const [re, con] of SEGRETI) t = t.replace(re, con)
  return codiciLunghi ? t.replace(CODICE_LUNGO, O) : t
}

const pulisci = (t) => {
  const s = oscura(t.replace(CONTROLLO, "")).trim()
  return s.length > PEZZO_MAX ? `${s.slice(0, PEZZO_MAX)} […]` : s
}

/** Prompt scritto dalla persona (null per tutto il resto: meta, comandi, risultati dei tool, notifiche, sotto-agenti, riassunti di compattazione). */
function testoUtente(e) {
  if (e?.type !== "user" || e.isMeta || e.isSidechain || e.isCompactSummary || e.isVisibleInTranscriptOnly) return null
  if (e.origin && e.origin.kind !== "human") return null
  const c = e.message?.content
  const t = (typeof c === "string" ? c : Array.isArray(c) ? c.filter((b) => b?.type === "text").map((b) => String(b.text ?? "")).join("\n") : "").replace(PROMEMORIA, "")
  if (COMANDO.test(t) || /^\s*\[Request interrupted/.test(t)) return null
  return t.trim() || null
}

/** Testo di una risposta dell'assistente (solo blocchi `text`, mai thinking ne' tool_use). */
function testoAssistente(e) {
  if (e?.type !== "assistant" || e.isSidechain || e.isApiErrorMessage || !Array.isArray(e.message?.content)) return null
  return e.message.content.filter((b) => b?.type === "text").map((b) => String(b.text ?? "")).join("\n").trim() || null
}

/**
 * Pezzi dal transcript letto dall'offset (`buf`), `riga0` = indice della prima riga di `buf`. Solo righe complete. Per ogni turno (fra due prompt della
 * persona) resta l'ultimo testo dell'assistente: quello finale. Con i tetti ci si ferma al confine di un turno e il resto va al prossimo Stop.
 * Restituisce i pezzi, i byte consumati, l'indice della prossima riga e `lavoratore`: una riga scritta da `claude -p`/Agent SDK o un prompt di Orca.
 */
export function estrai(buf, riga0 = 0, limiti = {}) {
  const maxPezzi = limiti.maxPezzi ?? Infinity, maxByte = limiti.maxByte ?? Infinity
  const pezzi = []
  let pos = 0, riga = riga0, byte = 0, sospeso = null, lavoratore = false
  const chiudi = () => { if (sospeso) { pezzi.push(sospeso); byte += Buffer.byteLength(sospeso.testo); sospeso = null } }
  for (;;) {
    const nl = buf.indexOf(10, pos)
    if (nl < 0) break // riga incompleta: il transcript si sta ancora scrivendo
    let e = null
    try { e = JSON.parse(buf.toString("utf8", pos, nl)) } catch { /* riga rotta: si salta */ }
    const quando = typeof e?.timestamp === "string" ? e.timestamp : new Date().toISOString()
    if (nonInterattiva(e?.entrypoint)) lavoratore = true
    const u = testoUtente(e)
    if (u?.startsWith(ORCA_LAVORATORE)) lavoratore = true
    if (u !== null) {
      chiudi()
      if (pezzi.length >= maxPezzi || byte >= maxByte) break // questo turno parte al prossimo Stop, da questa riga
      const testo = pulisci(u)
      if (testo) { pezzi.push({ ordine: riga, ruolo: "utente", testo, quando }); byte += Buffer.byteLength(testo) }
    } else {
      const a = testoAssistente(e)
      const testo = a === null ? "" : pulisci(a)
      if (testo) sospeso = { ordine: riga, ruolo: "assistente", testo, quando }
    }
    pos = nl + 1; riga++
  }
  chiudi()
  return { pezzi, byte: pos, righe: riga, lavoratore }
}

const dirCache = () => join(homedir(), ".cache/brain-cattura")
const fileCache = (s) => join(dirCache(), `${s}.json`)
const leggiToken = () => { try { return process.env.BRAIN_CATTURA_TOKEN?.trim() || readFileSync(join(homedir(), ".config/brain-cattura/token"), "utf8").trim() } catch { return "" } }
function leggiStato(s) {
  try { const o = JSON.parse(readFileSync(fileCache(s), "utf8")); if (Number.isInteger(o.offset) && Number.isInteger(o.riga) && o.offset >= 0 && o.riga >= 0) return { offset: o.offset, riga: o.riga, escluso: o.escluso === true } } catch { /* nessuna cache: dall'inizio */ }
  return { offset: 0, riga: 0 }
}
/** L'offset non torna mai indietro (due invii della stessa sessione possono finire in ordine inverso), salvo `forza`: transcript ripartito da zero.
 *  Scrittura atomica, 600. */
function scriviStato(s, nuovo, forza = false) {
  if (!forza && leggiStato(s).offset >= nuovo.offset) return
  mkdirSync(dirCache(), { recursive: true, mode: 0o700 })
  const tmp = `${fileCache(s)}.${process.pid}.tmp`
  writeFileSync(tmp, JSON.stringify(nuovo), { mode: 0o600 })
  renameSync(tmp, fileCache(s))
}

function leggiDa(percorso, offset) {
  const fd = openSync(percorso, "r")
  try {
    const dim = fstatSync(fd).size
    const da = dim < offset ? 0 : offset // transcript riscritto o troncato: si riparte (il brain scarta i pezzi gia' visti per `ordine`)
    const buf = Buffer.alloc(Math.min(dim - da, LETTURA_MAX))
    const letti = buf.length > 0 ? readSync(fd, buf, 0, buf.length, da) : 0
    return { buf: buf.subarray(0, letti), da }
  } finally { closeSync(fd) }
}

function leggiStdin() {
  return new Promise((ok) => {
    let s = ""
    const fine = setTimeout(() => ok(s), 2000) // stdin mai chiuso: si rinuncia, non si blocca la sessione
    process.stdin.setEncoding("utf8")
    process.stdin.on("data", (d) => { s += d })
    process.stdin.on("end", () => { clearTimeout(fine); ok(s) })
    process.stdin.on("error", () => { clearTimeout(fine); ok(s) })
  })
}

async function daClaudeCode() {
  const ingresso = JSON.parse(await leggiStdin())
  const sessione = String(ingresso?.session_id ?? ""), transcript = ingresso?.transcript_path
  const url = process.env.BRAIN_URL, forzata = process.env.BRAIN_CATTURA_FORZA === "1"
  if (!forzata && nonInterattiva(process.env.CLAUDE_CODE_ENTRYPOINT)) return
  if (!SESSIONE.test(sessione) || typeof transcript !== "string" || !url || !leggiToken()) return
  const stato = leggiStato(sessione)
  if (stato.escluso && !forzata) return
  const { buf, da } = leggiDa(transcript, stato.offset)
  const riga0 = da === stato.offset ? stato.riga : 0
  const r = estrai(buf, riga0, { maxPezzi: PEZZI_MAX, maxByte: BYTE_MAX })
  const nuovo = { offset: da + r.byte, riga: r.righe }, forza = da !== stato.offset
  if (r.lavoratore && !forzata) { scriviStato(sessione, { ...nuovo, escluso: true }, true); return } // e per sempre: i turni dopo sono del coordinatore
  if (r.pezzi.length === 0) { if (nuovo.offset !== stato.offset) scriviStato(sessione, nuovo, forza); return }
  mkdirSync(dirCache(), { recursive: true, mode: 0o700 })
  const lavoro = join(dirCache(), `${sessione}.${process.pid}.invio.json`) // niente token qui: il figlio lo rilegge (ambiente ereditato o file)
  writeFileSync(lavoro, JSON.stringify({ url, sessione, stato: nuovo, forza, corpo: { sessione, cwd: String(ingresso.cwd ?? "").slice(0, 500), pezzi: r.pezzi } }), { mode: 0o600 })
  spawn(process.execPath, [fileURLToPath(import.meta.url), "--invia", lavoro], { detached: true, stdio: "ignore" }).unref()
}

/** Nel figlio staccato. 2xx: offset avanti. 400/413: il brain non accettera' mai questi pezzi, si va avanti lo stesso (altrimenti la sessione resta ferma
 *  per sempre). 401/403/429/5xx o rete: offset fermo, il prossimo Stop rimanda. */
async function invia(lavoro) {
  const l = JSON.parse(readFileSync(lavoro, "utf8"))
  rmSync(lavoro, { force: true })
  const token = leggiToken()
  if (!token) return
  const r = await fetch(`${String(l.url).replace(/\/+$/, "")}/api/brain/cattura`, {
    method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(l.corpo), signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (r.ok || r.status === 400 || r.status === 413) scriviStato(l.sessione, l.stato, l.forza === true)
}

function prova(transcript) {
  const buf = readFileSync(transcript)
  const cwd = buf.toString("utf8").split("\n").map((l) => { try { return JSON.parse(l).cwd } catch { return undefined } }).find((c) => typeof c === "string") ?? ""
  // scrittura sincrona: process.exit subito dopo troncherebbe una scrittura asincrona su una pipe
  const { pezzi, lavoratore } = estrai(buf)
  writeSync(1, `${JSON.stringify({ sessione: basename(transcript, ".jsonl"), cwd, escluso: lavoratore, pezzi: lavoratore ? [] : pezzi }, null, 2)}\n`)
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const [modo, arg] = process.argv.slice(2)
  const lavoro = modo === "--prova" ? Promise.resolve().then(() => prova(arg)) : modo === "--invia" ? invia(arg) : daClaudeCode()
  // Mai un errore verso Claude Code: qualunque cosa succeda si esce con 0 e senza scrivere nulla (tranne --prova, che stampa).
  lavoro.catch(() => {}).finally(() => process.exit(0))
}
