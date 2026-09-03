import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LeaderChip from "@/components/LeaderChip";
import PageBackdrop from "@/components/PageBackdrop";
import MetagameDonut from "@/components/MetagameDonut";
import {
  getEventBySlug,
  getEventResults,
  getEventMetagame,
  getPastEvents,
} from "@/lib/data";
import { formatDateLong, placementLabel } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const past = await getPastEvents();
  return past.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};
  return {
    title: `Résultats · ${event.name}`,
    description: `Classement final du tournoi ${event.name} (${event.formatLabel}) de la Mister 8 Tournament League.`,
  };
}

export default async function ResultatDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || event.status !== "completed") notFound();

  const [results, metagame] = await Promise.all([
    getEventResults(slug),
    getEventMetagame(slug),
  ]);

  return (
    <div className="relative">
      <PageBackdrop src="/ambiance/bg-resultats.jpg" position="50% 20%" />
      <div className="relative mx-auto max-w-5xl px-4 py-12">
      <Link href="/resultats" className="text-sm text-cream-600 hover:text-gold-400">
        ← Tous les résultats
      </Link>
      <p className="text-[11px] tracking-[0.24em] text-gold-400 font-semibold mt-6 mb-2">
        {formatDateLong(event.startsAt).toUpperCase()} · {event.formatLabel} ·{" "}
        {event.capacity} JOUEURS
      </p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream-100 mb-10">
        {event.name}
      </h1>

      {metagame.length > 0 && (
        <section className="rounded-2xl border hairline bg-coal-800 p-6 sm:p-8 mb-10">
          <h2 className="font-display text-xl font-bold text-cream-100 mb-6">
            Les leaders joués
          </h2>
          <MetagameDonut slices={metagame} />
        </section>
      )}

      <section>
        <h2 className="font-display text-xl font-bold text-cream-100 mb-4">
          Classement final
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular border-collapse">
            <thead>
              <tr className="text-[10px] tracking-[0.16em] text-cream-600 text-left">
                <th className="py-2 pr-2 font-semibold w-10">#</th>
                <th className="py-2 pr-3 font-semibold">JOUEUR</th>
                <th className="py-2 pr-3 font-semibold hidden sm:table-cell">LEADER</th>
                <th className="py-2 pr-3 font-semibold text-right">BILAN</th>
                <th className="py-2 pr-3 font-semibold text-right hidden md:table-cell">OMW %</th>
                <th className="py-2 pr-3 font-semibold text-right hidden md:table-cell">OOMW %</th>
                <th className="py-2 font-semibold text-right">PTS LIGUE</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.placement} className="border-t hairline">
                  <td className={`py-2.5 pr-2 font-bold ${r.placement <= 8 ? "text-gold-400" : "text-cream-600"}`}>
                    {placementLabel(r.placement)}
                  </td>
                  <td className="py-2.5 pr-3 font-medium text-cream-100">
                    {r.displayName}
                  </td>
                  <td className="py-2.5 pr-3 text-cream-400 hidden sm:table-cell">
                    <LeaderChip code={r.leaderCode} name={r.leaderName} />
                  </td>
                  <td className="py-2.5 pr-3 text-right text-cream-400">
                    {r.wins}-{r.losses}
                    {r.draws > 0 ? `-${r.draws}` : ""}
                  </td>
                  <td className="py-2.5 pr-3 text-right text-cream-600 hidden md:table-cell">
                    {r.omwPct?.toFixed(1) ?? "—"}
                  </td>
                  <td className="py-2.5 pr-3 text-right text-cream-600 hidden md:table-cell">
                    {r.oomwPct?.toFixed(1) ?? "—"}
                  </td>
                  <td className="py-2.5 text-right font-bold text-cream-100">
                    +{r.leaguePoints}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-cream-600">
          Top 16 affiché · classement complet et decklists du top 8 publiés
          prochainement.
        </p>
      </section>
    </div>
    </div>
  );
}
