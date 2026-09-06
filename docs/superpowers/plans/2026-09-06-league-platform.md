# Plateforme tournois / résultats / ligue — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le mode démo du site par une plateforme complète : comptes Supabase, tournois administrés, inscription payante Mollie, import des résultats Bandai, classement par saison, espace joueur et profils publics.

**Architecture:** Next.js 16 App Router, Server Components + Server Actions pour les mutations, Route Handlers pour le webhook Mollie et les fichiers. Supabase (Postgres + Auth + Storage) via `@supabase/ssr` (session) et service role (opérations privilégiées, `server-only`). Logique métier pure (CSV, barème, rapprochement, états d'inscription, montants) isolée dans `src/lib/**` et testée avec `node:test`.

**Tech Stack:** Next 16.2, React 19.2, Tailwind v4, @supabase/supabase-js 2.114 + @supabase/ssr 0.12, @mollie/api-client 4.6, nodemailer 10, pdf-lib, qrcode.

**Spec:** `docs/superpowers/specs/2026-09-06-league-platform-design.md`

## Global Constraints

- Next 16 : `params`/`searchParams`/`cookies()` sont asynchrones ; le fichier de middleware s'appelle `src/proxy.ts` et exporte `proxy` ; `revalidateTag` n'est pas utilisé (pages `force-dynamic`).
- Aucune donnée codée en dur : tout vient de Supabase ; sans configuration, page d'installation.
- Textes UI en français ; dates `Europe/Paris` ; montants en centimes en base, `fr-FR` à l'affichage.
- Ne jamais exposer e-mail / téléphone / Bandai ID d'un autre joueur (vue `public_profiles`).
- Toute Server Action et tout Route Handler vérifient l'authentification / le rôle en interne (jamais via le proxy seul).
- Secret de service role uniquement dans des modules `import "server-only"`.
- Commits fréquents, messages en français, suffixe Co-Authored-By.
- Vérification finale : `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.

---

## Structure de fichiers

```
src/proxy.ts                               rafraîchit la session Supabase
src/lib/env.ts                             lecture des variables d'env
src/lib/supabase/{server,admin,browser}.ts clients
src/lib/db/types.ts                        types des lignes (tables + vues)
src/lib/db/{seasons,events,standings,results,players,registrations,decks,profiles}.ts  requêtes typées (lecture)
src/lib/auth/{session,actions,validation}.ts
src/lib/league/{bandai-csv,points,matching,import}.ts
src/lib/tournaments/{status,time,ticket-token,pdf,actions,checkin}.ts
src/lib/payments/{amounts,mollie,mollie-invoices,fulfil}.ts
src/lib/email/{smtp,senders,tournament-emails}.ts + templates/
src/lib/{format,slug,money}.ts
src/components/ui/*                        kit UI
src/components/*                           composants métier (Header, StandingsTable, MetagameDonut, LeaderPicker…)
src/app/**                                 pages (voir spec §5)
supabase/migrations/0001_schema.sql, 0002_seed.sql, 0003_leaders.sql
tests/*.test.ts + tests/fixtures/
```

---

### Task 1 : Fondations (env, clients Supabase, proxy, session, suppression du mode démo)

**Files:**
- Modify: `package.json` (script `test`), `.env.example`, `next.config.ts`, `README.md` (section env)
- Create: `src/lib/env.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, `src/lib/supabase/browser.ts`, `src/proxy.ts`, `src/lib/auth/session.ts`, `src/app/installation/page.tsx`
- Delete: `src/lib/data/seed.ts`, `src/lib/data/index.ts`, `src/lib/supabase.ts`, `src/components/GameTabs.tsx`
- Keep: `src/lib/data/leaders.ts` (catalogue statique des visuels)

**Interfaces (produced):**
```ts
// src/lib/env.ts
export function isSupabaseConfigured(): boolean
export function getSiteUrl(): string                // NEXT_PUBLIC_SITE_URL sans slash final, sinon http://localhost:3000
export function requireEnv(name: string): string    // throw si absent
// src/lib/supabase/server.ts   (server-only)
export async function createServerSupabase(): Promise<SupabaseClient>
// src/lib/supabase/admin.ts    (server-only)
export function createAdminSupabase(): SupabaseClient
// src/lib/supabase/browser.ts
export function createBrowserSupabase(): SupabaseClient
// src/lib/auth/session.ts      (server-only)
export type SessionUser = { id: string; email: string | null }
export async function getSessionUser(): Promise<SessionUser | null>
export async function getCurrentProfile(): Promise<ProfileRow | null>
export async function requireUser(next?: string): Promise<{ user: SessionUser; profile: ProfileRow | null }> // redirect('/connexion?next=…')
export async function requireAdmin(): Promise<{ user: SessionUser; profile: ProfileRow }>   // redirect('/') si non admin
export function isProfileComplete(p: ProfileRow | null): boolean   // pseudo && bandai_member_id && full_name
```

- [ ] Ajouter `"test": "node --experimental-strip-types --test tests/"` dans `package.json`.
- [ ] Écrire `.env.example` avec les 13 variables de la spec §7 (commentaires FR).
- [ ] `next.config.ts` : `images.remotePatterns` = `{ protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" }` ; `serverExternalPackages: ["pdf-lib", "qrcode", "nodemailer", "@mollie/api-client"]`.
- [ ] Créer les clients (modèle : site actuel `src/lib/supabase/mister8/*`, variables sans suffixe `_MISTER8`).
- [ ] Créer `src/proxy.ts` (copie de `middleware.ts` du site actuel renommée, matcher qui exclut `_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|ambiance|leaders|brand`).
- [ ] `src/lib/auth/session.ts` : `getSessionUser` via `supabase.auth.getUser()` ; profil via client SSR (`profiles` RLS « own »).
- [ ] `src/app/installation/page.tsx` : page « Configuration requise » listant les variables manquantes ; `src/app/layout.tsx` redirige vers `/installation` (rendu direct du composant) quand `!isSupabaseConfigured()`.
- [ ] Supprimer les fichiers démo ; laisser les pages en erreur de compilation jusqu'aux tâches 6–7 (ou les réduire à un stub minimal).
- [ ] Commit : « Fondations Supabase SSR, proxy, session ; retrait du mode démo ».

---

### Task 2 : Schéma Supabase (migrations)

**Files:**
- Replace: `supabase/migrations/0001_schema.sql`, `supabase/migrations/0002_seed.sql`
- Keep: `supabase/migrations/0003_leaders.sql`

**Produces (contrat SQL, voir spec §4) :**
- Tables : `games`, `seasons`, `point_scale_rules`, `leaders`, `profiles`, `players`, `decks`, `events`, `registrations`, `payment_events`, `ticket_tokens`, `email_events`, `admin_events`, `result_imports`, `result_import_rows`, `results`.
- Fonctions : `is_admin()`, `handle_new_user()` (trigger auth.users), `link_player_to_profile()`, `compute_league_points(season uuid, placement int)`, `apply_league_points(event uuid)`, `results_set_points()` trigger, `reserve_seat(p_event_id uuid, p_deck_id uuid, p_leader_id uuid, p_phone text, p_notes text) returns uuid` (security definer, `auth.uid()`), `expire_pending_registrations()`, `set_updated_at()` trigger générique, `merge_players(p_source uuid, p_target uuid)`.
- Vues : `public_profiles`, `event_seat_counts`, `season_standings`, `event_metagame`, `player_deck_stats`, `player_season_summary`.
- Storage : buckets `tournament-tickets` (privé), `avatars` (public), `event-covers` (public) + policies (upload avatar par son propriétaire : chemin `<uid>/…`).
- RLS complète (spec §4.7).

- [ ] Écrire `0001_schema.sql` idempotent (`create table if not exists`, `create or replace function`, `drop policy if exists` avant `create policy`).
- [ ] Écrire `0002_seed.sql` : jeu `one-piece` ; saison `2026-2027` (« Saison 2026/2027 », 2026-09-01 → 2027-08-31, 16 qualifiés, active) ; barème 15/10/8/6/4/2/1.
- [ ] Vérifier la syntaxe en relisant (pas de base locale) ; commit « Schéma Supabase complet : comptes, tournois, paiements, résultats, ligue ».

---

### Task 3 : Logique pure + tests (`node:test`)

**Files:**
- Create: `src/lib/league/bandai-csv.ts` (déplacé depuis `src/lib/bandai-csv.ts`, enrichi), `src/lib/league/points.ts`, `src/lib/league/matching.ts`, `src/lib/tournaments/status.ts`, `src/lib/payments/amounts.ts`, `src/lib/auth/validation.ts`, `src/lib/slug.ts`, `src/lib/money.ts`
- Create: `tests/bandai-csv.test.ts`, `tests/points.test.ts`, `tests/matching.test.ts`, `tests/status.test.ts`, `tests/amounts.test.ts`, `tests/validation.test.ts`, `tests/fixtures/standing-2026-08.csv`
- Delete: `src/lib/bandai-csv.ts`, `scripts/test-bandai-csv.ts`

**Interfaces (produced):**
```ts
// bandai-csv.ts
export type BandaiRow = { placement: number; bandaiMemberId: string; playerName: string; matchPoints: number; omwPct?: number; oomwPct?: number; wins: number; draws: number; losses: number; memo?: string; deckUrls?: string }
export class BandaiCsvError extends Error {}
export function parseBandaiCsv(text: string, rounds?: number): BandaiRow[]
export function inferRounds(rows: Array<{ matchPoints: number }>): number      // ceil(max/3), min 1
// points.ts
export type PointRule = { label: string; placementMin: number; placementMax: number | null; points: number }
export function computeLeaguePoints(placement: number, rules: PointRule[]): number
// matching.ts
export function normalizeBandaiId(raw: string): string                          // garde uniquement les chiffres
export type MatchPlayer = { id: string; bandaiMemberId: string | null; displayName: string; profileId: string | null }
export type MatchRegistration = { id: string; profileId: string | null; participantName: string; bandaiMemberId: string | null; leaderId: string | null; deckId: string | null }
export type RowMatch = { rowIndex: number; resolution: "auto_player" | "auto_registration" | "unresolved"; playerId: string | null; registrationId: string | null; leaderId: string | null; deckId: string | null }
export function matchRows(rows: BandaiRow[], players: MatchPlayer[], registrations: MatchRegistration[]): { matches: RowMatch[]; noShows: MatchRegistration[] }
// status.ts
export type RegistrationStatus = "pending_payment" | "paid" | "checked_in" | "cancelled" | "refunded"
export function isPaidStatus(s: string): boolean
export function isPendingStatus(s: string): boolean
export function isActiveRegistration(r: { status: string; expires_at: string | null }, nowMs: number): boolean
export type EventWindow = { status: string; starts_at: string; registration_open_at: string | null; registration_close_at: string | null }
export type Availability = { open: boolean; reason: "draft" | "cancelled" | "completed" | "past" | "not_open_yet" | "closed" | null }
export function eventAvailability(e: EventWindow, nowMs: number): Availability
export function seatsLeft(capacity: number, activeCount: number): number      // Infinity si capacity <= 0
// amounts.ts
export function computeTotals(priceCents: number, feeBps: number): { subtotalCents: number; feeCents: number; totalCents: number }
export function centsToMollieValue(cents: number): string                       // "35.00"
export function mollieValueToCents(value: string): number | null
// validation.ts
export function validatePseudo(v: string): string | null       // message d'erreur ou null ; 3–24, [a-z0-9_.-], insensible à la casse
export function validateBandaiId(v: string): string | null     // 6–12 chiffres après normalisation
export function validateFullName(v: string): string | null
export function validateEmail(v: string): string | null
export function validatePassword(v: string): string | null     // 8+
// slug.ts
export function slugify(s: string): string
// money.ts
export function formatEuros(cents: number, currency?: string): string   // "35,00 €"
```

- [ ] Écrire la fixture `tests/fixtures/standing-2026-08.csv` : contenu exact du fichier fourni (avec BOM `﻿`, en-têtes « Classement, Numéro de membre, nom du joueur, points gagnés, OMW %, OOMW %, Memo, Deck URLs », 64 lignes).
- [ ] Tests parseur :
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseBandaiCsv, inferRounds, BandaiCsvError } from "../src/lib/league/bandai-csv.ts";

const real = readFileSync(new URL("./fixtures/standing-2026-08.csv", import.meta.url), "utf8");

test("parse le vrai export Bandai (BOM, espaces d'en-tête, colonnes Memo/Deck URLs)", () => {
  const rows = parseBandaiCsv(real, 6);
  assert.equal(rows.length, 64);
  assert.deepEqual(rows[0], { placement: 1, bandaiMemberId: "0000477052", playerName: "Nicolooo", matchPoints: 18, omwPct: 61.1, oomwPct: 64.6, wins: 6, draws: 0, losses: 0, memo: undefined, deckUrls: undefined });
  assert.equal(rows[3].playerName, "Tony Tony Whopper [BlackSmiths]");
  assert.equal(rows[63].bandaiMemberId, "0000672109");
  assert.deepEqual([rows[7].wins, rows[7].draws, rows[7].losses], [4, 0, 2]);
});
test("en-têtes mal encodés (NumÃ©ro) et séparateur ;", () => {
  const txt = "Classement;NumÃ©ro de membre;Nom du joueur;Points gagnÃ©s;OMW %;OOMW %\n1;0000111222;Test;9;60%;55%";
  const rows = parseBandaiCsv(txt, 3);
  assert.equal(rows[0].bandaiMemberId, "0000111222");
  assert.equal(rows[0].wins, 3);
});
test("inferRounds = plafond(max/3)", () => { assert.equal(inferRounds([{ matchPoints: 18 }, { matchPoints: 15 }]), 6); assert.equal(inferRounds([]), 1); });
test("fichier vide → BandaiCsvError", () => { assert.throws(() => parseBandaiCsv(""), BandaiCsvError); });
```
- [ ] Tests barème (15 pour 1er, 8 pour 4e, 4 pour 9e, 1 pour 40e, 0 pour 70e, règle la plus étroite gagnante quand deux tranches se recouvrent).
- [ ] Tests rapprochement :
```ts
test("priorité joueur existant > inscrit > non résolu ; no-shows", () => {
  const rows = parseBandaiCsv("Classement,Numéro de membre,Nom du joueur,Points gagnés\n1,0001,Alice,9\n2,0002,Bob,6\n3,0003,Zed,3", 3);
  const players = [{ id: "p1", bandaiMemberId: "0001", displayName: "Alice", profileId: null }];
  const regs = [
    { id: "r1", profileId: "u1", participantName: "Alice", bandaiMemberId: "0001", leaderId: "L1", deckId: null },
    { id: "r2", profileId: "u2", participantName: "Bob", bandaiMemberId: "0002", leaderId: null, deckId: "d2" },
    { id: "r9", profileId: "u9", participantName: "Absent", bandaiMemberId: "0009", leaderId: null, deckId: null },
  ];
  const { matches, noShows } = matchRows(rows, players, regs);
  assert.deepEqual(matches[0], { rowIndex: 0, resolution: "auto_player", playerId: "p1", registrationId: "r1", leaderId: "L1", deckId: null });
  assert.deepEqual(matches[1], { rowIndex: 1, resolution: "auto_registration", playerId: null, registrationId: "r2", leaderId: null, deckId: "d2" });
  assert.equal(matches[2].resolution, "unresolved");
  assert.deepEqual(noShows.map((r) => r.id), ["r9"]);
});
test("normalizeBandaiId garde les zéros de tête et retire les espaces", () => { assert.equal(normalizeBandaiId(" 0000 477 052 "), "0000477052"); });
```
- [ ] Tests états : `eventAvailability` (draft → draft ; passé → past ; open_at futur → not_open_yet ; close_at passé → closed ; ok → open), `isActiveRegistration` (pending expiré = false, paid = true), `seatsLeft(0, 10) === Infinity`.
- [ ] Tests montants : `computeTotals(3500, 500)` → `{3500, 175, 3675}` ; `centsToMollieValue(3675) === "36.75"` ; `mollieValueToCents("36.75") === 3675`.
- [ ] Tests validation : pseudo « ab » refusé, « Luffy_92 » accepté, Bandai « 477052 » accepté, « 12ab » refusé, mot de passe 7 caractères refusé.
- [ ] Implémenter, `npm test` vert, commit « Logique ligue pure : parseur Bandai, barème, rapprochement, états, montants ».

---

### Task 4 : Kit UI

**Files:** Create `src/components/ui/{Button,Card,Field,Badge,Alert,StatTile,SectionHeading,EmptyState,Spinner,Tabs,Avatar,PageHeader}.tsx`, `src/components/ui/icons.tsx` (SVG : check, x, warning, mail, lock, user, ticket, download, search, plus, trash, external, chevron, upload, refresh, shield, calendar, trophy).

**Interfaces:**
```tsx
<Button variant="gold"|"brand"|"ghost"|"danger"|"paper" size="sm"|"md"|"lg" href? pending? type?>   // rend <Link> si href
<Card tone="club"|"paper" className?>{children}</Card>
<Field label hint? error? required?><input …/></Field>  + <Input/>, <Select/>, <Textarea/> stylés (bg-coal-900, border hairline, focus gold)
<Badge tone="neutral"|"gold"|"good"|"warn"|"bad">…</Badge>
<Alert tone="info"|"success"|"warn"|"error" title?>…</Alert>
<StatTile value label />, <SectionHeading eyebrow? title action? />, <EmptyState title text? action? />
<Avatar src? name size />
<PageHeader eyebrow? title lede? actions? />
```
- [ ] Implémenter avec les tokens existants ; commit « Kit UI Le Club ».

---

### Task 5 : Authentification

**Files:**
- Create: `src/lib/auth/actions.ts` (`"use server"`), `src/app/connexion/page.tsx` + `LoginForms.tsx` (client), `src/app/connexion/verifier-email/page.tsx` (+ `ResendButton.tsx` client), `src/app/connexion/mot-de-passe-oublie/page.tsx`, `src/app/connexion/nouveau-mot-de-passe/page.tsx`, `src/app/auth/confirm/route.ts`, `src/app/auth/callback/page.tsx` + `CallbackClient.tsx`, `src/app/auth/erreur/page.tsx`, `src/components/UserMenu.tsx` (client), modify `src/components/Header.tsx` (Server Component : lit `getSessionUser` + profil, passe `user`, `isAdmin` à `HeaderNav` client)

**Interfaces:**
```ts
export type ActionState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean }
export async function signUpAction(prev: ActionState, formData: FormData): Promise<ActionState>  // redirect vers /connexion/verifier-email?email=
export async function signInAction(prev: ActionState, formData: FormData): Promise<ActionState>  // redirect vers next
export async function signOutAction(): Promise<void>
export async function resendConfirmationAction(email: string): Promise<ActionState>
export async function forgotPasswordAction(prev, formData): Promise<ActionState>
export async function updatePasswordAction(prev, formData): Promise<ActionState>
export function safeNextPath(input: string | null | undefined, fallback = "/joueur"): string
```
- [ ] `signUpAction` : valide (validation.ts), vérifie unicité pseudo / Bandai ID via client admin (`profiles`), puis `supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${site}/auth/callback?next=…`, data: { pseudo, full_name, bandai_member_id } } })`. Message « déjà inscrit » détecté comme sur le site actuel.
- [ ] `/auth/confirm/route.ts` : `verifyOtp({ token_hash, type })` puis redirect `next` (chemin relatif seulement).
- [ ] `CallbackClient` : gère `#access_token` (setSession), `?code=` (exchangeCodeForSession), sinon `getUser()` ; puis `router.replace(next)`.
- [ ] Pages en « Club », formulaire avec `useActionState`, champ Bandai ID avec aide « Dans l'app Bandai TCG+ : Profil → numéro de membre (10 chiffres) ».
- [ ] Header : « Mon espace » (connecté) / « Connexion » ; menu utilisateur (pseudo, Mon espace, Mes decks, Mes inscriptions, Admin si admin, Déconnexion via form action).
- [ ] Commit « Authentification Supabase : inscription enrichie, confirmation, mot de passe ».

---

### Task 6 : Couche de requêtes typées

**Files:** Create `src/lib/db/types.ts`, `src/lib/db/seasons.ts`, `events.ts`, `standings.ts`, `results.ts`, `players.ts`, `registrations.ts`, `decks.ts`, `profiles.ts`, `leaders.ts`.

**Interfaces (toutes `server-only`, client SSR sauf mention) :**
```ts
getActiveSeason(): Promise<SeasonRow | null>; listSeasons(): Promise<SeasonRow[]>; getSeasonBySlug(slug): Promise<SeasonRow | null>; getPointScale(seasonId): Promise<PointRule[]>
listUpcomingEvents(): Promise<EventWithSeats[]>; listPastEvents(): Promise<EventRow[]>; getEventBySlug(slug): Promise<EventWithSeats | null>; getEventById(id) (admin)
getSeasonStandings(seasonId): Promise<StandingRow[]>  // vue season_standings + pseudo/avatar via public_profiles
getEventResults(eventId): Promise<EventResultRow[]>; getEventMetagame(eventId): Promise<MetagameSlice[]>
getPlayerByProfile(profileId): Promise<PlayerRow | null>; getPlayerHistory(playerId): Promise<PlayerHistoryRow[]>; getPlayerDeckStats(playerId, seasonId): Promise<DeckStat[]>; getPublicProfileByPseudo(pseudo)
getMyRegistrations(profileId): Promise<RegistrationWithEvent[]>; getMyRegistrationForEvent(profileId, eventId)
listMyDecks(profileId): Promise<DeckWithLeader[]>; listLeaders(): Promise<LeaderRow[]>
```
- [ ] Définir les types de lignes ; écrire les requêtes ; commit « Couche de requêtes Supabase ».

---

### Task 7 : Pages publiques branchées sur Supabase

**Files:** Modify `src/app/page.tsx`, `calendrier/page.tsx`, `classement/page.tsx`, `resultats/page.tsx`, `resultats/[slug]/page.tsx`, `reglement/page.tsx`, `src/components/StandingsTable.tsx` (lien vers `/joueurs/[pseudo]`, avatar), `src/components/MetagameDonut.tsx` (vignettes sur les parts ≥ 8 %), `src/components/Countdown.tsx` (inchangé), create `src/components/SeasonSelect.tsx`, `src/components/EventCard.tsx` (affiche), `src/components/EventStatusBadge.tsx`.
- [ ] Accueil : prochain tournoi (compte à rebours + CTA « S'inscrire » vers `/tournois/[slug]`), top 8 de la saison active, dernier résultat. Sans tournoi : état vide élégant.
- [ ] Classement : `?saison=slug`, sélecteur, ligne de qualification, « VOUS » si connecté.
- [ ] Résultats : liste des `completed`, détail avec donut + tableau complet (top 8 en or), lien profil public.
- [ ] Règlement : barème lu en base (saison active), plus de `DEFAULT_SCALE`.
- [ ] Retirer toute mention Riftbound codée ; commit « Pages publiques sur Supabase, classement par saison ».

---

### Task 8 : Fiche tournoi, inscription, Mollie, billet, e-mails

**Files:**
- Create: `src/lib/tournaments/time.ts` (copie adaptée), `src/lib/tournaments/ticket-token.ts`, `src/lib/tournaments/pdf.ts` (billet FR, en-tête charbon/or), `src/lib/payments/mollie.ts`, `src/lib/payments/mollie-invoices.ts`, `src/lib/payments/fulfil.ts`, `src/lib/email/{smtp,senders,tournament-emails}.ts`, `src/lib/email/templates/{tournament-buyer,tournament-admin,layout}.ts`, `src/lib/tournaments/actions.ts` (`"use server"`)
- Create pages: `src/app/tournois/[slug]/page.tsx`, `src/app/tournois/[slug]/inscription/page.tsx` + `RegisterForm.tsx`, `src/app/tournois/paiement/retour/page.tsx` (+ `AutoRefresh.tsx`), `src/app/tournois/inscription/[id]/page.tsx` (+ `DownloadTicketButton.tsx`), `src/app/api/mollie/webhook/route.ts`, `src/app/api/billets/[registrationId]/pdf/route.ts`, `src/components/LeaderPicker.tsx` (client, recherche + vignettes), `src/components/PayNowButton.tsx`

**Interfaces:**
```ts
// mollie.ts (server-only)
export async function mollieCreatePayment(p: { amountValue: string; currency: string; description: string; redirectUrl: string; webhookUrl: string; metadata?: Record<string, unknown> }): Promise<{ id: string; checkoutUrl: string; status: string }>
export async function mollieGetPayment(id: string): Promise<MolliePayment>
export async function mollieCancelPayment(id: string): Promise<void>
// fulfil.ts (server-only) — idempotent, appelé par webhook / retour / cash / free
export async function markRegistrationPaid(registrationId: string, opts: { paymentStatus?: string }): Promise<void>
export async function fulfilRegistration(registrationId: string, baseUrl: string): Promise<{ ticketPath: string | null; invoiceId: string | null; emailWarning: string | null }>
// actions.ts
export async function startCheckoutAction(prev: ActionState, formData: FormData): Promise<ActionState>  // redirect vers checkoutUrl (ou confirmation si gratuit)
export async function resumeCheckoutAction(eventId: string): Promise<ActionState>                       // « Payer maintenant »
export async function cancelPendingRegistrationAction(registrationId: string): Promise<ActionState>
export async function updateRegistrationDeckAction(registrationId: string, deckId: string | null, leaderId: string | null): Promise<ActionState>
```
- [ ] `startCheckoutAction` : requireUser + profil complet ; `rpc("reserve_seat")` avec client SSR ; messages FR par code d'erreur ; total via `computeTotals` ; si total 0 → `markRegistrationPaid` + `fulfilRegistration` + redirect ; sinon paiement Mollie, patch ligne (`payment_provider`, `mollie_payment_id`, `amount_cents`, `billing_data`, participant_*), journal, `redirect(checkoutUrl)`.
- [ ] Webhook : lit `id` (form-urlencoded / json), `mollieGetPayment`, journal, si `paid` et montant/devise ok → `markRegistrationPaid` + `fulfilRegistration` ; toujours 200.
- [ ] Page retour : requireUser ; charge la ligne (propriétaire) ; si pending & mollie → `mollieGetPayment` ; si paid → marque + fulfil (au cas où le webhook n'est pas encore passé) → redirect confirmation ; sinon message + `<AutoRefresh seconds={4} />` (client, `router.refresh()`), bouton annuler.
- [ ] Confirmation `/tournois/inscription/[id]` (affiche « Affiche ») : récap, bouton « Télécharger mon billet » (route PDF signée 10 min), rappel arrivée 30 min avant.
- [ ] E-mails FR : joueur (PDF joint) + admin ; idempotence `email_events`.
- [ ] Commit « Inscription aux tournois avec paiement Mollie, billet PDF et e-mails ».

---

### Task 9 : Billet public et check-in

**Files:** Create `src/app/billet/[token]/page.tsx`, `src/lib/tournaments/checkin.ts` (`"use server"` : `checkInByTokenAction(token)`, `checkInRegistrationAction(registrationId)` admin), `src/components/CheckInButton.tsx`.
- [ ] Page serveur : hash du token → ligne + événement ; statut `valid | already_checked_in | not_paid | invalid | expired` ; si admin, bouton de confirmation ; journal `admin_events`.
- [ ] Commit « Billet public et check-in QR ».

---

### Task 10 : Espace joueur et profils publics

**Files:** Create `src/app/joueur/page.tsx`, `src/app/joueur/profil/page.tsx` + `ProfileForm.tsx`, `src/app/joueur/decks/page.tsx` + `DeckForm.tsx` + `DeckList.tsx`, `src/app/joueur/inscriptions/page.tsx`, `src/app/joueurs/[pseudo]/page.tsx`, `src/lib/profiles/actions.ts` (`updateProfileAction`, `uploadAvatarAction`), `src/lib/decks/actions.ts` (`saveDeckAction`, `deleteDeckAction`, `toggleDeckVisibilityAction`), `src/components/PlayerStats.tsx` (tuiles + barre de qualification), `src/components/PlayerHistory.tsx`, `src/components/DeckCard.tsx`.
- [ ] Dashboard : alerte profil incomplet ; stats de la saison active ; historique ; inscriptions à venir (statut, billet, « Payer maintenant », annuler) ; decks.
- [ ] Profil : pseudo (unicité), nom, Bandai ID (unicité, normalisation), avatar (upload bucket `avatars/<uid>/avatar.<ext>` via client SSR côté serveur), bio, téléphone, visibilité.
- [ ] Decks : nom, leader (LeaderPicker), decklist texte, notes, public ; carte avec visuel du leader.
- [ ] Profil public : 404 si `is_public = false` ou introuvable ; stats + historique + decks publics.
- [ ] Commit « Espace joueur : dashboard, profil, decks, profils publics ».

---

### Task 11 : Admin — layout, tableau de bord, tournois

**Files:** Create `src/app/admin/layout.tsx` (requireAdmin + nav), `src/app/admin/page.tsx`, `src/app/admin/tournois/page.tsx`, `src/app/admin/tournois/nouveau/page.tsx`, `src/app/admin/tournois/[id]/page.tsx`, `src/components/admin/EventForm.tsx` (client, `useActionState`), `src/lib/admin/events.ts` (`"use server"` : `saveEventAction`, `deleteEventAction`, `setEventStatusAction`), `src/components/admin/AdminNav.tsx`.
- [ ] Formulaire : champs de la spec §4.4, dates en heure de Paris (`isoToParisLocalInput` / `parisLocalInputToIso`), tarif en euros (centimes en base), « dupliquer depuis » (sélecteur), slug auto.
- [ ] Liste : statut, date, inscrits payés / capacité, liens participants / résultats / modifier ; suppression avec confirmation (impossible si résultats publiés).
- [ ] Commit « Admin : tableau de bord et gestion des tournois ».

---

### Task 12 : Admin — participants

**Files:** Create `src/app/admin/tournois/[id]/participants/page.tsx`, `src/components/admin/ParticipantsTable.tsx` (client : recherche, actions), `src/components/admin/CashRegistrationForm.tsx`, `src/lib/admin/registrations.ts` (`"use server"` : `addCashRegistrationAction`, `deleteRegistrationAction`, `refundRegistrationAction`, `adminCheckInAction`, `resendTicketAction`), `src/app/api/admin/tournois/[id]/participants.csv/route.ts`.
- [ ] Cash : capacité, insertion `paid`/`cash`, `fulfilRegistration`.
- [ ] Commit « Admin : participants, inscriptions cash, export CSV ».

---

### Task 13 : Admin — import des résultats

**Files:** Create `src/lib/league/import.ts` (`server-only` : `createImport`, `resolveRow`, `applyImport`, `discardImport`), `src/lib/admin/results.ts` (`"use server"` wrappers), `src/app/admin/tournois/[id]/resultats/page.tsx`, `src/components/admin/ResultsImportUpload.tsx`, `src/components/admin/ImportRowsTable.tsx` (client : résolution par ligne, leader), `src/components/admin/PlayerSearch.tsx`.
- [ ] Upload → parse → `matchRows` → insertion `result_imports` + rows ; page affiche l'import pending (une seule pending par événement).
- [ ] Résolution : `linkRowToRegistration` (met à jour `profiles.bandai_member_id` si vide et crée/lie le `players`), `linkRowToPlayer`, `createGuestPlayer`, `skipRow`, `setRowLeader`.
- [ ] `applyImport` : supprime les `results` existants de l'événement, crée joueurs manquants (bandai id + nom CSV), insère `results` (leader depuis la ligne), `apply_league_points`, événement `completed`, import `applied`, `revalidatePath` inutile (dynamique).
- [ ] Commit « Admin : import des résultats Bandai avec rapprochement ».

---

### Task 14 : Admin — saisons, barème, joueurs

**Files:** Create `src/app/admin/saisons/page.tsx`, `src/components/admin/SeasonForm.tsx`, `src/components/admin/PointScaleEditor.tsx`, `src/lib/admin/seasons.ts` (`saveSeasonAction`, `activateSeasonAction`, `savePointScaleAction` → `apply_league_points` sur tous les événements de la saison), `src/app/admin/joueurs/page.tsx`, `src/components/admin/PlayersTable.tsx`, `src/lib/admin/players.ts` (`updatePlayerAction`, `linkPlayerToProfileAction`, `mergePlayersAction`).
- [ ] Commit « Admin : saisons, barème, identités joueurs ».

---

### Task 15 : README, vérification, polish

- [ ] README : installation Supabase (migrations, templates d'e-mail avec `token_hash`, URL du site, buckets), variables, Mollie test + tunnel webhook, promotion admin, parcours de test manuel.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` verts ; corriger.
- [ ] Commit « README de mise en service ; vérifications ».
