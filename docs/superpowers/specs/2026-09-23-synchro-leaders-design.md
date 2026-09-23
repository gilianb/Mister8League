# Synchronisation des leaders depuis optcgapi.com

Date : 2026-09-23

## Problème

Les leaders vivaient à trois endroits (table `leaders`, catalogue TypeScript
`src/lib/data/leaders.ts`, images dans `public/leaders/`), tous produits une
seule fois par `scripts/build-leaders-catalog.mjs`. Ce script lit un dossier
local sur le Mac d'un associé et un JSON issu d'une identification visuelle :
il est impossible à relancer. Chaque nouvelle extension (OP17 manque déjà)
demandait une mise à jour manuelle à trois endroits.

## Décisions (validées par le propriétaire)

- **Source de vérité : la table `leaders`.** Le catalogue TypeScript et le
  script de génération sont supprimés. `LeaderChip` n'utilise plus que le nom
  et l'image fournis par la base (tous ses appelants les passent déjà).
- **Source externe : optcgapi.com** (`/api/allSetCards/` + `/api/allSTCards/`),
  API publique sans clé, mise à jour quotidiennement, qui couvre les 132
  leaders existants et les 6 d'OP17.
- **Images : Supabase Storage**, bucket public `leader-images`, chemin
  `one-piece/<CODE>.<ext>`. On ne dépend pas de la disponibilité d'optcgapi
  pour l'affichage et on ne grossit plus le dépôt git.
- **Déclenchement : uniquement un bouton admin** sur `/admin/leaders`. Pas de
  script CLI.

## Règles de synchronisation

1. Télécharger les deux listes, garder `card_type === "Leader"`.
2. Plusieurs lignes par code (Parallel, Alternate Art, SPR…) : garder
   l'impression de base, c'est-à-dire en priorité `card_image_id === code`,
   puis un nom sans mention de variante, puis l'identifiant d'image le plus
   court.
3. Nettoyer le nom : retirer les suffixes ` (001)`, ` (Parallel)`,
   ` (Alternate Art)`, ` (OP15-098)`, ` - OP14-001`, répétés.
4. Traduire les couleurs : Red→Rouge, Green→Vert, Blue→Bleu, Purple→Violet,
   Black→Noir, Yellow→Jaune.
5. Pour chaque leader :
   - **absent de la base** : insertion (code, nom, couleurs) puis image ;
   - **présent** : nom mis à jour s'il diffère ; couleurs mises à jour si
     l'ensemble diffère (l'ordre seul ne compte pas) ;
   - **image** : téléversée si `image_url` ne pointe pas déjà vers le bucket
     `leader-images` (première synchro = migration des 132 images).
6. Les lignes existantes gardent leur `id` : decks, inscriptions et résultats
   restent liés. Aucun leader n'est supprimé.
7. Budget de temps de 45 s par clic : au-delà, plus aucune nouvelle image n'est
   lancée et le rapport indique combien restent. Un nouveau clic reprend là où
   la synchro s'est arrêtée (idempotent). `maxDuration = 300` sur la page.
8. Rapport affiché : leaders ajoutés, noms et couleurs modifiés (avant →
   après), images téléversées, images restantes, erreurs. La synchro est
   journalisée dans `admin_events` (`leaders_sync`) ; la page affiche la
   dernière date.

## Base de données

- `0004_leader_images.sql` : bucket public `leader-images`, lecture publique,
  écriture admin (la synchro passe par la clé de service).
- `0003_leaders.sql` passe en `on conflict do nothing` : relancer le seed ne
  doit plus écraser les `image_url` migrées vers Storage.

## Hors périmètre

- Suppression de `public/leaders/` : à faire une fois la première synchro
  vérifiée en production (les anciennes URLs restent valides d'ici là).
- Riftbound et autres jeux.
