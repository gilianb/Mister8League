#!/bin/zsh
# Connecte ce Mac à votre compte GitHub (à ne faire qu'une fois).
export PATH="$HOME/.local/node22/bin:$PATH"

echo ""
echo "  🔑  Connexion à GitHub"
echo ""
echo "  1. Un code à 8 caractères va s'afficher ci-dessous (ex. A1B2-C3D4)"
echo "  2. Appuyez sur Entrée : le navigateur s'ouvre sur github.com"
echo "  3. Connectez-vous si besoin, puis recopiez le code"
echo ""

gh auth login --hostname github.com --git-protocol https --web

echo ""
if gh auth status > /dev/null 2>&1; then
  echo "  ✅  C'est bon, vous êtes connecté ! Vous pouvez fermer cette fenêtre."
else
  echo "  ❌  La connexion n'a pas abouti — réessayez en double-cliquant à nouveau."
fi
echo ""
read -k 1 "?Appuyez sur une touche pour fermer…"
