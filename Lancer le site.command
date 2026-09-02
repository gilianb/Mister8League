#!/bin/zsh
# Démarre le site de la ligue Mister 8 en local, puis ouvre le navigateur.
export PATH="$HOME/.local/node22/bin:$PATH"
cd "$(dirname "$0")"

echo ""
echo "  👒  Mister 8 Tournament League"
echo "  Démarrage du site sur http://localhost:3000 …"
echo "  (laissez cette fenêtre ouverte ; Ctrl+C pour arrêter)"
echo ""

# Ouvre le navigateur une fois le serveur prêt
( while ! nc -z localhost 3000 2>/dev/null; do sleep 1; done; open "http://localhost:3000" ) &

npm run dev
