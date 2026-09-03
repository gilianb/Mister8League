import type { Metadata } from "next";
import Link from "next/link";
import GameTabs from "@/components/GameTabs";
import PageBackdrop from "@/components/PageBackdrop";
import { getPastEvents } from "@/lib/data";
import { formatDateShort } from "@/lib/format";

export const metadata: Metadata = {
  title: "Résultats de nos tournois",
  description:
    "Les classements finaux, leaders joués et decklists des tournois de la Mister 8 Tournament League.",
};

type Props = { searchParams: Promise<{ jeu?: string }> };

export default async function ResultatsPage({ searchParams }: Props) {
  const { jeu } = await searchParams;
  const game = jeu === "riftbound" ? "riftbound" : "one-piece";

  const past = await getPastEvents();
  const events = past.filter((e) => e.gameSlug === game);

  return (
    <div className="relative">
      <PageBackdrop src="/ambiance/bg-resultats.jpg" position="50% 20%" />
      <div className="relative mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream-100 mb-2">
        Résultats de nos tournois
      </h1>
      <p className="text-cream-400 mb-6 max-w-[60ch]">
        Pour chaque tournoi passé : classement final, leaders joués et
        decklists du top 8.
      </p>
      <GameTabs current={game} basePath="/resultats" />

      {events.length > 0 ? (
        <div className="grid gap-4">
          {events.map((e) => (
            <Link
              key={e.slug}
              href={`/resultats/${e.slug}`}
              className="rounded-xl border hairline bg-coal-800 p-5 flex flex-wrap items-center gap-x-6 gap-y-2 hover:border-gold-400/50 transition-colors"
            >
              <div className="flex-1 min-w-52">
                <p className="text-[10px] tracking-[0.2em] text-cream-600 font-semibold">
                  {formatDateShort(e.startsAt).toUpperCase()} · {e.formatLabel}
                </p>
                <h2 className="font-display text-lg font-bold text-cream-100 mt-0.5">
                  {e.name}
                </h2>
              </div>
              <span className="text-sm text-gold-400 font-medium">
                Voir le classement →
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-rift-400/25 bg-coal-800 p-8 text-center">
          <p className="text-[11px] tracking-[0.24em] text-rift-300 font-semibold mb-3">
            RIFTBOUND TCG
          </p>
          <h2 className="font-display text-xl font-bold text-cream-100 mb-3">
            Aucun résultat publié pour l&apos;instant
          </h2>
          <p className="text-sm text-cream-400 max-w-[52ch] mx-auto">
            Les résultats des tournois Riftbound apparaîtront ici après le
            prochain événement, dimanche 13 septembre 2026 à Courbevoie.
          </p>
        </div>
      )}
    </div>
    </div>
  );
}
