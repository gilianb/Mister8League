# Mister 8 Tournament League

Plateforme officielle de la ligue compétitive de Mister 8 TCG (Courbevoie) :
tournois One Piece Card Game & Riftbound, classement de saison, qualification
pour la grande finale.

## Lancer le site en local

Node est installé localement dans `~/.local/node22` (pas d'installation système).

```bash
export PATH="$HOME/.local/node22/bin:$PATH"
npm run dev        # http://localhost:3000
npm run build      # build de production
npx tsc --noEmit   # vérification TypeScript
node --experimental-strip-types scripts/test-bandai-csv.ts  # tests du parseur CSV
```

Le site tourne actuellement en **mode démo** : les données viennent de
`src/lib/data/seed.ts`. Aucun service externe n'est requis.

## Brancher Supabase (à faire pour la mise en ligne)

1. Créer un projet sur [supabase.com](https://supabase.com) (région `eu-west-3` Paris).
2. Exécuter les migrations dans l'éditeur SQL, dans l'ordre :
   `supabase/migrations/0001_schema.sql` puis `0002_seed.sql`.
3. Créer `.env.local` :
   ```
   NEXT_PUBLIC_SUPABASE_URL=…
   NEXT_PUBLIC_SUPABASE_ANON_KEY=…
   ```
4. Basculer les fonctions de `src/lib/data/index.ts` sur les vues SQL
   (`season_standings`, `event_metagame`, `player_deck_stats`) — les
   signatures sont déjà prêtes.

## Import des résultats (Bandai TCG+)

L'export CSV « Classement final » de Bandai TCG+ est parsé par
`src/lib/bandai-csv.ts` :

- matching des joueurs par **numéro de membre Bandai** (clé stable) ;
- bilan V-N-D déduit des « Points gagnants » (3/victoire) et du nombre de rondes ;
- OMW % / OOMW % conservés comme tiebreakers ;
- points de ligue attribués selon le barème configurable de la saison
  (côté SQL : fonction `compute_league_points` + trigger sur `results`).

Le leader joué n'est **pas** dans l'export Bandai : il se complète dans
l'admin après import (nécessaire pour le métagame).

## Design

Deux ambiances issues de la direction retenue :

- **« Le Club »** (base) — fond charbon `#2B2A29`/`#221F1C`, données en or
  paille `#F6C36B`, rouge `#E8392B` réservé à l'action et à la ligne de coupe.
  Typo : Fraunces (display) + Inter.
- **« L'Affiche »** (pages vitrines) — papier crème `#F6EEDC`, cadres doubles,
  rouge affiche `#C9331F`, typo Bevan. Utilisée sur le mode d'emploi, les
  cartes d'événements à venir et le règlement.

Tokens dans `src/app/globals.css` (Tailwind v4, `@theme`).

## Reste à faire (voir phases)

- **Phase 1** : auth Supabase (e-mail + Google), vrai espace joueur, admin
  (CRUD événements, import CSV, matching/fusion joueurs, barème).
- **Phase 2** : decklists top 8, stats avancées, statut de qualification temps réel.
- **Phase 3** : notifications e-mail, badges, page finale de saison.
