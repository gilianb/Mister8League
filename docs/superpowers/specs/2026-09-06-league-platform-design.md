# Mister 8 Tournament League — plateforme tournois, résultats et ligue

Date : 6 septembre 2026 · Statut : validé pour implémentation (session autonome ;
le propriétaire relit et redirige a posteriori).

## 1. Objectif

Transférer sur ce site (Next.js 16, Supabase, Tailwind v4) toute la partie
« tournoi » du site actuel Mister 8 TCG (`D:\mister8_website\mister8tcg`), et y
ajouter le suivi complet de la ligue par saison :

1. Comptes joueurs Supabase (e-mail + mot de passe, confirmation par e-mail,
   mot de passe oublié) avec profil enrichi : pseudo, nom complet, numéro de
   membre Bandai, avatar.
2. Création et gestion des tournois par les admins (même modèle que
   `tournament_event` du site actuel : dates, lieu, capacité, tarif, textes).
3. Inscription payante via **Mollie** (réservation de place 15 min, webhook,
   facture Mollie, billet PDF avec QR code, e-mails de confirmation, check-in,
   inscription « cash » par l'admin), comme sur le site actuel.
4. Résultats : import du CSV « classement final » de Bandai TCG+ par l'admin,
   rapprochement automatique avec les inscrits (numéro de membre Bandai),
   résolution manuelle des écarts, publication des résultats, camembert des
   leaders avec visuels, et classement de ligue **par saison**.
5. One Piece Card Game uniquement pour l'instant (le modèle reste multi-jeu).
6. Design propre dans l'esprit Mister 8 (« Le Club » sombre + « L'Affiche »).
7. Suppression de toutes les données de démonstration codées en dur.
8. Dashboard personnel : chaque joueur gère ses decks ; son profil public
   (`/joueurs/[pseudo]`) est consultable par tous (performances + decks).

Nouvelle base Supabase : le schéma est réécrit de zéro (les migrations
existantes `0001`–`0003` sont remplacées).

## 2. Hors périmètre (suivis possibles)

- Connexion Google, PayPal, Stripe, virement.
- Liste d'attente automatique, newsletter / rappels programmés.
- Classement Riftbound (la table `games` le permet, l'UI ne l'affiche pas).
- Decklists complètes importées depuis Bandai (les « Deck URLs » du CSV sont
  conservées telles quelles dans la ligne importée, non exploitées).

## 3. Architecture

- **Next.js 16 App Router** (Turbopack, Server Components). Lecture des
  données côté serveur ; mutations via **Server Actions** (formulaires) ;
  **Route Handlers** uniquement pour ce qui vient de l'extérieur ou renvoie
  un fichier : webhook Mollie, PDF du billet, export CSV.
- `src/proxy.ts` (nouveau nom du middleware en Next 16) rafraîchit la session
  Supabase à chaque requête non statique.
- Trois clients Supabase (`src/lib/supabase/`) : `server.ts` (SSR, cookies,
  utilisateur courant), `admin.ts` (service role, `server-only`, contourne la
  RLS pour les opérations privilégiées après vérification explicite du rôle),
  `browser.ts` (client navigateur, uniquement pour l'échange de code OAuth /
  tokens dans `/auth/callback`).
- Toute page qui lit la base est dynamique (`export const dynamic =
  "force-dynamic"`) : le site est petit, pas de cache à invalider.
- Aucune dépendance UI lourde : icônes en SVG inline, composants maison dans
  `src/components/ui/`. Dépendances ajoutées : `@supabase/ssr`,
  `@mollie/api-client`, `nodemailer`, `pdf-lib`, `qrcode`.

## 4. Modèle de données (Postgres / Supabase)

Identifiants `uuid` partout. `created_at`/`updated_at` sur les tables
métier. Tous les schémas sont dans `supabase/migrations/` (idempotents).

### 4.1 Référentiels
- `games` (slug, name). Seed : `one-piece`.
- `seasons` (game_id, slug `2026-2027`, name « Saison 2026/2027 »,
  starts_on, ends_on, qualified_count, status draft|active|closed). Une seule
  saison `active` par jeu (index partiel unique).
- `point_scale_rules` (season_id, label, placement_min, placement_max,
  points). Barème par saison, règle la plus étroite gagnante.
- `leaders` (game_id, code `OP01-001`, name, colors[], image_url). Seed
  généré (inchangé).

### 4.2 Comptes et identités
- `profiles` (id = auth.users.id, pseudo unique (3–24, `[a-z0-9_.-]`,
  insensible à la casse), full_name, bandai_member_id unique (6–12 chiffres),
  avatar_url, bio, phone, role player|admin, is_public bool default true).
  Créé par trigger `handle_new_user` sur `auth.users` à partir des
  `raw_user_meta_data` du signup. Trigger de rattachement : dès qu'un profil
  a un `bandai_member_id`, le `players` correspondant est lié.
