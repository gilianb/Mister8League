import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { PlayerRow, ResultImportLineRow, ResultImportRow, RowResolution } from "@/lib/db/types";
import { parseBandaiCsv, inferRounds, normalizeBandaiId, type BandaiRow } from "./bandai-csv";
import { matchRows, type MatchPlayer, type MatchRegistration } from "./matching";

// ------------------------------------------------------------------
// Import des résultats Bandai : staging (result_imports + rows),
// résolution par l'admin, puis publication dans `results`.
// ------------------------------------------------------------------

type RegistrationForMatch = {
  id: string;
  profile_id: string | null;
  participant_name: string;
  leader_id: string | null;
  deck_id: string | null;
  status: string;
  profile: { pseudo: string | null; bandai_member_id: string | null } | null;
};

async function loadEventRegistrations(eventId: string): Promise<RegistrationForMatch[]> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("registrations")
    .select("id, profile_id, participant_name, leader_id, deck_id, status, profile:profiles(pseudo, bandai_member_id)")
    .eq("event_id", eventId)
    .in("status", ["paid", "checked_in"])
    .returns<RegistrationForMatch[]>();
  return data ?? [];
}

export async function createImport(opts: {
  eventId: string;
  fileName: string;
  csvText: string;
  rounds: number | null;
  createdBy: string;
}): Promise<{ importId: string; rowCount: number; unresolved: number; rounds: number }> {
  const parsedRows: BandaiRow[] = parseBandaiCsv(opts.csvText, opts.rounds ?? undefined);
  const rounds = opts.rounds && opts.rounds > 0 ? opts.rounds : inferRounds(parsedRows);
  const admin = createAdminSupabase();

  // Un seul import en attente par tournoi : les précédents sont abandonnés.
  await admin.from("result_imports").update({ status: "discarded" }).eq("event_id", opts.eventId).eq("status", "pending");

  const bandaiIds = parsedRows.map((r) => r.bandaiMemberId).filter(Boolean);
  const [{ data: playerRows }, registrations] = await Promise.all([
    bandaiIds.length
      ? admin.from("players").select("id, display_name, bandai_member_id, profile_id").in("bandai_member_id", bandaiIds).is("merged_into", null).returns<Pick<PlayerRow, "id" | "display_name" | "bandai_member_id" | "profile_id">[]>()
      : Promise.resolve({ data: [] as Pick<PlayerRow, "id" | "display_name" | "bandai_member_id" | "profile_id">[] }),
    loadEventRegistrations(opts.eventId),
  ]);

  const players: MatchPlayer[] = (playerRows ?? []).map((p) => ({ id: p.id, bandaiMemberId: p.bandai_member_id, displayName: p.display_name, profileId: p.profile_id }));
  const regs: MatchRegistration[] = registrations.map((r) => ({
    id: r.id,
    profileId: r.profile_id,
    participantName: r.participant_name,
    bandaiMemberId: r.profile?.bandai_member_id ?? null,
    leaderId: r.leader_id,
    deckId: r.deck_id,
  }));
  const { matches } = matchRows(parsedRows, players, regs);

  const { data: imp, error } = await admin
    .from("result_imports")
    .insert({ event_id: opts.eventId, file_name: opts.fileName, raw_csv: opts.csvText, rounds, status: "pending", created_by: opts.createdBy })
    .select("id")
    .single<{ id: string }>();
  if (error || !imp) throw new Error(error?.message ?? "Création de l'import impossible");

  const lines = parsedRows.map((r, i) => {
    const m = matches[i];
    return {
      import_id: imp.id,
      row_index: i,
      placement: r.placement,
      bandai_member_id: r.bandaiMemberId || null,
      player_name: r.playerName,
      match_points: r.matchPoints,
      wins: r.wins,
      draws: r.draws,
      losses: r.losses,
      omw_pct: r.omwPct ?? null,
      oomw_pct: r.oomwPct ?? null,
      memo: r.memo ?? null,
      deck_urls: r.deckUrls ?? null,
      resolution: m.resolution,
      player_id: m.playerId,
      registration_id: m.registrationId,
      leader_id: m.leaderId,
      deck_id: m.deckId,
    };
  });
  const { error: rowsErr } = await admin.from("result_import_rows").insert(lines);
  if (rowsErr) {
    await admin.from("result_imports").delete().eq("id", imp.id);
    throw new Error(rowsErr.message);
  }

  return { importId: imp.id, rowCount: lines.length, unresolved: matches.filter((m) => m.resolution === "unresolved").length, rounds };
}

