import type { PlayerHistoryRow, StandingRow } from "@/lib/db/types";
import { placementLabel } from "@/lib/format";
import { StatTile } from "./ui/StatTile";
import { cn } from "@/lib/cn";

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
      <section className="surface-panel p-6">
        <h2 className="font-display text-xl font-semibold tracking-tight text-cream-100">Qualification pour la finale</h2>
        <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-cream-400">
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
    <section className="surface-panel p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="font-display text-xl font-semibold tracking-tight text-cream-100">Qualification pour la finale</h2>
        <p className={cn("text-sm font-semibold", qualified ? "text-gold-400" : "text-cream-200")}>
          {placementLabel(standing.rank)} au classement,{" "}
          {qualified ? "qualifié pour l'instant" : gap > 0 ? `à ${gap} pt${gap > 1 ? "s" : ""} du top ${qualifiedCount}` : `à égalité avec le top ${qualifiedCount}`}
        </p>
      </div>
      <div className="relative mt-5 h-2 rounded-full bg-coal-950">
        <span className="absolute inset-y-0 left-0 rounded-full bg-gold-400" style={{ width: `${fillPct}%` }} />
        {qualifiedCount > 0 && (
          <span className="absolute -top-1.5 -bottom-1.5 w-0.5 rounded bg-brand" style={{ left: `${cutPct}%` }} title={`Coupe top ${qualifiedCount}`} />
        )}
      </div>
      <div className="tabular mt-3 flex justify-between text-xs text-cream-500">
        <span>
          <span className="font-semibold text-cream-200">{standing.total_points}</span> pts
        </span>
        {qualifiedCount > 0 && (
          <span>
            Coupe du top {qualifiedCount} : <span className="font-semibold text-brand">{cutPoints} pts</span>
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
    <section className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
      <StatTile value={standing?.total_points ?? 0} label="Points de ligue" />
      <StatTile value={games > 0 ? `${winRate} %` : "—"} label="Taux de victoire" sub={games > 0 ? `${wins} victoires, ${losses} défaites${draws ? `, ${draws} nuls` : ""}` : undefined} accent="cream" />
      <StatTile value={standing?.events_played ?? 0} label="Tournois joués" accent="cream" />
      <StatTile value={standing ? placementLabel(standing.best_placement) : "—"} label="Meilleur résultat" accent="cream" />
    </section>
  );
}

/** Barres « points par tournoi », du plus ancien au plus récent. */
export function PointsBars({ history }: { history: PlayerHistoryRow[] }) {
  if (history.length === 0) return null;
  const ordered = [...history].sort((a, b) => a.starts_at.localeCompare(b.starts_at)).slice(-10);
  const max = Math.max(...ordered.map((h) => h.league_points), 1);
  return (
    <section className="surface-panel p-6">
      <h2 className="font-display text-xl font-semibold tracking-tight text-cream-100">Points par tournoi</h2>
      <div className="mt-6 flex h-32 items-end gap-3">
        {ordered.map((h) => (
          <div key={h.result_id} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="tabular text-xs text-cream-400">+{h.league_points}</span>
            <span
              className={cn("w-full rounded-t-sm", h.league_points === max ? "bg-gold-400" : "bg-coal-600")}
              style={{ height: `${Math.max(8, (h.league_points / max) * 80)}px` }}
            />
            <span className="max-w-full truncate text-[10px] text-cream-600" title={h.event_title}>
              {h.event_title.replace(/^Tournoi (One Piece)?\s*/i, "")}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
