# Mister 8 Tournament League

Plateforme de la ligue compétitive de Mister 8 TCG (Courbevoie) : comptes
joueurs, inscription en ligne aux tournois One Piece Card Game (paiement
Mollie, billet PDF avec QR code), import des résultats Bandai TCG+,
classement de ligue par saison, espaces joueurs et administration.

Stack : Next.js 16 (App Router, Server Actions), Supabase (Postgres, Auth,
Storage), Tailwind v4, Mollie, nodemailer, pdf-lib.

## Lancer le site en local

```bash
npm install
cp .env.example .env.local      # puis renseigner les valeurs (voir ci-dessous)
npm run dev                     # http://localhost:3000
npm test                        # tests unitaires (parseur CSV, barème, rapprochement…)
npm run typecheck               # tsc --noEmit
npm run lint
npm run build
```

Sans `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, le site
affiche une page « Configuration requise » qui liste les variables manquantes.

### Port du serveur de développement

`npm run dev` sert le site **sur le port de `NEXT_PUBLIC_SITE_URL`** (3000 par
défaut) et refuse de démarrer si ce port est déjà pris. C'est volontaire :
`next dev` seul bascule silencieusement sur le port suivant quand 3000 est
occupé, et le site répond alors sur 3001 pendant que les retours de paiement
Mollie, les liens des e-mails, le QR des billets et les redirections de
connexion continuent de pointer sur 3000 — c'est-à-dire sur l'application qui
occupe ce port. Si le port est occupé : arrêter l'autre application, ou choisir
un autre port pour la ligue via `NEXT_PUBLIC_SITE_URL` (les deux restent ainsi
toujours cohérents).

## Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site (liens des e-mails, retour Mollie, QR des billets) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | projet Supabase (Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | clé service role, serveur uniquement |
| `MOLLIE_API_KEY` | `test_…` en développement, `live_…` en production |
| `MOLLIE_WEBHOOK_URL` | facultatif : URL publique du webhook (tunnel) pour tester le webhook en local |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` | envoi des e-mails (billet, notifications) |
| `EMAIL_TOURNAMENT_FROM` | expéditeur no-reply |
| `EMAIL_TOURNAMENT_REPLY_TO` | adresse de réponse affichée (tournois uniquement) |
| `EMAIL_TOURNAMENT_ADMIN_TO` | boîte notifiée à chaque inscription payée |

## Mise en service Supabase

1. Créer un projet (région Paris `eu-west-3`).
2. Éditeur SQL : exécuter dans l'ordre `supabase/migrations/0001_schema.sql`,
   `0002_seed.sql` (jeu One Piece, saison 2026/2027 active, barème
   15/10/8/6/4/2/1), `0003_leaders.sql` (catalogue des leaders avec visuels).
   Les scripts sont idempotents. Ils créent aussi les buckets Storage
   (`tournament-tickets` privé, `avatars` et `event-covers` publics).
3. **Authentication → URL Configuration** : `Site URL` = votre
   `NEXT_PUBLIC_SITE_URL`, et ajouter `https://votre-site/**` (et
   `http://localhost:3000/**`) aux Redirect URLs.
4. **Authentication → Email Templates** (recommandé, plus robuste que le lien
   par défaut) :
   - *Confirm signup* :
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/joueur`
   - *Reset password* :
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/connexion/nouveau-mot-de-passe`
   - *Magic link / change email* : même schéma avec `type=magiclink` /
     `type=email_change`.

   Le lien `{{ .ConfirmationURL }}` par défaut fonctionne aussi (il arrive sur
   `/auth/callback`), mais impose d'ouvrir l'e-mail dans le navigateur qui a
   fait la demande.
5. Créer votre compte sur le site, puis le promouvoir admin :

   ```sql
   update public.profiles set role = 'admin' where pseudo = 'VotrePseudo';
   ```

6. Dans l'admin : vérifier la saison et le barème (`/admin/saisons`), créer le
   premier tournoi (`/admin/tournois/nouveau`), le publier.

## Mollie

- Créer un profil de site sur Mollie, récupérer la clé API test puis live.
- Le webhook est `POST {NEXT_PUBLIC_SITE_URL}/api/mollie/webhook`, renseigné
  automatiquement à chaque paiement.
- **En local, le webhook est volontairement omis.** Mollie l'appelle depuis ses
  propres serveurs et refuse la création du paiement (422 « webhook URL […]
  unreachable ») si l'URL pointe sur `localhost` ou une IP privée. Le paiement
  test fonctionne sans lui : la page de retour re-interroge Mollie et confirme
  l'inscription (facture, billet, e-mails).
