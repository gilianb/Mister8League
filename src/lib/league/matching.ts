// ------------------------------------------------------------------
// Rapprochement des lignes d'un CSV Bandai avec les joueurs connus et
// les inscrits du tournoi. Module pur, testé par tests/matching.test.ts.
//
// Priorité :
//   1. un joueur (players) porte ce numéro Bandai        → auto_player
//   2. un inscrit du tournoi porte ce numéro Bandai      → auto_registration
//   3. sinon                                              → unresolved (l'admin tranche)
// L'inscription appariée sert à préremplir le leader / deck déclaré.
// ------------------------------------------------------------------

import type { BandaiRow } from "./bandai-csv.ts";
import { normalizeBandaiId } from "./bandai-csv.ts";

export { normalizeBandaiId };

export type MatchPlayer = {
  id: string;
  bandaiMemberId: string | null;
  displayName: string;
  profileId: string | null;
};

export type MatchRegistration = {
  id: string;
  profileId: string | null;
  participantName: string;
  bandaiMemberId: string | null;
  leaderId: string | null;
  deckId: string | null;
};

export type AutoResolution = "auto_player" | "auto_registration" | "unresolved";

export type RowMatch = {
  rowIndex: number;
  resolution: AutoResolution;
  playerId: string | null;
  registrationId: string | null;
  leaderId: string | null;
  deckId: string | null;
};

export function matchRows(
  rows: BandaiRow[],
  players: MatchPlayer[],
  registrations: MatchRegistration[]
): { matches: RowMatch[]; noShows: MatchRegistration[] } {
  const playersByBandai = new Map<string, MatchPlayer>();
  for (const p of players) {
    const id = normalizeBandaiId(p.bandaiMemberId);
    if (id) playersByBandai.set(id, p);
  }

  const regsByBandai = new Map<string, MatchRegistration>();
  const regsByProfile = new Map<string, MatchRegistration>();
  for (const r of registrations) {
    const id = normalizeBandaiId(r.bandaiMemberId);
    if (id && !regsByBandai.has(id)) regsByBandai.set(id, r);
    if (r.profileId && !regsByProfile.has(r.profileId)) regsByProfile.set(r.profileId, r);
  }

  const usedRegistrations = new Set<string>();
  const matches: RowMatch[] = rows.map((row, rowIndex) => {
    const bandai = normalizeBandaiId(row.bandaiMemberId);
    const player = bandai ? playersByBandai.get(bandai) : undefined;

    let registration = bandai ? regsByBandai.get(bandai) : undefined;
    if (!registration && player?.profileId) registration = regsByProfile.get(player.profileId);
    if (registration && usedRegistrations.has(registration.id)) registration = undefined;
    if (registration) usedRegistrations.add(registration.id);

    if (player) {
      return {
        rowIndex,
        resolution: "auto_player",
        playerId: player.id,
        registrationId: registration?.id ?? null,
        leaderId: registration?.leaderId ?? null,
        deckId: registration?.deckId ?? null,
      };
    }
    if (registration) {
      return {
        rowIndex,
        resolution: "auto_registration",
        playerId: null,
        registrationId: registration.id,
        leaderId: registration.leaderId,
        deckId: registration.deckId,
      };
    }
    return { rowIndex, resolution: "unresolved", playerId: null, registrationId: null, leaderId: null, deckId: null };
  });

  const noShows = registrations.filter((r) => !usedRegistrations.has(r.id));
  return { matches, noShows };
}
