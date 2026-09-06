import type { Metadata } from "next";
import PageBackdrop from "@/components/PageBackdrop";
import SeasonTabs from "@/components/SeasonTabs";
import StandingsTable from "@/components/StandingsTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { getActiveSeason, getSeasonBySlug, listSeasons } from "@/lib/db/seasons";
import { getSeasonStandings } from "@/lib/db/standings";
import { listSeasonEvents } from "@/lib/db/events";
import { getSessionUser } from "@/lib/auth/session";
import { getPlayerByProfileId } from "@/lib/db/players";

export const metadata: Metadata = {
  title: "Classement de la ligue",
  description:
    "Le classement général de la Mister 8 Tournament League par saison : points de ligue, tournois joués et zone de qualification pour la finale.",
};
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ saison?: string }> };

export default async function ClassementPage({ searchParams }: Props) {
  const { saison } = await searchParams;
  const [seasons, active, user] = await Promise.all([listSeasons(), getActiveSeason(), getSessionUser()]);
  const season = (saison ? await getSeasonBySlug(saison) : null) ?? active ?? seasons[0] ?? null;

  const [standings, events, player] = await Promise.all([
    season ? getSeasonStandings(season.id) : Promise.resolve([]),
    season ? listSeasonEvents(season.id) : Promise.resolve([]),
    user ? getPlayerByProfileId(user.id) : Promise.resolve(null),
  ]);
  const completedCount = events.filter((e) => e.status === "completed" && e.counts_for_league).length;

  return (
    <div className="relative">
      <PageBackdrop src="/ambiance/bg-classement.jpg" position="60% 35%" />
      <div className="relative mx-auto max-w-4xl px-4 py-12">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream-100 mb-6">Classement de la ligue</h1>
        <SeasonTabs seasons={seasons} currentSlug={season?.slug ?? null} basePath="/classement" />

        {season ? (
          <>
            <p className="text-[11px] tracking-[0.24em] text-gold-400 font-semibold mb-3">
              {season.name.toUpperCase()} · ONE PIECE CARD GAME
              {season.status === "closed" && " · SAISON TERMINÉE"}
            </p>
            <p className="text-cream-400 mb-8">
              {completedCount} tournoi{completedCount > 1 ? "s" : ""} comptabilisé{completedCount > 1 ? "s" : ""} · les{" "}
              {season.qualified_count} premiers sont qualifiés pour la finale de saison.
            </p>
            {standings.length > 0 ? (
              <StandingsTable rows={standings} qualifiedCount={season.qualified_count} highlightPlayerId={player?.id ?? null} />
            ) : (
              <EmptyState
                title="Aucun résultat publié pour cette saison"
                text="Le classement apparaîtra dès la publication des résultats du premier tournoi."
              />
            )}
          </>
        ) : (
          <EmptyState title="Aucune saison en cours" text="La saison sera ouverte prochainement par les organisateurs." />
        )}
      </div>
    </div>
  );
}