- `players` (display_name, bandai_member_id unique, profile_id nullable,
  merged_into nullable). Identité « ligue » : peut exister sans compte
  (joueur importé depuis un CSV). Le nom affiché est le pseudo du profil s'il
  existe, sinon `display_name`.

### 4.3 Decks
- `decks` (profile_id, name, leader_id, decklist_text, notes, is_public,
  is_archived). Un joueur choisit un deck (ou juste un leader) à
  l'inscription ; le leader sert au métagame.

### 4.4 Tournois et inscriptions (miroir du site actuel)
- `events` : season_id, game_id, slug unique, title, subtitle, description,
  rules_text, schedule_text, prizes_text, venue_name, venue_address, city,
  google_maps_url, starts_at, ends_at, registration_open_at,
  registration_close_at, capacity, price_cents, fee_bps (frais de paiement,
  500 = 5 %), currency, cover_image_url, is_featured, rounds, format_label,
  status draft|published|cancelled|completed, counts_for_league bool,
  created_by.
- `registrations` : event_id, profile_id nullable (cash walk-in), status
  pending_payment|paid|checked_in|cancelled|refunded, expires_at (fin de la
  réservation), participant_name, participant_email, participant_phone,
  notes, deck_id, leader_id, payment_provider mollie|cash|free,
  mollie_payment_id, mollie_payment_status, amount_cents, currency,
  billing_data jsonb, mollie_sales_invoice_id/status/number/pdf_url/created_at,
  ticket_pdf_path, checked_in_at, checked_in_by. Index unique partiel : un
  seul enregistrement actif (pending / paid / checked_in) par
  (event_id, profile_id) ; les réservations expirées sont passées en
  `cancelled` avant toute nouvelle réservation.
- `payment_events` (registration_id, provider, event_type, provider_ref,
  payload jsonb) : journal.
- `ticket_tokens` (registration_id unique, token_hash, expires_at).
- `email_events` (registration_id, kind, recipient_email, status, provider_ref,
  error, sent_at) : idempotence des e-mails.
- `admin_events` (admin_id, event_id, registration_id, action, from_status,
  to_status, note, payload) : audit des actions admin.
- Fonction `reserve_seat(p_event_id, p_deck_id, p_leader_id, p_phone,
  p_notes)` (security definer, verrouille la ligne événement) : vérifie
  profil complet, fenêtre d'inscription, capacité (payés + réservations non
  expirées), doublon ; crée la ligne `pending_payment` avec `expires_at =
  now() + 15 min`. Erreurs codées : `profile_incomplete`,
  `registration_not_open_yet`, `registration_closed`, `event_full`,
  `already_registered`.
- Vue `event_seat_counts` (event_id, active_count, paid_count).

### 4.5 Résultats et ligue
- `result_imports` (event_id, file_name, raw_csv, rounds, status
  pending|applied|discarded, created_by, applied_at).
- `result_import_rows` (import_id, row_index, placement, bandai_member_id,
  player_name, match_points, wins, draws, losses, omw_pct, oomw_pct,
  deck_urls, resolution auto_player|auto_registration|registration|player|
  new_player|skip|unresolved, player_id, registration_id, leader_id).
- `results` (event_id, player_id, placement, match_points, wins, losses,
  draws, omw_pct, oomw_pct, leader_id, deck_id, league_points, import_id) ;
  unique (event_id, player_id). Trigger : `league_points` calculé via le
  barème de la saison de l'événement ; `apply_league_points(event)` pour
  recalcul.
- Vues : `season_standings` (rang par saison : points desc, meilleur
  placement asc, tournois joués desc), `event_metagame` (leader → nb joueurs,
  meilleur placement), `player_deck_stats`, `player_season_summary`.

### 4.6 Storage
Buckets : `tournament-tickets` (privé), `avatars` (public), `event-covers`
(public).

### 4.7 Sécurité (RLS)
- Lecture publique : games, seasons (non draft), point_scale_rules, leaders,
  players, events (non draft), results des événements `completed`, decks
  publics, profils publics (colonnes exposées via la vue `public_profiles` :
  id, pseudo, avatar_url, bio ; jamais l'e-mail, le téléphone ni le numéro
  Bandai).
- Chaque utilisateur : lit/modifie son profil (sans pouvoir changer `role`),
  ses decks, lit ses inscriptions.
- Admin (`is_admin()`) : tout. Les écritures sensibles (inscriptions,
  paiements, imports) passent par le client service role côté serveur après
  `requireAdmin()` / `requireUser()`.

## 5. Flux