export type ImportRowView = ResultImportLineRow & {
  player: { id: string; display_name: string; bandai_member_id: string | null; profile: { pseudo: string | null } | null } | null;
  registration: { id: string; participant_name: string; profile: { pseudo: string | null; bandai_member_id: string | null } | null } | null;
  leader: { id: string; name: string; code: string | null; image_url: string | null } | null;
};

export type NoShowView = {
  id: string;
  participant_name: string;
  profile_id: string | null;
  pseudo: string | null;
  bandai_member_id: string | null;
  leader_id: string | null;
  deck_id: string | null;
};

export async function getPendingImport(eventId: string): Promise<{ imp: ResultImportRow; rows: ImportRowView[]; noShows: NoShowView[] } | null> {
  const admin = createAdminSupabase();
  const { data: imp } = await admin.from("result_imports").select("*").eq("event_id", eventId).eq("status", "pending").maybeSingle<ResultImportRow>();
  if (!imp) return null;
  const [{ data: rows }, registrations] = await Promise.all([
    admin
      .from("result_import_rows")
      .select("*, player:players(id, display_name, bandai_member_id, profile:profiles(pseudo)), registration:registrations(id, participant_name, profile:profiles(pseudo, bandai_member_id)), leader:leaders(id, name, code, image_url)")
      .eq("import_id", imp.id)
      .order("placement", { ascending: true })
      .returns<ImportRowView[]>(),
    loadEventRegistrations(eventId),
  ]);
  const used = new Set((rows ?? []).map((r) => r.registration_id).filter(Boolean));
  const noShows: NoShowView[] = registrations
    .filter((r) => !used.has(r.id))
    .map((r) => ({
      id: r.id,
      participant_name: r.participant_name,
      profile_id: r.profile_id,
      pseudo: r.profile?.pseudo ?? null,
      bandai_member_id: r.profile?.bandai_member_id ?? null,
      leader_id: r.leader_id,
      deck_id: r.deck_id,
    }));
  return { imp, rows: rows ?? [], noShows };
}

export type RowResolutionInput =
  | { kind: "registration"; registrationId: string }
  | { kind: "player"; playerId: string }
  | { kind: "new_player" }
  | { kind: "skip" }
  | { kind: "unresolved" };

export async function resolveRow(rowId: string, input: RowResolutionInput): Promise<void> {
  const admin = createAdminSupabase();
  const patch: Partial<ResultImportLineRow> & { resolution: RowResolution } = {
    resolution: input.kind,
    player_id: null,
    registration_id: null,
  };
  if (input.kind === "registration") {
    const { data: reg } = await admin.from("registrations").select("id, profile_id, leader_id, deck_id").eq("id", input.registrationId).maybeSingle<{ id: string; profile_id: string | null; leader_id: string | null; deck_id: string | null }>();
    if (!reg) throw new Error("Inscription introuvable");
    patch.registration_id = reg.id;
    if (reg.profile_id) {
      const { data: p } = await admin.from("players").select("id").eq("profile_id", reg.profile_id).is("merged_into", null).maybeSingle<{ id: string }>();
      patch.player_id = p?.id ?? null;
    }
    const { data: row } = await admin.from("result_import_rows").select("leader_id, deck_id").eq("id", rowId).maybeSingle<{ leader_id: string | null; deck_id: string | null }>();
    if (row && !row.leader_id && reg.leader_id) patch.leader_id = reg.leader_id;
    if (row && !row.deck_id && reg.deck_id) patch.deck_id = reg.deck_id;
  } else if (input.kind === "player") {
    patch.player_id = input.playerId;
  }
  const { error } = await admin.from("result_import_rows").update(patch).eq("id", rowId);
  if (error) throw new Error(error.message);
}

export async function setRowLeader(rowId: string, leaderId: string | null): Promise<void> {
  const admin = createAdminSupabase();
  const { error } = await admin.from("result_import_rows").update({ leader_id: leaderId }).eq("id", rowId);
  if (error) throw new Error(error.message);
}

export async function discardImport(importId: string): Promise<void> {
  const admin = createAdminSupabase();
  await admin.from("result_imports").update({ status: "discarded" }).eq("id", importId).eq("status", "pending");
}

