#!/bin/sh
# Stop hook of the brain plugin: finds node and runs the bundled hook-stop.mjs (a copy, see README).
# Never fails the session: without node it exits 0 silently. The token arrives as the plugin option
# (userConfig "token", kept in Claude Code's secure store) in the environment, never on the command line.
NODE=$(command -v node 2>/dev/null)
if [ -z "$NODE" ]; then
  # Hook shells often lack the nvm/volta PATH. nvm: the highest installed version (glob order would put v4 after v24).
  NODE=$({ ls -d "$HOME"/.nvm/versions/node/*/bin/node | sort -V | tail -n 1; } 2>/dev/null)
fi
if [ -z "$NODE" ]; then
  for n in "$HOME/.volta/bin/node" "$HOME/.local/share/fnm/aliases/default/bin/node" "$HOME/.asdf/shims/node" \
           "$HOME/.local/share/mise/shims/node" /opt/homebrew/bin/node /usr/local/bin/node /usr/bin/node; do
    [ -x "$n" ] && { NODE=$n; break; }
  done
fi
[ -n "$NODE" ] || exit 0
export BRAIN_URL="${BRAIN_URL:-https://16-22-161-210.sslip.io}"
[ -n "$CLAUDE_PLUGIN_OPTION_TOKEN" ] && export BRAIN_CATTURA_TOKEN="$CLAUDE_PLUGIN_OPTION_TOKEN"
exec "$NODE" "$(dirname "$0")/hook-stop.mjs" "$@"
