import type { PlayerHistoryRow, StandingRow } from "@/lib/db/types";
import { placementLabel } from "@/lib/format";
import { StatTile } from "./ui/StatTile";

export function QualificationBar({
  standing,
  qualifiedCount,
  cutPoints,
}: {
  standing: StandingRow | null;
  qualifiedCount: number;
  cutPoints: number;
}) {
  if (!standing) {
    return (
      <section className="rounded-2xl border hairline bg-coal-800 p-5 sm:p-6">
        <h2 className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold mb-2">QUALIFICATION FINALE</h2>
        <p className="text-sm text-cream-400">
          Aucun résultat cette saison pour l&apos;instant. Jouez un tournoi de la ligue pour entrer au classement.
        </p>
      </section>
    );
  }
  const qualified = qualifiedCount > 0 && standing.rank <= qualifiedCount;
  const gap = Math.max(0, cutPoints - standing.total_points);
  const scale = Math.max(cutPoints * 1.25, standing.total_points, 1);
  const fillPct = Math.round((standing.total_points / scale) * 100);
  const cutPct = Math.round((cutPoints / scale) * 100);

  return (
    <section className="rounded-2xl border hairline bg-coal-800 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h2 className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold">QUALIFICATION FINALE</h2>
        <p className={`text-sm font-bold tracking-wide ${qualified ? "text-gold-400" : "text-cream-100"}`}>
          {placementLabel(standing.rank)} au classement ·{" "}
          {qualified ? "qualifié provisoirement" : gap > 0 ? `à ${gap} pt${gap > 1 ? "s" : ""} du top ${qualifiedCount}` : `à égalité avec le top ${qualifiedCount}`}
        </p>
      </div>
      <div className="relative h-2 rounded-full bg-coal-950">
        <span className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold-600 to-gold-400" style={{ width: `${fillPct}%` }} />
        {qualifiedCount > 0 && (
          <span className="absolute -top-1 -bottom-1 w-0.5 rounded bg-brand" style={{ left: `${cutPct}%` }} title={`Coupe top ${qualifiedCount}`} />
        )}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-cream-600 tabular">
        <span>{standing.total_points} pts</span>
        {qualifiedCount > 0 && (
          <span className="text-brand font-semibold">
            coupe top {qualifiedCount} : {cutPoints} pts
          </span>
        )}
      </div>
    </section>
  );
}

export function StatTiles({ standing }: { standing: StandingRow | null }) {
  const wins = standing?.wins ?? 0;
  const losses = standing?.losses ?? 0;
  const draws = standing?.draws ?? 0;
  const games = wins + losses + draws;
  const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;
  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatTile value={standing?.total_points ?? 0} label="Points ligue" />
      <StatTile value={games > 0 ? `${winRate} %` : "—"} label={`Win rate${games > 0 ? ` (${wins}-${losses}${draws ? `-${draws}` : ""})` : ""}`} />
      <StatTile value={standing?.events_played ?? 0} label="Tournois joués" />
      <StatTile value={standing ? placementLabel(standing.best_placement) : "—"} label="Meilleur résultat" />
    </section>
  );
}

/** Barres « points par tournoi », du plus ancien au plus récent. */
export function PointsBars({ history }: { history: PlayerHistoryRow[] }) {
  if (history.length === 0) return null;
  const ordered = [...history].sort((a, b) => a.starts_at.localeCompare(b.starts_at)).slice(-10);
  const max = Math.max(...ordered.map((h) => h.league_points), 1);
  return (
    <section className="rounded-2xl border hairline bg-coal-800 p-5 sm:p-6">
      <h2 className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold mb-4">POINTS PAR TOURNOI</h2>
      <div className="flex items-end gap-3 h-28">
        {ordered.map((h) => (
          <div key={h.result_id} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <span className="text-xs text-cream-400 tabular">+{h.league_points}</span>
            <span
              className={`w-full rounded-t ${h.league_points === max ? "bg-gold-400" : "bg-coal-700"}`}
              style={{ height: `${Math.max(8, (h.league_points / max) * 80)}px` }}
            />
            <span className="text-[9px] text-cream-600 truncate max-w-full" title={h.event_title}>
              {h.event_title.replace(/^Tournoi (One Piece)?\s*/i, "")}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
