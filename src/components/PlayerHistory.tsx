import Link from "next/link";
import type { PlayerDeckStatRow, PlayerHistoryRow } from "@/lib/db/types";
import { formatDateShort, placementLabel } from "@/lib/format";
import LeaderChip from "./LeaderChip";

export function HistoryList({ history, title = "TOURNOIS JOUÉS" }: { history: PlayerHistoryRow[]; title?: string }) {
  return (
    <section className="rounded-2xl border hairline bg-coal-800 p-5 sm:p-6">
      <h2 className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold mb-2">{title}</h2>
      {history.length === 0 ? (
        <p className="text-sm text-cream-400 py-2">Aucun tournoi joué pour le moment.</p>
      ) : (
        <ul className="divide-y hairline">
          {history.map((h) => (
            <li key={h.result_id} className="py-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className={`w-12 shrink-0 font-bold tabular ${h.placement <= 8 ? "text-gold-400" : "text-cream-600"}`}>
                {placementLabel(h.placement)}
              </span>
              <div className="flex-1 min-w-40">
                <Link href={`/resultats/${h.event_slug}`} className="font-medium text-cream-100 hover:text-gold-400">
                  {h.event_title}
                </Link>
                <p className="text-xs text-cream-600 flex items-center gap-1.5 flex-wrap">
                  {formatDateShort(h.starts_at)} · {h.wins ?? 0}-{h.losses ?? 0}
                  {(h.draws ?? 0) > 0 ? `-${h.draws}` : ""}
                  {h.leader_id && (
                    <>
                      {" · "}
                      <LeaderChip code={h.leader_code} name={h.leader_name} imageUrl={h.leader_image_url} size={20} />
                    </>
                  )}
                </p>
              </div>
              <span className="text-sm font-bold text-cream-100 tabular">+{h.league_points} pts</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function DeckStatsList({ stats, title = "LEADERS JOUÉS EN TOURNOI" }: { stats: PlayerDeckStatRow[]; title?: string }) {
  if (stats.length === 0) return null;
  return (
    <section className="rounded-2xl border hairline bg-coal-800 p-5 sm:p-6">
      <h2 className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold mb-2">{title}</h2>
      <ul className="divide-y hairline">
        {stats.map((d) => {
          const games = d.wins + d.losses + d.draws;
          const rate = games > 0 ? Math.round((d.wins / games) * 100) : 0;
          return (
            <li key={`${d.leader_id}-${d.season_id}`} className="py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex-1 min-w-40 font-medium text-cream-100">
                <LeaderChip code={d.leader_code} name={d.leader_name} imageUrl={d.leader_image_url} size={40} />
              </span>
              <span className="text-xs text-cream-600">
                {d.events_played} tournoi{d.events_played > 1 ? "s" : ""} · meilleur : {placementLabel(d.best_placement)} · {d.total_points} pts
              </span>
              <span className="w-24 text-right text-sm tabular">
                <b className="text-gold-400">{rate} %</b>
                <span className="text-cream-600">
                  {" "}
                  ({d.wins}-{d.losses})
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
