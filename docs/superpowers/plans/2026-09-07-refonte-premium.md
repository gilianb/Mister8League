# Plan — refonte premium du design

Spec : `docs/superpowers/specs/2026-09-07-refonte-premium-design.md`.
Chaque phase se termine par `npm run typecheck && npm run lint` et un commit.

## Phase 1 — Fondations
- `src/app/globals.css` : palette, polices, utilitaires (`page-shell`, `hairline`,
  `surface-panel`, `kicker`, `text-link`, `ticket`, `ticket-perforation`,
  `display-number`), styles de base (focus, sélection, texte équilibré).
- `src/app/layout.tsx` : Fraunces (opsz, italique) + Archivo via `next/font`, Bevan retirée.
- `public/brand/chapeau-emblem.png` : chapeau recadré depuis `chapeau.png` (sharp).
- Kit UI : `Button`, `Card`, `Field`, `Badge`, `Alert`, `EmptyState`, `PageHeader`,
  `SectionHeading`, `StatTile`, `Tabs`, `Avatar`, `HatLogo`, nouveau `Ticket`.
- `Header` / `HeaderNav` / `UserMenu`, `Footer`.
- Remplacement global : `section-kicker` → `kicker`, `editorial-link` → `text-link`,
  suppression des `font-poster`, `✦ ✦ ✦`, `poster-frame`.

## Phase 2 — Pages publiques
- Accueil (`src/app/page.tsx`), `AmbianceCarousel`, `Countdown`.
- Calendrier + `EventCard` (billet).
- Classement + `StandingsTable` + `SeasonTabs`.
- Résultats + fiche résultat + `MetagameDonut` + `LeaderChip`.
- Fiche tournoi.
- Profil public + `PlayerStats` + `PlayerHistory` + `DeckCard`.
- Règlement, confidentialité, `PageBackdrop` (photo d'en-tête nette).

## Phase 3 — Inscription et billets
- Inscription (`RegisterForm`), confirmation (billet), retour Mollie, billet public
  (`billet/[token]`), `PayNowButton`, `LeaderPicker`, `DeckDeclarationForm`.

## Phase 4 — Authentification
- `AuthFrame`, connexion (`LoginForms`), mot de passe oublié, nouveau mot de passe,
  vérification d'e-mail, erreur de lien, callback.

## Phase 5 — Espace joueur
- Layout + `JoueurNav`, tableau de bord, profil (`ProfileForm`, `AvatarForm`),
  decks (`DeckForm`, `DeckActions`), inscriptions.

## Phase 6 — Administration
- Layout + `AdminNav` + `admin.css`, tableau de bord, tournois (liste, nouveau,
  fiche, participants, résultats), saisons, joueurs, composants admin.

## Phase 7 — Finitions et vérification
- Page d'installation, page 404 (`not-found.tsx`).
- `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- Captures desktop 1440 et mobile 390 des pages publiques et de connexion.
- Commit final et résumé.
