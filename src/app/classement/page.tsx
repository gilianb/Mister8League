import type { Metadata } from "next";
import GameTabs from "@/components/GameTabs";
import StandingsTable from "@/components/StandingsTable";
import { getActiveSeason, getStandings, getPastEvents } from "@/lib/data";

export const metadata: Metadata = {
  title: "Classement de la ligue",
  description:
    "Le classement général de la Mister 8 Tournament League : points de ligue, tournois joués et zone de qualification pour la finale de saison.",
};

type Props = { searchParams: Promise<{ jeu?: string }> };

export default async function ClassementPage({ searchParams }: Props) {
  const { jeu } = await searchParams;
  const game = jeu === "riftbound" ? "riftbound" : "one-piece";

  const [season, standings, past] = await Promise.all([
    getActiveSeason(),
    getStandings(),
    getPastEvents(),
  ]);

  const nextRiftbound = "13 septembre 2026";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream-100 mb-6">
        Classement de la ligue
      </h1>
      <GameTabs current={game} basePath="/classement" />

      {game === "one-piece" ? (
        <>
          <p className="text-[11px] tracking-[0.24em] text-gold-400 font-semibold mb-3">
            {season.name.toUpperCase()} · {season.gameName.toUpperCase()}
          </p>
          <p className="text-cream-400 mb-8">
            {past.length} tournoi{past.length > 1 ? "s" : ""} comptabilisé
            {past.length > 1 ? "s" : ""} · les {season.qualifiedCount} premiers
            sont qualifiés pour la finale de saison.
          </p>
          <StandingsTable
            rows={standings}
            qualifiedCount={season.qualifiedCount}
          />
        </>
      ) : (
        <div className="rounded-2xl border border-rift-400/25 bg-coal-800 p-8 text-center">
          <p className="text-[11px] tracking-[0.24em] text-rift-300 font-semibold mb-3">
            RIFTBOUND TCG
          </p>
          <h2 className="font-display text-xl font-bold text-cream-100 mb-3">
            Le classement Riftbound arrive
          </h2>
          <p className="text-sm text-cream-400 max-w-[52ch] mx-auto">
            Les tournois Riftbound ne rapportent pas encore de points de
            ligue. Rejoignez-nous au prochain tournoi le {nextRiftbound} à
            Courbevoie — inscription sur mister-8.com.
          </p>
        </div>
      )}
    </div>
  );
}
