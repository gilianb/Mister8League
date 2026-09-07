import Link from "next/link";
import type { PlayerDeckStatRow, PlayerHistoryRow } from "@/lib/db/types";
import { formatDateShort, placementLabel } from "@/lib/format";
import LeaderChip from "./LeaderChip";
import { cn } from "@/lib/cn";

export function HistoryList({ history, title = "Tournois joués" }: { history: PlayerHistoryRow[]; title?: string }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-medium tracking-[-0.015em] text-cream-100">{title}</h2>
      {history.length === 0 ? (
        <p className="mt-4 border-t hairline pt-5 text-sm text-cream-400">Aucun tournoi joué pour le moment.</p>
      ) : (
        <ul className="mt-4 divide-y divide-hairline border-y hairline">
          {history.map((h) => (
            <li key={h.result_id} className="flex flex-wrap items-center gap-x-5 gap-y-2 py-4">
              <span className={cn("display-number w-14 shrink-0 text-2xl", h.placement <= 8 ? "text-gold-400" : "text-cream-500")}>{placementLabel(h.placement)}</span>
              <div className="min-w-40 flex-1">
                <Link href={`/resultats/${h.event_slug}`} className="font-medium text-cream-100 transition-colors hover:text-gold-300">
                  {h.event_title}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-cream-500">
                  <span>{formatDateShort(h.starts_at)}</span>
                  <span className="tabular">
                    Bilan {h.wins ?? 0}-{h.losses ?? 0}
                    {(h.draws ?? 0) > 0 ? `-${h.draws}` : ""}
                  </span>
                  {h.leader_id && <LeaderChip code={h.leader_code} name={h.leader_name} imageUrl={h.leader_image_url} size={20} />}
                </p>
              </div>
              <span className="display-number text-xl text-cream-100">
                +{h.league_points}
                <span className="ml-1 font-sans text-xs font-medium text-cream-500">pts</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function DeckStatsList({ stats, title = "Leaders joués en tournoi" }: { stats: PlayerDeckStatRow[]; title?: string }) {
  if (stats.length === 0) return null;
  return (
    <section>
      <h2 className="font-display text-2xl font-medium tracking-[-0.015em] text-cream-100">{title}</h2>
      <ul className="mt-4 divide-y divide-hairline border-y hairline">
        {stats.map((d) => {
          const games = d.wins + d.losses + d.draws;
          const rate = games > 0 ? Math.round((d.wins / games) * 100) : 0;
          return (
            <li key={`${d.leader_id}-${d.season_id}`} className="flex flex-wrap items-center gap-x-5 gap-y-2 py-4">
              <span className="min-w-40 flex-1 font-medium text-cream-100">
                <LeaderChip code={d.leader_code} name={d.leader_name} imageUrl={d.leader_image_url} size={44} />
              </span>
              <span className="text-xs text-cream-500">
                {d.events_played} tournoi{d.events_played > 1 ? "s" : ""}, meilleur résultat {placementLabel(d.best_placement)}, {d.total_points} pts
              </span>
              <span className="tabular w-28 text-right text-sm">
                <span className="display-number text-xl text-gold-400">{rate} %</span>
                <span className="ml-1.5 text-xs text-cream-500">
                  {d.wins}-{d.losses}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