/** Trouve ou crée l'identité ligue d'une ligne d'import. */
async function ensurePlayerForRow(row: ImportRowView): Promise<string | null> {
  const admin = createAdminSupabase();
  if (row.player_id) return row.player_id;
  const bandai = normalizeBandaiId(row.bandai_member_id) || null;

  if (row.registration_id && row.registration) {
    const { data: reg } = await admin.from("registrations").select("profile_id").eq("id", row.registration_id).maybeSingle<{ profile_id: string | null }>();
    const profileId = reg?.profile_id ?? null;
    if (profileId) {
      // Complète le numéro Bandai du profil s'il manque (le trigger crée / lie le joueur).
      const { data: profile } = await admin.from("profiles").select("id, pseudo, full_name, bandai_member_id").eq("id", profileId).maybeSingle<{ id: string; pseudo: string | null; full_name: string | null; bandai_member_id: string | null }>();
      if (profile && !profile.bandai_member_id && bandai) {
        const { data: taken } = await admin.from("profiles").select("id").eq("bandai_member_id", bandai).neq("id", profileId).limit(1);
        if (!taken || taken.length === 0) await admin.from("profiles").update({ bandai_member_id: bandai }).eq("id", profileId);
      }
      const { data: p } = await admin.from("players").select("id").eq("profile_id", profileId).is("merged_into", null).maybeSingle<{ id: string }>();
      if (p) return p.id;
      const { data: created } = await admin
        .from("players")
        .insert({ display_name: profile?.pseudo ?? profile?.full_name ?? row.player_name, bandai_member_id: null, profile_id: profileId })
        .select("id")
        .single<{ id: string }>();
      return created?.id ?? null;
    }
  }

  if (bandai) {
    const { data: existing } = await admin.from("players").select("id").eq("bandai_member_id", bandai).is("merged_into", null).maybeSingle<{ id: string }>();
    if (existing) return existing.id;
  }
  const { data: created } = await admin
    .from("players")
    .insert({ display_name: row.player_name, bandai_member_id: bandai })
    .select("id")
    .single<{ id: string }>();
  return created?.id ?? null;
}

/** Publie l'import : remplace les résultats du tournoi, calcule les points, passe le tournoi en « terminé ». */
export async function applyImport(importId: string): Promise<{ inserted: number; skipped: number }> {
  const admin = createAdminSupabase();
  const { data: imp } = await admin.from("result_imports").select("*").eq("id", importId).maybeSingle<ResultImportRow>();
  if (!imp || imp.status !== "pending") throw new Error("Import introuvable ou déjà traité");
  const pending = await getPendingImport(imp.event_id);
  if (!pending) throw new Error("Import introuvable");

  const seen = new Set<string>();
  const results: Array<Record<string, unknown>> = [];
  let skipped = 0;
  for (const row of pending.rows) {
    if (row.resolution === "skip") {
      skipped += 1;
      continue;
    }
    const playerId = await ensurePlayerForRow(row);
    if (!playerId || seen.has(playerId)) {
      skipped += 1;
      continue;
    }
    seen.add(playerId);
    await admin.from("result_import_rows").update({ player_id: playerId, resolution: row.resolution === "unresolved" ? "new_player" : row.resolution }).eq("id", row.id);
    results.push({
      event_id: imp.event_id,
      player_id: playerId,
      placement: row.placement,
      match_points: row.match_points,
      wins: row.wins,
      losses: row.losses,
      draws: row.draws,
      omw_pct: row.omw_pct,
      oomw_pct: row.oomw_pct,
      leader_id: row.leader_id,
      deck_id: row.deck_id,
      import_id: imp.id,
    });
  }

  await admin.from("results").delete().eq("event_id", imp.event_id);
  if (results.length > 0) {
    const { error } = await admin.from("results").insert(results);
    if (error) throw new Error(error.message);
  }
  await admin.rpc("apply_league_points", { p_event: imp.event_id });
  await admin.from("events").update({ status: "completed", rounds: imp.rounds }).eq("id", imp.event_id);
  await admin.from("result_imports").update({ status: "applied", applied_at: new Date().toISOString() }).eq("id", imp.id);
  return { inserted: results.length, skipped };
}

/** Retire les résultats publiés (le tournoi repasse en « publié »). */
export async function unpublishResults(eventId: string): Promise<void> {
  const admin = createAdminSupabase();
  await admin.from("results").delete().eq("event_id", eventId);
  await admin.from("events").update({ status: "published" }).eq("id", eventId).eq("status", "completed");
}
