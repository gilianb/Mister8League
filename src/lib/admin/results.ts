"use server";

import { createAdminSupabase } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/auth/actions";
import { BandaiCsvError } from "@/lib/league/bandai-csv";
import { applyImport, createImport, discardImport, resolveRow, setRowLeader, unpublishResults, type RowResolutionInput } from "@/lib/league/import";
import { adminUserId, formStr, logAdminEvent } from "./guard";

export async function uploadResultsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };
  const eventId = formStr(formData, "event_id");
  const file = formData.get("csv");
  const roundsRaw = formStr(formData, "rounds");
  const rounds = roundsRaw ? Math.max(1, Math.floor(Number(roundsRaw))) : null;
  if (!(file instanceof File) || file.size === 0) return { error: "Choisissez le fichier CSV exporté depuis Bandai TCG+." };
  if (file.size > 2 * 1024 * 1024) return { error: "Fichier trop volumineux." };

  let text = "";
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    text = bytes.toString("utf8");
    // Export en Latin-1 (accents cassés) : on retente.
    if (text.includes("�")) text = bytes.toString("latin1");
  } catch {
    return { error: "Lecture du fichier impossible." };
  }

  try {
    const res = await createImport({ eventId, fileName: file.name, csvText: text, rounds, createdBy: adminId });
    await logAdminEvent({ adminId, action: "results_import_create", eventId, payload: { importId: res.importId, rows: res.rowCount, unresolved: res.unresolved } });
    return {
      ok: true,
      message: `${res.rowCount} lignes lues (${res.rounds} rondes). ${res.unresolved === 0 ? "Tous les joueurs ont été reconnus." : `${res.unresolved} ligne(s) à résoudre.`}`,
    };
  } catch (e) {
    if (e instanceof BandaiCsvError) return { error: e.message };
    return { error: e instanceof Error ? e.message : "Import impossible." };
  }
}

export async function resolveRowAction(rowId: string, input: RowResolutionInput): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };
  try {
    await resolveRow(rowId, input);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Échec." };
  }
}

export async function setRowLeaderAction(rowId: string, leaderId: string | null): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };
  try {
    await setRowLeader(rowId, leaderId);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Échec." };
  }
}

export async function applyImportAction(importId: string): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };
  try {
    const res = await applyImport(importId);
    await logAdminEvent({ adminId, action: "results_publish", payload: { importId, ...res } });
    return { ok: true, message: `Résultats publiés : ${res.inserted} joueur(s) classé(s)${res.skipped ? `, ${res.skipped} ligne(s) ignorée(s)` : ""}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Publication impossible." };
  }
}

export async function discardImportAction(importId: string): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };
  await discardImport(importId);
  await logAdminEvent({ adminId, action: "results_import_discard", payload: { importId } });
  return { ok: true, message: "Import abandonné." };
}

export async function unpublishResultsAction(eventId: string): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };
  await unpublishResults(eventId);
  await logAdminEvent({ adminId, action: "results_unpublish", eventId });
  return { ok: true, message: "Résultats retirés. Le tournoi est repassé en « publié »." };
}

export type PlayerSearchHit = { id: string; display_name: string; bandai_member_id: string | null; pseudo: string | null };

export async function searchPlayersAction(query: string): Promise<PlayerSearchHit[]> {
  const adminId = await adminUserId();
  if (!adminId) return [];
  const q = query.trim();
  if (q.length < 2) return [];
  const admin = createAdminSupabase();
  const esc = q.replace(/[%_\\]/g, (m) => `\\${m}`);
  const { data } = await admin
    .from("players")
    .select("id, display_name, bandai_member_id, profile:profiles(pseudo)")
    .is("merged_into", null)
    .or(`display_name.ilike.%${esc}%,bandai_member_id.ilike.%${esc}%`)
    .limit(10)
    .returns<Array<{ id: string; display_name: string; bandai_member_id: string | null; profile: { pseudo: string | null } | null }>>();
  return (data ?? []).map((p) => ({ id: p.id, display_name: p.display_name, bandai_member_id: p.bandai_member_id, pseudo: p.profile?.pseudo ?? null }));
}