- Pour tester le webhook lui-même en local : exposer le serveur avec un tunnel
  (`ngrok http 3000` ou `cloudflared tunnel`) et mettre l'URL publique dans
  `MOLLIE_WEBHOOK_URL` (ex. `https://abc123.ngrok-free.app/api/mollie/webhook`).
  En production, `NEXT_PUBLIC_SITE_URL` étant public, le webhook est envoyé
  normalement et `MOLLIE_WEBHOOK_URL` reste vide.
- Les factures sont créées via l'API *Sales Invoices* (TVA 20 % incluse,
  statut brouillon) quand l'adresse de facturation est renseignée. Elles sont
  visibles dans le dashboard Mollie et sur la page de confirmation du joueur.
- Les remboursements se font depuis le dashboard Mollie ; côté site, l'admin
  marque l'inscription « remboursée » pour libérer la place.

## Parcours et fonctionnement

### Comptes
`/connexion` : inscription avec pseudo, nom complet, e-mail, mot de passe et
**numéro de membre Bandai** (obligatoire : c'est la clé qui relie les résultats
Bandai TCG+ au compte). Un trigger crée le profil, un second rattache
l'identité ligue (`players`) dès que le numéro Bandai est connu.

### Tournois et inscription
- Fiche `/tournois/[slug]`, inscription `/tournois/[slug]/inscription`
  (participant, deck / leader déclaré facultatif, adresse de facturation).
- La place est réservée 15 min par la fonction SQL `reserve_seat` (verrou sur
  l'événement, capacité, doublons), puis le paiement Mollie est créé.
- Le webhook confirme le paiement, crée la facture, génère le billet PDF
  (QR → `/billet/[token]`) dans le bucket privé et envoie les e-mails
  (joueur avec PDF, admin). La page de retour vérifie aussi le paiement
  directement, au cas où le webhook tarde.
- Tournoi gratuit (0 €) : confirmation immédiate sans Mollie.
- Check-in : scanner le QR du billet avec un compte admin, ou depuis
  `/admin/tournois/[id]/participants` (liste, recherche, cash, export CSV,
  renvoi du billet, remboursement).

### Résultats et classement
- `/admin/tournois/[id]/resultats` : importer l'export CSV « Classement
  final » de Bandai TCG+ (colonnes Classement, Numéro de membre, Nom du
  joueur, Points gagnés, OMW %, OOMW % ; BOM, `;`, accents cassés et colonnes
  Memo / Deck URLs tolérés). Le nombre de rondes est déduit du meilleur score
  s'il n'est pas saisi (3 points par victoire).
- Rapprochement automatique : joueur connu (numéro Bandai) → inscrit du
  tournoi (numéro Bandai du profil) → sinon « à résoudre » (lier à un
  inscrit, à un joueur existant, créer un joueur sans compte, ignorer). Le
  leader est prérempli depuis le deck déclaré à l'inscription et modifiable.
- « Publier » remplace les résultats du tournoi, calcule les points selon le
  barème de la saison, passe le tournoi en « terminé » : classement
  (`/classement?saison=…`), page de résultats avec camembert des leaders,
  espaces joueurs et profils publics sont mis à jour.
- `/admin/joueurs` : rattacher un joueur importé à un compte, corriger un
  numéro Bandai, fusionner deux identités.

### Espace joueur
`/joueur` (statut de qualification, stats, historique, inscriptions, decks),
`/joueur/profil`, `/joueur/decks`, `/joueur/inscriptions`, profil public
`/joueurs/[pseudo]` (désactivable dans le profil).

## Structure du code

```
src/app/                  pages (public, connexion, joueur, admin, api)
src/components/           UI (kit dans ui/, composants métier, admin/)
src/lib/auth/             session, actions, validation
src/lib/db/               requêtes typées (types.ts = miroir du schéma)
src/lib/league/           parseur Bandai, barème, rapprochement, import
src/lib/tournaments/      états, réservation/paiement (actions), billet PDF, check-in
src/lib/payments/         Mollie, factures, fulfil (facture + billet + e-mails)
src/lib/email/            SMTP, gabarits
src/lib/admin/            actions admin (tournois, inscriptions, résultats, saisons, joueurs)
supabase/migrations/      schéma complet, seed, leaders
tests/                    tests node:test des modules purs
```

## Design

Deux ambiances (voir `src/app/globals.css`, Tailwind v4 `@theme`) :
« Le Club » (charbon, or paille, rouge action, Fraunces + Inter) pour les
pages applicatives, « L'Affiche » (papier crème, rouge affiche, Bevan) pour
les fiches de tournoi, billets et règlement.

## Suites possibles

Liste d'attente avec promotion et lien de paiement, rappels e-mail J-1,
connexion Google, decklists top 8 publiées, badges, page de finale.
