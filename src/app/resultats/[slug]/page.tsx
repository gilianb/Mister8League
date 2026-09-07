import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import LeaderChip from "@/components/LeaderChip";
import MetagameDonut from "@/components/MetagameDonut";
import { PlayerName } from "@/components/StandingsTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
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

function record(r: { wins: number | null; losses: number | null; draws: number | null }) {
  return `${r.wins ?? 0}-${r.losses ?? 0}${(r.draws ?? 0) > 0 ? `-${r.draws}` : ""}`;
}

export default async function ResultatDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  if (event.status !== "completed") redirect(`/tournois/${event.slug}`);

  const [results, metagameRows] = await Promise.all([getEventResults(event.id), getEventMetagame(event.id)]);
  const metagame = toMetagameSlices(metagameRows);
  const withLeader = results.filter((r) => r.leader_id).length;
  const podium = results.slice(0, 3);

  return (
    <div className="page-shell py-12 sm:py-16">
      <PageHeader
        backHref="/resultats"
        backLabel="Tous les résultats"
        eyebrow={`${formatDateLong(event.starts_at)}${event.format_label ? `, ${event.format_label}` : ""}`}
        title={event.title}
        lede={`${results.length} joueur${results.length > 1 ? "s" : ""}${event.rounds ? `, ${event.rounds} rondes` : ""}${event.counts_for_league ? ". Tournoi comptant pour la ligue." : ". Tournoi hors ligue."}`}
      />

      {podium.length > 0 && (
        <section aria-label="Podium" className="grid gap-4 sm:grid-cols-3">
          {podium.map((r) => (
            <div
              key={r.result_id}
              className={cn("rounded-panel border p-5 sm:p-6", r.placement === 1 ? "border-gold-400/50 bg-gold-400/6" : "hairline bg-coal-800")}
            >
              <p className={cn("display-number text-4xl", r.placement === 1 ? "text-gold-400" : "text-cream-100")}>{placementLabel(r.placement)}</p>
              <div className="mt-4 font-medium text-cream-100">
                <PlayerName row={r} size={40} />
              </div>
              <div className="mt-3 text-sm text-cream-400">
                <LeaderChip code={r.leader_code} name={r.leader_name} imageUrl={r.leader_image_url} size={26} />
              </div>
              <p className="tabular mt-3 text-xs text-cream-500">
                Bilan {record(r)}, <span className="font-semibold text-cream-300">+{r.league_points} pts</span>
              </p>
            </div>
          ))}
        </section>
      )}

      {metagame.length > 0 && (
        <section className="surface-panel mt-8 p-6 sm:p-8">
          <SectionHeading
            title="Les leaders joués"
            action={withLeader < results.length ? <p className="text-xs text-cream-500">Leader connu pour {withLeader} joueurs sur {results.length}</p> : undefined}
          />
          <div className="mt-6">
            <MetagameDonut slices={metagame} />
          </div>
        </section>
      )}

      <section className="mt-12">
        <SectionHeading title="Classement final" />
        <div className="mt-5 overflow-x-auto">
          <table className="tabular w-full border-collapse text-sm">
            <thead>
              <tr className="table-head text-left">
                <th className="w-16 py-3 pr-3 font-semibold">Rang</th>
                <th className="py-3 pr-3 font-semibold">Joueur</th>
                <th className="hidden py-3 pr-3 font-semibold sm:table-cell">Leader</th>
                <th className="py-3 pr-3 text-right font-semibold">Bilan</th>
                <th className="hidden py-3 pr-3 text-right font-semibold md:table-cell">OMW %</th>
                <th className="hidden py-3 pr-3 text-right font-semibold md:table-cell">OOMW %</th>
                <th className="py-3 text-right font-semibold">Points</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.result_id} className="border-t hairline">
                  <td className={cn("display-number py-3 pr-3 text-xl", r.placement <= 8 ? "text-gold-400" : "text-cream-500")}>{r.placement}</td>
                  <td className="py-3 pr-3 font-medium text-cream-100">
                    <PlayerName row={r} size={28} />
                  </td>
                  <td className="hidden py-3 pr-3 text-cream-400 sm:table-cell">
                    <LeaderChip code={r.leader_code} name={r.leader_name} imageUrl={r.leader_image_url} />
                  </td>
                  <td className="py-3 pr-3 text-right text-cream-400">{record(r)}</td>
                  <td className="hidden py-3 pr-3 text-right text-cream-500 md:table-cell">{r.omw_pct != null ? Number(r.omw_pct).toFixed(1) : "—"}</td>
                  <td className="hidden py-3 pr-3 text-right text-cream-500 md:table-cell">{r.oomw_pct != null ? Number(r.oomw_pct).toFixed(1) : "—"}</td>
                  <td className="display-number py-3 text-right text-lg text-cream-100">+{r.league_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-cream-500">Source : export officiel Bandai TCG+. OMW et OOMW sont les tiebreakers du tournoi.</p>
      </section>
    </div>
  );
}
