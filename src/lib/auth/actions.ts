"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/env";
import { safeNextPath } from "./paths";
import { keepValues } from "@/lib/forms";
import {
  normalizeBandaiId,
  normalizeEmail,
  validateBandaiId,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePseudo,
} from "./validation";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
  message?: string;
  /**
   * Valeurs saisies, à réafficher après une erreur.
   *
   * React réinitialise le formulaire dès que l'action rend la main : sans ce
   * renvoi, l'utilisateur retrouve des champs vides et doit tout retaper.
   * Les mots de passe n'y figurent jamais.
   */
  values?: Record<string, string>;
};

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function isAlreadyRegisteredError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("already registered") ||
    m.includes("already exists") ||
    m.includes("already been registered") ||
    m.includes("email address already")
  );
}

/** Le pseudo est-il libre ? (insensible à la casse) */
async function isPseudoTaken(pseudo: string, exceptProfileId?: string): Promise<boolean> {
  const admin = createAdminSupabase();
  let q = admin.from("profiles").select("id").ilike("pseudo", pseudo.replace(/[%_\\]/g, (m) => `\\${m}`)).limit(1);
  if (exceptProfileId) q = q.neq("id", exceptProfileId);
  const { data } = await q;
  return (data?.length ?? 0) > 0;
}

async function isBandaiIdTaken(bandaiId: string, exceptProfileId?: string): Promise<boolean> {
  const admin = createAdminSupabase();
  let q = admin.from("profiles").select("id").eq("bandai_member_id", bandaiId).limit(1);
  if (exceptProfileId) q = q.neq("id", exceptProfileId);
  const { data } = await q;
  return (data?.length ?? 0) > 0;
}

export async function checkAvailability(input: {
  pseudo?: string;
  bandaiMemberId?: string;
  exceptProfileId?: string;
}): Promise<{ pseudoTaken: boolean; bandaiTaken: boolean }> {
  const [pseudoTaken, bandaiTaken] = await Promise.all([
    input.pseudo ? isPseudoTaken(input.pseudo, input.exceptProfileId) : Promise.resolve(false),
    input.bandaiMemberId
      ? isBandaiIdTaken(normalizeBandaiId(input.bandaiMemberId), input.exceptProfileId)
      : Promise.resolve(false),
  ]);
  return { pseudoTaken, bandaiTaken };
}

export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const pseudo = str(formData, "pseudo").trim();
  const fullName = str(formData, "full_name").trim();
  const email = normalizeEmail(str(formData, "email"));
  const password = str(formData, "password");
  const bandaiRaw = str(formData, "bandai_member_id");
  const next = safeNextPath(str(formData, "next"));
  // Tout sauf le mot de passe : une erreur ne doit pas effacer la saisie.
  const values = keepValues(formData, ["pseudo", "full_name", "email", "bandai_member_id"]);

  const fieldErrors: Record<string, string> = {};
  const e1 = validatePseudo(pseudo);
  if (e1) fieldErrors.pseudo = e1;
  const e2 = validateFullName(fullName);
  if (e2) fieldErrors.full_name = e2;
  const e3 = validateEmail(email);
  if (e3) fieldErrors.email = e3;
  const e4 = validatePassword(password);
  if (e4) fieldErrors.password = e4;
  const e5 = validateBandaiId(bandaiRaw);
  if (e5) fieldErrors.bandai_member_id = e5;
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const bandaiMemberId = normalizeBandaiId(bandaiRaw);
  const { pseudoTaken, bandaiTaken } = await checkAvailability({ pseudo, bandaiMemberId });
  if (pseudoTaken) fieldErrors.pseudo = "Ce pseudo est déjà pris.";
  if (bandaiTaken) fieldErrors.bandai_member_id = "Ce numéro de membre Bandai est déjà associé à un compte.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const supabase = await createServerSupabase();
  const emailRedirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: { pseudo, full_name: fullName, bandai_member_id: bandaiMemberId },
    },
  });

  if (error) {
    if (isAlreadyRegisteredError(error.message)) {
      return { error: "Cette adresse e-mail est déjà utilisée. Connectez-vous ou réinitialisez votre mot de passe.", values };
    }
    return { error: error.message, values };
  }

  // Supabase renvoie un utilisateur « fantôme » sans identité quand l'e-mail existe déjà.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { error: "Cette adresse e-mail est déjà utilisée. Connectez-vous ou réinitialisez votre mot de passe.", values };
  }

  if (data.session) {
    // Confirmation d'e-mail désactivée côté Supabase : session immédiate.
    redirect(next);
  }
  redirect(`/connexion/verifier-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
}

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = normalizeEmail(str(formData, "email"));
  const password = str(formData, "password");
  const next = safeNextPath(str(formData, "next"));

  const values = { email };
  if (!email || !password) return { error: "Indiquez votre e-mail et votre mot de passe.", values };

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("not confirmed")) {
      return {
        error: "Votre adresse e-mail n'est pas encore confirmée. Ouvrez le lien reçu par e-mail ou demandez un nouvel envoi.",
        message: "unconfirmed",
        values,
      };
    }
    return { error: "E-mail ou mot de passe incorrect.", values };
  }
  redirect(next);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resendConfirmationAction(email: string, next?: string): Promise<ActionState> {
  const cleaned = normalizeEmail(email);
  if (validateEmail(cleaned)) return { error: "Adresse e-mail invalide." };
  const supabase = await createServerSupabase();
  const emailRedirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(safeNextPath(next))}`;
  const { error } = await supabase.auth.resend({ type: "signup", email: cleaned, options: { emailRedirectTo } });
  if (error) return { error: error.message };
  return { ok: true, message: "E-mail de confirmation renvoyé. Pensez à vérifier vos spams." };
}

export async function forgotPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = normalizeEmail(str(formData, "email"));
  const values = keepValues(formData, ["email"]);
  const err = validateEmail(email);
  if (err) return { fieldErrors: { email: err }, values };
  const supabase = await createServerSupabase();
  const redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/connexion/nouveau-mot-de-passe")}`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { error: error.message, values };
  return { ok: true, message: "Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d'être envoyé." };
}

export async function updatePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = str(formData, "password");
  const confirm = str(formData, "confirm");
  const err = validatePassword(password);
  if (err) return { fieldErrors: { password: err } };
  if (password !== confirm) return { fieldErrors: { confirm: "Les deux mots de passe ne correspondent pas." } };

  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { error: "Session introuvable. Ouvrez à nouveau le lien reçu par e-mail." };
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/joueur?message=mot-de-passe");
}
