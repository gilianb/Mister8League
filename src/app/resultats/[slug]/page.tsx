import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import LeaderChip from "@/components/LeaderChip";
import PageBackdrop from "@/components/PageBackdrop";
import MetagameDonut from "@/components/MetagameDonut";
import { PlayerName } from "@/components/StandingsTable";
import { getEventBySlug } from "@/lib/db/events";
import { getEventMetagame, getEventResults, toMetagameSlices } from "@/lib/db/results";
import { formatDateLong, placementLabel } from "@/lib/format";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};
  return {
    title: `Résultats · ${event.title}`,
    description: `Classement final du tournoi ${event.title}${event.format_label ? ` (${event.format_label})` : ""} de la Mister 8 Tournament League.`,
  };
}

export default async function ResultatDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  if (event.status !== "completed") redirect(`/tournois/${event.slug}`);

  const [results, metagameRows] = await Promise.all([getEventResults(event.id), getEventMetagame(event.id)]);
  const metagame = toMetagameSlices(metagameRows);
  const withLeader = results.filter((r) => r.leader_id).length;

  return (
    <div className="relative">
      <PageBackdrop src="/ambiance/bg-resultats.jpg" position="50% 20%" />
      <div className="relative mx-auto max-w-5xl px-4 py-12">
        <Link href="/resultats" className="text-sm text-cream-600 hover:text-gold-400">
          ← Tous les résultats
        </Link>
        <p className="text-[11px] tracking-[0.24em] text-gold-400 font-semibold mt-6 mb-2">
          {formatDateLong(event.starts_at).toUpperCase()}
          {event.format_label && ` · ${event.format_label}`} · {results.length} JOUEURS
          {event.rounds ? ` · ${event.rounds} RONDES` : ""}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream-100 mb-10">{event.title}</h1>

        {results.length > 0 && (
          <section className="grid sm:grid-cols-3 gap-4 mb-10">
            {results.slice(0, 3).map((r) => (
              <div
                key={r.result_id}
                className={cn(
                  "rounded-2xl border p-5 bg-coal-800",
                  r.placement === 1 ? "border-gold-400/60 shadow-[0_0_0_1px_rgba(246,195,107,.25)]" : "hairline"
                )}
              >
                <p className={cn("font-display text-3xl font-bold", r.placement === 1 ? "text-gold-400" : "text-cream-100")}>
                  {placementLabel(r.placement)}
                </p>
                <div className="mt-2 font-semibold text-cream-100">
                  <PlayerName row={r} size={32} />
                </div>
                <div className="mt-2 text-sm text-cream-400">
                  <LeaderChip code={r.leader_code} name={r.leader_name} imageUrl={r.leader_image_url} size={24} />
                </div>
                <p className="mt-2 text-xs text-cream-600 tabular">
                  {r.wins ?? 0}-{r.losses ?? 0}
                  {(r.draws ?? 0) > 0 ? `-${r.draws}` : ""} · +{r.league_points} pts
                </p>
              </div>
            ))}
          </section>
        )}

        {metagame.length > 0 && (
          <section className="rounded-2xl border hairline bg-coal-800 p-6 sm:p-8 mb-10">
            <h2 className="font-display text-xl font-bold text-cream-100 mb-1">Les leaders joués</h2>
            {withLeader < results.length && (
              <p className="text-xs text-cream-600 mb-5">
                Leader connu pour {withLeader} joueur{withLeader > 1 ? "s" : ""} sur {results.length}.
              </p>
            )}
            <div className={withLeader < results.length ? "" : "mt-5"}>
              <MetagameDonut slices={metagame} />
            </div>
          </section>
        )}

        <section>
          <h2 className="font-display text-xl font-bold text-cream-100 mb-4">Classement final</h2>
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
                  <tr key={r.result_id} className="border-t hairline">
                    <td className={cn("py-2.5 pr-2 font-bold", r.placement <= 8 ? "text-gold-400" : "text-cream-600")}>
                      {placementLabel(r.placement)}
                    </td>
                    <td className="py-2.5 pr-3 font-medium text-cream-100">
                      <PlayerName row={r} size={24} />
                    </td>
                    <td className="py-2.5 pr-3 text-cream-400 hidden sm:table-cell">
                      <LeaderChip code={r.leader_code} name={r.leader_name} imageUrl={r.leader_image_url} />
                    </td>
                    <td className="py-2.5 pr-3 text-right text-cream-400">
                      {r.wins ?? 0}-{r.losses ?? 0}
                      {(r.draws ?? 0) > 0 ? `-${r.draws}` : ""}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-cream-600 hidden md:table-cell">
                      {r.omw_pct != null ? Number(r.omw_pct).toFixed(1) : "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-cream-600 hidden md:table-cell">
                      {r.oomw_pct != null ? Number(r.oomw_pct).toFixed(1) : "—"}
                    </td>
                    <td className="py-2.5 text-right font-bold text-cream-100">+{r.league_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-cream-600">
            Source : export officiel Bandai TCG+ · OMW / OOMW : tiebreakers du tournoi.
          </p>
        </section>
      </div>
    </div>
  );
}
