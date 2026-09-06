// Barème de points de ligue. Miroir de la fonction SQL compute_league_points.

export type PointRule = {
  label: string;
  placementMin: number;
  placementMax: number | null; // null = jusqu'au dernier
  points: number;
};

/** La règle la plus spécifique (tranche la plus étroite) l'emporte. */
export function computeLeaguePoints(placement: number, rules: PointRule[]): number {
  const matching = rules
    .filter(
      (r) =>
        placement >= r.placementMin &&
        (r.placementMax == null || placement <= r.placementMax)
    )
    .sort(
      (a, b) =>
        (a.placementMax ?? Number.MAX_SAFE_INTEGER) -
        a.placementMin -
        ((b.placementMax ?? Number.MAX_SAFE_INTEGER) - b.placementMin)
    );
  return matching[0]?.points ?? 0;
}

/** Libellé lisible d'une tranche (« 1er », « Top 8 », « 33e à 64e »). */
export function describeRule(r: PointRule): string {
  if (r.placementMax === r.placementMin) return r.placementMin === 1 ? "1er" : `${r.placementMin}e`;
  if (r.placementMax == null) return `À partir du ${r.placementMin}e`;
  return `${r.placementMin}e à ${r.placementMax}e`;
}
