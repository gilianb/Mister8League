# Plan : synchronisation des leaders

Spec : `docs/superpowers/specs/2026-09-23-synchro-leaders-design.md`

1. **Normalisation pure** : `src/lib/leaders/optcg.ts` (nettoyage des noms,
   traduction des couleurs, choix de l'impression de base, comparaison des
   couleurs) + `tests/leaders-optcg.test.ts`.
2. **Migration** : `supabase/migrations/0004_leader_images.sql` (bucket et
   policies) ; `0003_leaders.sql` en `on conflict do nothing`.
3. **Server action** `syncLeadersAction` dans `src/lib/admin/leaders.ts` :
   contrôle admin, téléchargement, comparaison avec la base, insertion ou mise
   à jour, téléversement des images (concurrence 6, budget 45 s), journal
   `admin_events`, rapport.
4. **Page admin** `/admin/leaders` : compteur, dernière synchro, bouton,
   rapport, grille des leaders avec vignette, code, nom, couleurs et origine
   de l'image. Entrée « Leaders » dans `AdminNav`. `maxDuration = 300`.
5. **Nettoyage** : `LeaderChip` sans catalogue statique (prop `code` retirée),
   suppression de `src/lib/data/leaders.ts` et de
   `scripts/build-leaders-catalog.mjs`, mise à jour du README.
6. **Vérifications** : tests, typecheck, lint, build. La synchro réelle est
   lancée par le propriétaire depuis le bouton.
