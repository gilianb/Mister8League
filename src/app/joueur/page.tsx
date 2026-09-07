import type { Metadata } from "next";
import Link from "next/link";
import { getSessionWithProfile, isProfileComplete } from "@/lib/auth/session";
import { getActiveSeason } from "@/lib/db/seasons";
import { getPlayerByProfileId, getPlayerDeckStats, getPlayerHistory } from "@/lib/db/players";
import { cutPoints, getPlayerStanding, getSeasonStandings } from "@/lib/db/standings";
import { getMyRegistrations } from "@/lib/db/registrations";
import { listMyDecks } from "@/lib/db/decks";
import { isActiveRegistration, isPaidStatus } from "@/lib/tournaments/status";
import { formatDateShort, formatTime } from "@/lib/format";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PointsBars, QualificationBar, StatTiles } from "@/components/PlayerStats";
import { DeckStatsList, HistoryList } from "@/components/PlayerHistory";
import DeckCard from "@/components/DeckCard";
import PayNowButton from "@/components/PayNowButton";
import { currentTimeMs } from "@/lib/clock";

export const metadata: Metadata = { title: "Mon espace joueur", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ message?: string }> };

export default async function JoueurPage({ searchParams }: Props) {
  const { message } = await searchParams;
  const { user, profile } = await getSessionWithProfile();
  if (!user) return null; // le layout redirige
  const complete = isProfileComplete(profile);

  const [season, player, registrations, decks] = await Promise.all([
    getActiveSeason(),
    getPlayerByProfileId(user.id),
    getMyRegistrations(),
    listMyDecks(),
  ]);
  const [standing, standings, history, deckStats] = await Promise.all([
    season && player ? getPlayerStanding(season.id, player.id) : Promise.resolve(null),
    season ? getSeasonStandings(season.id) : Promise.resolve([]),
    player ? getPlayerHistory(player.id) : Promise.resolve([]),
    player && season ? getPlayerDeckStats(player.id, season.id) : Promise.resolve([]),
  ]);

  const nowMs = currentTimeMs();
  const upcoming = registrations.filter((r) => isActiveRegistration(r, nowMs) && new Date(r.event.starts_at).getTime() > nowMs - 12 * 3_600_000);
  const seasonHistory = season ? history.filter((h) => h.season_id === season.id) : history;
  const name = profile?.pseudo ?? user.email ?? "Joueur";

  return (
    <div className="space-y-10">
      {message === "mot-de-passe" && <Alert tone="success">Mot de passe mis à jour.</Alert>}
      {!complete && (
        <Alert tone="warn" title="Profil incomplet">
          Renseignez votre pseudo, votre nom complet et votre numéro de membre Bandai pour vous inscrire aux tournois et voir
          vos résultats.{" "}
          <Link href="/joueur/profil" className="font-semibold underline underline-offset-4">
            Compléter mon profil
          </Link>
        </Alert>
      )}

      <header className="flex flex-wrap items-center gap-5 border-b hairline pb-7">
        <Avatar src={profile?.avatar_url} name={name} size={72} />
        <div className="min-w-0 flex-1">
          <p className="kicker">{season?.name ?? "Espace joueur"}</p>
          <h1 className="mt-1 truncate font-display text-4xl font-semibold tracking-[-0.025em] text-cream-100">{name}</h1>
          <p className="mt-2 text-sm text-cream-500">
            {profile?.bandai_member_id ? `Membre Bandai ${profile.bandai_member_id}` : "Numéro de membre Bandai non renseigné"}
            {profile?.pseudo && profile.is_public && (
              <>
                {" "}
                <span aria-hidden="true">·</span>{" "}
                <Link href={`/joueurs/${encodeURIComponent(profile.pseudo)}`} className="text-link">
                  Voir mon profil public
                </Link>
              </>
            )}
          </p>
        </div>
      </header>

      {season && <QualificationBar standing={standing} qualifiedCount={season.qualified_count} cutPoints={cutPoints(standings, season.qualified_count)} />}
      <StatTiles standing={standing} />

      <section>
        <SectionHeading
          title="Mes prochains tournois"
          action={
            <Link href="/calendrier" className="text-link text-sm">
              Calendrier
            </Link>
          }
        />
        {upcoming.length === 0 ? (
          <div className="mt-4 border-t hairline pt-5">
            <p className="max-w-[50ch] text-sm leading-relaxed text-cream-400">Aucune inscription en cours. Retrouvez les dates de la saison et réservez votre place.</p>
            <Button href="/calendrier" variant="outline" size="sm" className="mt-4">
              Choisir un tournoi
            </Button>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-hairline border-y hairline">
            {upcoming.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 py-4">
                <div className="min-w-48 flex-1">
                  <Link href={`/tournois/${r.event.slug}`} className="font-display text-xl font-medium tracking-tight text-cream-100 transition-colors hover:text-gold-300">
                    {r.event.title}
                  </Link>
                  <p className="mt-1 text-[13px] text-cream-500">
                    {formatDateShort(r.event.starts_at)}, {formatTime(r.event.starts_at)}
                    {r.leader ? `, leader ${r.leader.name}` : ""}
                  </p>
                </div>
                {isPaidStatus(r.status) ? (
                  <>
                    <Badge tone="good">Inscrit</Badge>
                    <Button href={`/tournois/inscription/${r.id}`} variant="outline" size="sm">
                      Mon billet
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge tone="warn">Paiement en attente</Badge>
                    <PayNowButton registrationId={r.id} size="sm" />
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <PointsBars history={seasonHistory} />
      <HistoryList history={history} />
      <DeckStatsList stats={deckStats} />

      <section>
        <SectionHeading
          title="Mes decks"
          action={
            <Link href="/joueur/decks" className="text-link text-sm">
              Gérer mes decks
            </Link>
          }
        />
        {decks.length === 0 ? (
          <div className="mt-4 border-t hairline pt-5">
            <p className="max-w-[50ch] text-sm leading-relaxed text-cream-400">Enregistrez vos decks pour les déclarer en un clic à chaque inscription.</p>
            <Button href="/joueur/decks?nouveau" variant="outline" size="sm" className="mt-4">
              Ajouter un deck
            </Button>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {decks.slice(0, 4).map((d) => (
              <DeckCard key={d.id} deck={d} showVisibility />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
