"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSessionWithProfile } from "@/lib/auth/session";
import { checkAvailability, type ActionState } from "@/lib/auth/actions";
import { safeNextPath } from "@/lib/auth/paths";
import { normalizeBandaiId, validateBandaiId, validateFullName, validatePseudo } from "@/lib/auth/validation";

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await getSessionWithProfile();
  if (!user) return { error: "Connectez-vous." };

  const pseudo = str(formData, "pseudo");
  const fullName = str(formData, "full_name");
  const bandaiRaw = str(formData, "bandai_member_id");
  const phone = str(formData, "phone");
  const bio = str(formData, "bio").slice(0, 400);
  const isPublic = formData.get("is_public") === "on";
  const next = str(formData, "next");

  const fieldErrors: Record<string, string> = {};
  const e1 = validatePseudo(pseudo);
  if (e1) fieldErrors.pseudo = e1;
  const e2 = validateFullName(fullName);
  if (e2) fieldErrors.full_name = e2;
  const e3 = validateBandaiId(bandaiRaw);
  if (e3) fieldErrors.bandai_member_id = e3;
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const bandaiMemberId = normalizeBandaiId(bandaiRaw);
  const { pseudoTaken, bandaiTaken } = await checkAvailability({ pseudo, bandaiMemberId, exceptProfileId: user.id });
  if (pseudoTaken) fieldErrors.pseudo = "Ce pseudo est déjà pris.";
  if (bandaiTaken) fieldErrors.bandai_member_id = "Ce numéro de membre Bandai est déjà associé à un autre compte.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ pseudo, full_name: fullName, bandai_member_id: bandaiMemberId, phone: phone || null, bio: bio || null, is_public: isPublic })
    .eq("id", user.id);
  if (error) return { error: error.message.includes("unique") ? "Pseudo ou numéro Bandai déjà utilisé." : error.message };

  if (next) redirect(safeNextPath(next));
  return { ok: true, message: "Profil enregistré." };
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function uploadAvatarAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await getSessionWithProfile();
  if (!user) return { error: "Connectez-vous." };
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "Choisissez une image." };
  if (!ALLOWED.has(file.type)) return { error: "Format accepté : JPG, PNG ou WebP." };
  if (file.size > MAX_AVATAR_BYTES) return { error: "Image trop lourde (2 Mo maximum)." };

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;
  const supabase = await createServerSupabase();
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await supabase.storage.from("avatars").upload(path, bytes, { contentType: file.type, upsert: true });
  if (upErr) return { error: `Envoi impossible : ${upErr.message}` };

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const { error } = await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", user.id);
  if (error) return { error: error.message };
  return { ok: true, message: "Photo mise à jour." };
}

export async function removeAvatarAction(): Promise<ActionState> {
  const { user } = await getSessionWithProfile();
  if (!user) return { error: "Connectez-vous." };
  const supabase = await createServerSupabase();
  await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  return { ok: true };
}
