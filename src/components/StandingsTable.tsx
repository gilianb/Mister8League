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

export function PlayerName({ row, size = 28 }: { row: Pick<StandingRow, "display_name" | "pseudo" | "avatar_url" | "is_public">; size?: number }) {
  const inner = (
    <span className="inline-flex items-center gap-2.5 min-w-0">
      <Avatar src={row.avatar_url} name={row.display_name} size={size} />
      <span className="truncate">{row.display_name}</span>
    </span>
  );
  if (row.is_public && row.pseudo) {
    return (
      <Link href={`/joueurs/${encodeURIComponent(row.pseudo)}`} className="hover:text-gold-400 transition-colors">
        {inner}
      </Link>
    );
  }
  return inner;
}

export default function StandingsTable({ rows, qualifiedCount, highlightPlayerId, compact = false }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm tabular border-collapse">
        <thead>
          <tr className="text-[10px] tracking-[0.16em] text-cream-600 text-left">
            <th className="py-2 pr-2 font-semibold w-10">#</th>
            <th className="py-2 pr-3 font-semibold">JOUEUR</th>
            {!compact && <th className="py-2 pr-3 font-semibold text-right hidden sm:table-cell">TOURNOIS</th>}
            {!compact && <th className="py-2 pr-3 font-semibold text-right hidden md:table-cell">BILAN</th>}
            {!compact && <th className="py-2 pr-3 font-semibold text-right hidden sm:table-cell">MEILLEUR</th>}
            <th className="py-2 font-semibold text-right">POINTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isCut = qualifiedCount !== undefined && qualifiedCount > 0 && r.rank === qualifiedCount;
            const highlighted = !!highlightPlayerId && r.player_id === highlightPlayerId;
            const qualified = qualifiedCount !== undefined && qualifiedCount > 0 && r.rank <= qualifiedCount;
            return (
              <tr
                key={r.player_id}
                className={cn("border-t hairline", isCut && "border-b-2 !border-b-brand", highlighted && "bg-gold-400/10")}
              >
                <td className={cn("py-2.5 pr-2 font-bold", qualified ? "text-gold-400" : "text-cream-600")}>{r.rank}</td>
                <td className="py-2.5 pr-3 font-medium text-cream-100">
                  <PlayerName row={r} />
                  {highlighted && <span className="ml-2 text-[10px] font-bold text-gold-400 tracking-wider">VOUS</span>}
                </td>
                {!compact && <td className="py-2.5 pr-3 text-right text-cream-400 hidden sm:table-cell">{r.events_played}</td>}
                {!compact && (
                  <td className="py-2.5 pr-3 text-right text-cream-400 hidden md:table-cell">
                    {r.wins}-{r.losses}
                    {r.draws > 0 ? `-${r.draws}` : ""}
                  </td>
                )}
                {!compact && (
                  <td className="py-2.5 pr-3 text-right text-cream-400 hidden sm:table-cell">{placementLabel(r.best_placement)}</td>
                )}
                <td className="py-2.5 text-right font-bold text-cream-100">{r.total_points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {qualifiedCount !== undefined && qualifiedCount > 0 && rows.length >= qualifiedCount && (
        <p className="mt-2 flex items-center gap-2 text-xs text-cream-600">
          <span className="inline-block w-6 border-t-2 border-brand" />
          Ligne de qualification : top {qualifiedCount} qualifié pour la finale de saison
        </p>
      )}
    </div>
  );
}
