"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSessionWithProfile } from "@/lib/auth/session";
import type { ActionState } from "@/lib/auth/actions";

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function saveDeckAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await getSessionWithProfile();
  if (!user) return { error: "Connectez-vous." };

  const id = str(formData, "id") || null;
  const name = str(formData, "name").slice(0, 80);
  const leaderId = str(formData, "leader_id") || null;
  const decklist = str(formData, "decklist_text").slice(0, 8000);
  const notes = str(formData, "notes").slice(0, 1000);
  const isPublic = formData.get("is_public") === "on";

  if (name.length < 2) return { fieldErrors: { name: "Donnez un nom à votre deck." } };

  const supabase = await createServerSupabase();
  const payload = { name, leader_id: leaderId, decklist_text: decklist || null, notes: notes || null, is_public: isPublic };
  const { error } = id
    ? await supabase.from("decks").update(payload).eq("id", id).eq("profile_id", user.id)
    : await supabase.from("decks").insert({ ...payload, profile_id: user.id });
  if (error) return { error: error.message };
  redirect("/joueur/decks?msg=enregistre");
}

export async function deleteDeckAction(id: string): Promise<ActionState> {
  const { user } = await getSessionWithProfile();
  if (!user) return { error: "Connectez-vous." };
  const supabase = await createServerSupabase();
  // Un deck déjà utilisé sur une inscription / un résultat est archivé plutôt que supprimé.
  const { data: used } = await supabase.from("registrations").select("id").eq("deck_id", id).limit(1);
  if ((used?.length ?? 0) > 0) {
    await supabase.from("decks").update({ is_archived: true }).eq("id", id).eq("profile_id", user.id);
  } else {
    const { error } = await supabase.from("decks").delete().eq("id", id).eq("profile_id", user.id);
    if (error) {
      await supabase.from("decks").update({ is_archived: true }).eq("id", id).eq("profile_id", user.id);
    }
  }
  redirect("/joueur/decks?msg=supprime");
}

export async function toggleDeckVisibilityAction(id: string, isPublic: boolean): Promise<ActionState> {
  const { user } = await getSessionWithProfile();
  if (!user) return { error: "Connectez-vous." };
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("decks").update({ is_public: isPublic }).eq("id", id).eq("profile_id", user.id);
  if (error) return { error: error.message };
  return { ok: true };
}
