"use server";

import { createAdminSupabase } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/auth/actions";
import type { LeaderRow } from "@/lib/db/types";
import { LEADER_COLORS, LEADER_IMAGE_BUCKET, isStoredLeaderImage } from "@/lib/leaders/storage";
import { OPTCG_ENDPOINTS, normalizeLeaders, sameColors, type NormalizedLeader, type OptcgCard } from "@/lib/leaders/optcg";
import { adminUserId, formStr, logAdminEvent } from "./guard";

/** Au-delà, plus aucune nouvelle image n'est lancée : un nouveau clic reprend. */
const TIME_BUDGET_MS = 45_000;
const IMAGE_CONCURRENCY = 6;

export type LeaderSyncReport = {
  error?: string;
  fetched: number;
  added: Array<{ code: string; name: string }>;
  imagesUploaded: number;
  imagesRemaining: number;
  /** Écarts entre la base et l'API, signalés sans être appliqués. */
  divergences: Array<{ code: string; field: "nom" | "couleurs"; db: string; api: string }>;
  errors: string[];
  durationMs: number;
};

const EXT_BY_TYPE: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

async function fetchOptcgCards(): Promise<OptcgCard[]> {
  const lists = await Promise.all(
    OPTCG_ENDPOINTS.map(async (url) => {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`${url} a répondu ${res.status}`);
      const data: unknown = await res.json();
      if (!Array.isArray(data)) throw new Error(`${url} : réponse inattendue`);
      return data as OptcgCard[];
    })
  );
  return lists.flat();
}

export async function syncLeadersAction(): Promise<LeaderSyncReport> {
  const started = Date.now();
  const report: LeaderSyncReport = { fetched: 0, added: [], imagesUploaded: 0, imagesRemaining: 0, divergences: [], errors: [], durationMs: 0 };
  const done = (error?: string) => ({ ...report, error, durationMs: Date.now() - started });

  const adminId = await adminUserId();
  if (!adminId) return done("Réservé aux organisateurs.");

  let remote: NormalizedLeader[];
  try {
    remote = normalizeLeaders(await fetchOptcgCards());
  } catch (e) {
    return done(`Impossible de lire optcgapi.com : ${e instanceof Error ? e.message : String(e)}`);
  }
  if (remote.length === 0) return done("optcgapi.com n'a renvoyé aucun leader : synchronisation annulée.");
  report.fetched = remote.length;

  const admin = createAdminSupabase();
  const { data: game } = await admin.from("games").select("id").eq("slug", "one-piece").single<{ id: string }>();
  if (!game) return done("Jeu « one-piece » introuvable (exécutez 0002_seed.sql).");

  const { data: rows, error: readErr } = await admin.from("leaders").select("*").eq("game_id", game.id).returns<LeaderRow[]>();
  if (readErr) return done(readErr.message);
  const byCode = new Map((rows ?? []).filter((r) => r.code).map((r) => [r.code!.toUpperCase(), r]));

  // 1. Nouveaux leaders, et écarts sur les existants (non appliqués : l'API
  //    se trompe parfois, la correction reste manuelle).
  const toInsert = remote.filter((l) => !byCode.has(l.code));
  for (const l of remote) {
    const row = byCode.get(l.code);
    if (!row) continue;
    if (row.name !== l.name) report.divergences.push({ code: l.code, field: "nom", db: row.name, api: l.name });
    if (l.colors.length > 0 && !sameColors(row.colors, l.colors)) {
      report.divergences.push({ code: l.code, field: "couleurs", db: row.colors.join(" / ") || "—", api: l.colors.join(" / ") });
    }
  }
  if (toInsert.length > 0) {
    const { data: inserted, error } = await admin
      .from("leaders")
      .insert(toInsert.map((l) => ({ game_id: game.id, code: l.code, name: l.name, colors: l.colors })))
      .select("*")
      .returns<LeaderRow[]>();
    if (error) return done(`Ajout des nouveaux leaders impossible : ${error.message}`);
    for (const r of inserted ?? []) byCode.set(r.code!.toUpperCase(), r);
    report.added = toInsert.map((l) => ({ code: l.code, name: l.name }));
  }

  // 2. Visuels : tout leader dont l'image n'est pas encore dans le bucket.
  const queue = remote.filter((l) => {
    const row = byCode.get(l.code);
    return row && !isStoredLeaderImage(row.image_url);
  });
  const deadline = started + TIME_BUDGET_MS;

  async function uploadOne(l: NormalizedLeader) {
    const row = byCode.get(l.code)!;
    try {
      const res = await fetch(l.imageSourceUrl, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new Error(`image ${res.status}`);
      const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
      const ext = EXT_BY_TYPE[type] ?? l.imageSourceUrl.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `one-piece/${l.code}.${ext}`;
      const bytes = new Uint8Array(await res.arrayBuffer());
      const up = await admin.storage
        .from(LEADER_IMAGE_BUCKET)
        .upload(path, bytes, { contentType: type || `image/${ext}`, upsert: true, cacheControl: "604800" });
      if (up.error) throw new Error(up.error.message);
      const { data: pub } = admin.storage.from(LEADER_IMAGE_BUCKET).getPublicUrl(path);
      const { error } = await admin.from("leaders").update({ image_url: pub.publicUrl }).eq("id", row.id);
      if (error) throw new Error(error.message);
      report.imagesUploaded += 1;
    } catch (e) {
      report.errors.push(`${l.code} : ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  let next = 0;
  await Promise.all(
    Array.from({ length: IMAGE_CONCURRENCY }, async () => {
      while (next < queue.length && Date.now() < deadline) {
        await uploadOne(queue[next++]);
      }
    })
  );
  report.imagesRemaining = queue.length - next;

  await logAdminEvent({
    adminId,
    action: "leaders_sync",
    payload: {
      fetched: report.fetched,
      added: report.added.map((a) => a.code),
      imagesUploaded: report.imagesUploaded,
      imagesRemaining: report.imagesRemaining,
      errors: report.errors.length,
    },
  });
  return done();
}

/** Correction manuelle d'un leader (nom, couleurs). */
export async function updateLeaderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };

  const id = formStr(formData, "id");
  const name = formStr(formData, "name");
  const colors = LEADER_COLORS.filter((c) => formData.getAll("colors").includes(c));
  if (!id) return { error: "Leader manquant." };
  if (name.length < 2) return { fieldErrors: { name: "Nom requis." }, error: "Vérifiez le nom.", values: { name } };
  if (colors.length === 0) return { error: "Cochez au moins une couleur.", values: { name } };

  const admin = createAdminSupabase();
  const { error } = await admin.from("leaders").update({ name, colors }).eq("id", id);
  if (error) return { error: error.message };
  await logAdminEvent({ adminId, action: "leader_update", payload: { leaderId: id, name, colors } });
  return { ok: true, message: "Leader enregistré." };
}
