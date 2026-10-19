#!/bin/sh
# Questo repository e' PUBBLICO: i Reference del brain (proposte e recap inviati ai clienti, con nomi e prezzi) non devono mai finirci.
# Rifiuta (exit 1) un albero che contiene file della cartella Reference: un percorso `reference-brain`, un file STORIA.md o originale.*,
# un file di testo col marcatore che il worker del brain scrive in ogni file di testo del Reference.
# Uso: sh scripts/no-reference.sh [cartella]     (default: la radice del repository). Lo lancia la CI (.github/workflows/no-reference.yml); in locale anche come pre-commit.
D=${1:-$(dirname "$0")/..}
M="deepelse-reference-""riservato"   # spezzato: lo script stesso non deve contenere il marcatore intero
T=$(mktemp)
find "$D" -path "$D/.git" -prune -o \( -name reference-brain -o -name STORIA.md -o -name 'originale.*' \) -print > "$T"
grep -rIl --exclude-dir=.git -- "$M" "$D" >> "$T"
if [ -s "$T" ]; then
  echo "RIFIUTATO: file dei Reference del brain in un repository pubblico:"
  sort -u "$T"
  rm -f "$T"; exit 1
fi
rm -f "$T"
echo "nessun file Reference nel repository"
