import type { StandingRow } from "@/lib/types";

type Props = {
  rows: StandingRow[];
  qualifiedCount?: number;
  /** rang à surligner (ex. le joueur connecté) */
  highlightRank?: number;
  compact?: boolean;
};

export default function StandingsTable({
  rows,
  qualifiedCount,
  highlightRank,
  compact = false,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm tabular border-collapse">
        <thead>
          <tr className="text-[10px] tracking-[0.16em] text-cream-600 text-left">
            <th className="py-2 pr-2 font-semibold w-10">#</th>
            <th className="py-2 pr-3 font-semibold">JOUEUR</th>
            {!compact && (
              <th className="py-2 pr-3 font-semibold text-right hidden sm:table-cell">
                TOURNOIS
              </th>
            )}
            {!compact && (
              <th className="py-2 pr-3 font-semibold text-right hidden md:table-cell">
                BILAN
              </th>
            )}
            {!compact && (
              <th className="py-2 pr-3 font-semibold text-right hidden sm:table-cell">
                MEILLEUR
              </th>
            )}
            <th className="py-2 font-semibold text-right">POINTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isCut = qualifiedCount !== undefined && r.rank === qualifiedCount;
            const highlighted = r.rank === highlightRank;
            return (
              <tr
                key={r.playerId}
                className={`border-t hairline ${
                  isCut ? "border-b-2 !border-b-brand" : ""
                } ${highlighted ? "bg-gold-400/10" : ""}`}
              >
                <td
                  className={`py-2.5 pr-2 font-bold ${
                    qualifiedCount !== undefined && r.rank <= qualifiedCount
                      ? "text-gold-400"
                      : "text-cream-600"
                  }`}
                >
                  {r.rank}
                </td>
                <td className="py-2.5 pr-3 font-medium text-cream-100">
                  {r.displayName}
                  {highlighted && (
                    <span className="ml-2 text-[10px] font-bold text-gold-400 tracking-wider">
                      VOUS
                    </span>
                  )}
                </td>
                {!compact && (
                  <td className="py-2.5 pr-3 text-right text-cream-400 hidden sm:table-cell">
                    {r.eventsPlayed}
                  </td>
                )}
                {!compact && (
                  <td className="py-2.5 pr-3 text-right text-cream-400 hidden md:table-cell">
                    {r.wins}-{r.losses}
                  </td>
                )}
                {!compact && (
                  <td className="py-2.5 pr-3 text-right text-cream-400 hidden sm:table-cell">
                    {r.bestPlacement === 1 ? "1er" : `${r.bestPlacement}e`}
                  </td>
                )}
                <td className="py-2.5 text-right font-bold text-cream-100">
                  {r.totalPoints}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {qualifiedCount !== undefined && rows.length >= qualifiedCount && (
        <p className="mt-2 flex items-center gap-2 text-xs text-cream-600">
          <span className="inline-block w-6 border-t-2 border-brand" />
          Ligne de qualification — top {qualifiedCount} qualifié pour la finale de saison
        </p>
      )}
    </div>
  );
}
