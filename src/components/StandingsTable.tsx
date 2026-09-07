import Link from "next/link";
import type { StandingRow } from "@/lib/db/types";
import { placementLabel } from "@/lib/format";
import { Avatar } from "./ui/Avatar";
import { cn } from "@/lib/cn";

type Props = {
  rows: StandingRow[];
  qualifiedCount?: number;
  /** identifiant du joueur connecté, pour le surligner */
  highlightPlayerId?: string | null;
  compact?: boolean;
};

export function PlayerName({ row, size = 32 }: { row: Pick<StandingRow, "display_name" | "pseudo" | "avatar_url" | "is_public">; size?: number }) {
  const inner = (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <Avatar src={row.avatar_url} name={row.display_name} size={size} />
      <span className="truncate">{row.display_name}</span>
    </span>
  );
  if (row.is_public && row.pseudo) {
    return (
      <Link href={`/joueurs/${encodeURIComponent(row.pseudo)}`} className="transition-colors hover:text-gold-300">
        {inner}
      </Link>
    );
  }
  return inner;
}

/** Tableau de championnat : rang en Fraunces, points en or, coupe de qualification nommée. */
export default function StandingsTable({ rows, qualifiedCount, highlightPlayerId, compact = false }: Props) {
  const hasCut = qualifiedCount !== undefined && qualifiedCount > 0;
  const columns = compact ? 3 : 6;
  return (
    <div className="overflow-x-auto">
      <table className="tabular w-full border-collapse text-sm">
        <thead>
          <tr className="table-head text-left">
            <th className="w-16 py-3 pr-3 font-semibold">Rang</th>
            <th className="py-3 pr-3 font-semibold">Joueur</th>
            {!compact && <th className="hidden py-3 pr-3 text-right font-semibold sm:table-cell">Tournois</th>}
            {!compact && <th className="hidden py-3 pr-3 text-right font-semibold md:table-cell">Bilan</th>}
            {!compact && <th className="hidden py-3 pr-3 text-right font-semibold sm:table-cell">Meilleur</th>}
            <th className="py-3 text-right font-semibold">Points</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const highlighted = !!highlightPlayerId && r.player_id === highlightPlayerId;
            const qualified = hasCut && r.rank <= qualifiedCount;
            const isCut = hasCut && r.rank === qualifiedCount && rows.length > qualifiedCount;
            return [
              <tr key={r.player_id} className={cn("border-t hairline", highlighted && "bg-gold-400/8")}>
                <td className={cn("display-number py-3 pr-3 text-2xl", qualified ? "text-gold-400" : "text-cream-500")}>{r.rank}</td>
                <td className="py-3 pr-3 font-medium text-cream-100">
                  <span className="inline-flex items-center gap-3">
                    <PlayerName row={r} />
                    {highlighted && <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold text-coal-950">vous</span>}
                  </span>
                </td>
                {!compact && <td className="hidden py-3 pr-3 text-right text-cream-400 sm:table-cell">{r.events_played}</td>}
                {!compact && (
                  <td className="hidden py-3 pr-3 text-right text-cream-400 md:table-cell">
                    {r.wins}-{r.losses}
                    {r.draws > 0 ? `-${r.draws}` : ""}
                  </td>
                )}
                {!compact && <td className="hidden py-3 pr-3 text-right text-cream-400 sm:table-cell">{placementLabel(r.best_placement)}</td>}
                <td className="display-number py-3 text-right text-xl text-cream-100">{r.total_points}</td>
              </tr>,
              isCut ? (
                <tr key={`${r.player_id}-cut`} aria-hidden="true">
                  <td colSpan={columns} className="py-1">
                    <div className="flex items-center gap-3">
                      <span className="h-0.5 flex-1 bg-brand" />
                      <span className="text-[11px] font-semibold text-brand">Coupe de qualification, top {qualifiedCount}</span>
                      <span className="h-0.5 w-10 bg-brand" />
                    </div>
                  </td>
                </tr>
              ) : null,
            ];
          })}
        </tbody>
      </table>
      {hasCut && rows.length > 0 && rows.length <= qualifiedCount && (
        <p className="mt-4 border-t hairline pt-3 text-xs text-cream-500">
          Les {qualifiedCount} premiers sont qualifiés pour la finale de saison. Tous les joueurs classés le sont pour l&apos;instant.
        </p>
      )}
    </div>
  );
}
