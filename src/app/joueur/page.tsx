import type { Metadata } from "next";
import Link from "next/link";
import { getSessionWithProfile, isProfileComplete } from "@/lib/auth/session";
import { getActiveSeason } from "@/lib/db/seasons";
import { getPlayerByProfileId, getPlayerDeckStats, getPlayerHistory } from "@/lib/db/players";
import { cutPoints, getPlayerStanding, getSeasonStandings } from "@/lib/db/standings";
import { getMyRegistrations } from "@/lib/db/registrations";
import { listMyDecks } from "@/lib/db/decks";
import { isActiveRegistration, isPaidStatus } from "@/lib/tournaments/status";
import { formatDateShort } from "@/lib/format";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
    <div className="space-y-6">
      {message === "mot-de-passe" && <Alert tone="success">Mot de passe mis à jour.</Alert>}
      {!complete && (
        <Alert tone="warn" title="Profil incomplet">
          Renseignez votre pseudo, votre nom complet et votre numéro de membre Bandai pour vous inscrire aux tournois et
          voir vos résultats.{" "}
          <Link href="/joueur/profil" className="underline font-semibold">
            Compléter mon profil
          </Link>
        </Alert>
      )}

      <div className="flex items-center gap-4">
        <Avatar src={profile?.avatar_url} name={name} size={56} />
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-cream-100 truncate">{name}</h1>
          <p className="text-xs text-cream-600">
            {profile?.bandai_member_id ? `ID Bandai ${profile.bandai_member_id}` : "ID Bandai non renseigné"}
            {season && ` · ${season.name}`}
            {profile?.pseudo && profile.is_public && (
              <>
                {" · "}
                <Link href={`/joueurs/${encodeURIComponent(profile.pseudo)}`} className="text-gold-400 hover:underline">
                  voir mon profil public
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      {season && <QualificationBar standing={standing} qualifiedCount={season.qualified_count} cutPoints={cutPoints(standings, season.qualified_count)} />}
      <StatTiles standing={standing} />

      <section className="rounded-2xl border hairline bg-coal-800 p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold">MES PROCHAINS TOURNOIS</h2>
          <Link href="/calendrier" className="text-xs text-gold-400 hover:underline">
            Calendrier →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-cream-400">
            Aucune inscription en cours.{" "}
            <Link href="/calendrier" className="text-gold-400 underline">
              Voir les prochains tournois
            </Link>
          </p>
        ) : (
          <ul className="divide-y hairline">
            {upcoming.map((r) => (
              <li key={r.id} className="py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex-1 min-w-48">
                  <Link href={`/tournois/${r.event.slug}`} className="font-medium text-cream-100 hover:text-gold-400">
                    {r.event.title}
                  </Link>
                  <p className="text-xs text-cream-600">
                    {formatDateShort(r.event.starts_at)}
                    {r.leader ? ` · ${r.leader.name}` : ""}
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

      <section className="rounded-2xl border hairline bg-coal-800 p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold">MES DECKS</h2>
          <Link href="/joueur/decks" className="text-xs text-gold-400 hover:underline">
            Gérer mes decks →
          </Link>
        </div>
        {decks.length === 0 ? (
          <p className="text-sm text-cream-400">
            Enregistrez vos decks pour les déclarer en un clic à chaque inscription.{" "}
            <Link href="/joueur/decks" className="text-gold-400 underline">
              Ajouter un deck
            </Link>
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {decks.slice(0, 4).map((d) => (
              <DeckCard key={d.id} deck={d} showVisibility />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