### 5.1 Authentification
- `/connexion` : onglets Connexion / Créer un compte. Inscription :
  pseudo, nom complet, e-mail, mot de passe (8+), numéro de membre Bandai
  (obligatoire, aide « où le trouver »). Une Server Action vérifie la
  disponibilité pseudo / Bandai ID (client admin), puis appelle
  `supabase.auth.signUp` (client SSR) avec les métadonnées ; le trigger crée
  le profil. Redirection vers `/connexion/verifier-email?email=` (renvoi du
  mail avec cooldown 60 s).
- Confirmation : `GET /auth/confirm?token_hash&type&next` (verifyOtp, pose les
  cookies) ; `/auth/callback` gère aussi `?code=` (PKCE) et `#access_token`
  (implicit) comme sur le site actuel. `/auth/erreur` propose « réessayer de
  se connecter » + renvoi du mail.
- Mot de passe oublié → `/connexion/mot-de-passe-oublie` (resetPasswordForEmail,
  redirect `/auth/callback?next=/connexion/nouveau-mot-de-passe`) →
  `/connexion/nouveau-mot-de-passe` (updateUser).
- Déconnexion : Server Action. Le Header (Server Component) lit
  l'utilisateur et affiche « Mon espace » / « Admin » / « Connexion ».
- Le README documente les templates d'e-mail Supabase à utiliser (lien
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`).

### 5.2 Inscription et paiement
1. `/tournois/[slug]` : fiche (affiche « L'Affiche » : date, lieu, tarif,
   places restantes, textes) + état pour l'utilisateur (inscrit / paiement
   en attente / complet / fermé / connexion requise).
2. `/tournois/[slug]/inscription` (connecté, profil complet sinon renvoi vers
   `/joueur/profil?next=`) : formulaire nom / e-mail / téléphone / notes,
   choix du deck ou du leader (facultatif, modifiable jusqu'au début du
   tournoi), adresse de facturation (rue, code postal, ville, pays ISO-2,
   société / TVA facultatives) requise pour la facture Mollie ; récapitulatif
   (tarif + frais + total) ; bouton « Payer avec Mollie ».
3. Server Action `startCheckout` : `reserve_seat` → création du paiement
   Mollie (montant total, description, `redirectUrl =
   /tournois/paiement/retour?registration=`, `webhookUrl =
   /api/mollie/webhook`, metadata) → mise à jour de la ligne → redirection
   vers l'URL de paiement. Si un paiement Mollie en attente existe encore
   (« Payer maintenant »), on reprend l'URL existante ou on recrée un
   paiement. Tarif 0 € : statut `paid`, provider `free`, exécution directe.
4. `POST /api/mollie/webhook` : relit le paiement chez Mollie (jamais de
   confiance dans le corps), journalise, vérifie montant + devise, passe la
   ligne en `paid`, puis **`fulfilRegistration`** (module partagé) : facture
   Mollie (TVA 20 % incluse, statut draft, verrou simple), jeton + PDF du
   billet (QR vers `/billet/[token]`) stocké dans le bucket privé, e-mails
   joueur (PDF joint) + admin, idempotents via `email_events`.
5. `/tournois/paiement/retour` : page serveur qui interroge Mollie pour la
   ligne de l'utilisateur ; si payé → `/tournois/inscription/[id]`
   (confirmation + téléchargement du billet via
   `GET /api/billets/[registrationId]/pdf` signé 10 min) ; sinon message +
   rafraîchissement automatique. Annulation : Server Action
   `cancelPendingRegistration` (libère la place, annule le paiement Mollie).
6. Check-in : `/billet/[token]` (public : statut du billet ; admin : bouton
   « Confirmer la présence » → Server Action). `/admin/tournois/[id]/participants`
   liste, recherche, check-in manuel, ajout d'un participant cash (crée une
   inscription payée + facture + billet + e-mail), export CSV, suppression.

### 5.3 Résultats
1. `/admin/tournois/[id]/resultats` : upload du CSV Bandai (+ nombre de
   rondes, préremplie avec `events.rounds` ou déduit du max de points). Le
   parseur (`src/lib/league/bandai-csv.ts`) tolère BOM, `,`/`;`, en-têtes FR/EN,
   accents mal encodés, colonnes supplémentaires (Memo, Deck URLs).
2. Rapprochement (`src/lib/league/matching.ts`, pur, testé) pour chaque
   ligne : (a) `players.bandai_member_id` → `auto_player` ; (b) sinon un
   inscrit payé/check-in de l'événement dont le profil a ce Bandai ID →
   `auto_registration` ; (c) sinon `unresolved`. La page liste toutes les
   lignes avec statut coloré, et pour les `unresolved` : lier à un inscrit
   (menu des inscrits non encore appariés — corrige au passage le Bandai ID
   du profil si vide), lier à un joueur existant (recherche), créer un joueur
   invité, ignorer. Elle liste aussi les inscrits absents du CSV (no-show).
3. Leader par ligne : prérempli depuis le deck/leader déclaré à l'inscription,
   modifiable (sélecteur avec visuels). Facultatif.
4. « Publier les résultats » : transaction serveur qui crée les `players`
   manquants, insère les `results`, calcule les points, passe l'événement en
   `completed`, marque l'import `applied`. Re-import possible (remplace les
   résultats de l'événement).
5. Public : `/resultats` (liste), `/resultats/[slug]` (classement complet,
   camembert des leaders avec vignettes, top 8 mis en avant),
   `/classement?saison=` (sélecteur de saison, ligne de qualification,
   surlignage du joueur connecté), accueil (prochain tournoi, top 8, dernier
   résultat).

### 5.4 Espace joueur
- `/joueur` : en-tête (avatar, pseudo, Bandai ID), statut de qualification,
  tuiles stats, points par tournoi, historique, mes inscriptions (billets,
  paiements en attente), mes decks. Alerte si le profil est incomplet.
- `/joueur/profil` : édition (pseudo, nom, Bandai ID, avatar upload, bio,
  téléphone, visibilité).
- `/joueur/decks` : CRUD decks (nom, leader, decklist texte, notes, public).
- `/joueurs/[pseudo]` : profil public (stats saison, historique, decks
  publics) ; lien depuis les classements et résultats.

### 5.5 Admin
- `/admin` : tableau de bord (prochains tournois, inscrits payés / capacité,
  paiements en attente, derniers résultats, joueurs sans compte).
- `/admin/tournois` (liste + statut), `/admin/tournois/nouveau` (formulaire
  avec « dupliquer depuis »), `/admin/tournois/[id]` (édition), participants,
  résultats.
- `/admin/saisons` : saisons et barème (édition inline), activation.
- `/admin/joueurs` : recherche, joueurs sans compte, lier/délier un profil,
  corriger un Bandai ID, fusionner deux identités.

## 6. Design

- Conserver les tokens `globals.css` (« Le Club » : charbon / or paille /
  rouge action ; « L'Affiche » : papier crème / rouge affiche / Bevan).
- Pages applicatives (auth, espace joueur, admin, inscription) en « Club »
  avec cartes `bg-coal-800 border hairline rounded-2xl`, titres Fraunces,
  chiffres tabulaires en or.
- Fiches d'événement et confirmation de billet en « Affiche » (cadre double).
- Composants `src/components/ui/` : Button (variants gold / brand / ghost /
  danger), Card, Field/Input/Select/Textarea, Badge (tones), Alert, StatTile,
  SectionHeading, EmptyState, Spinner, Tabs. Formulaires accessibles
  (labels, `aria-invalid`, messages d'erreur).
- Camembert : SVG maison existant enrichi (vignette du leader posée sur les
  parts ≥ 8 %, légende avec vignettes, « Autres » en gris).
- Textes en français, monnaie `fr-FR`, dates `Europe/Paris`.

## 7. Variables d'environnement (`.env.example`)

```
NEXT_PUBLIC_SITE_URL=            # ex. https://league.mister-8.com (URLs des e-mails, Mollie)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # serveur uniquement
MOLLIE_API_KEY=                  # test_xxx puis live_xxx
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=                     # true si port 465
EMAIL_TOURNAMENT_FROM=           # "Mister 8 Tournament League <no-reply@mister-8.com>"
EMAIL_TOURNAMENT_REPLY_TO=       # as@mister-8.com
EMAIL_TOURNAMENT_ADMIN_TO=       # boîte qui reçoit les notifications d'inscription
```

Sans Supabase configuré, le site affiche une page d'installation claire au
lieu de planter ; plus aucun mode démo.

## 8. Tests et vérification

- `npm test` = `node --experimental-strip-types --test tests/` : parseur CSV
  (fichier réel joint : BOM, « points gagnés », colonnes Memo / Deck URLs,
  noms avec espaces), barème, rapprochement, helpers d'état d'inscription,
  validation pseudo / Bandai ID, calcul des montants.
- `npx tsc --noEmit`, `npm run lint`, `npm run build` doivent passer.
- Parcours manuels documentés dans le README (Mollie en mode test, webhook
  via tunnel).

## 9. Mise en service (README)

1. Créer le projet Supabase (Paris), exécuter les migrations dans l'ordre,
   configurer les templates d'e-mail et l'URL du site dans Auth.
2. Renseigner `.env.local`, `npm install`, `npm run dev`.
3. Promouvoir un admin : passer `role` à `admin` sur son profil.
4. Créer la saison, le barème, le premier tournoi.

## 10. Suites envisagées

Liste d'attente avec promotion et lien de paiement, rappels e-mail J-1,
connexion Google, decklists top 8 publiées, badges, page de finale.
