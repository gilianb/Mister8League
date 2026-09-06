import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/db/types";

export type SessionUser = { id: string; email: string | null };

/** Utilisateur connecté (vérifié auprès de Supabase, pas seulement le cookie). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return null;
  return { id: u.id, email: u.email ?? null };
}

/** Profil de l'utilisateur connecté (RLS « own profile »). */
export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .maybeSingle<ProfileRow>();
  return data ?? null;
}

export async function getSessionWithProfile(): Promise<{
  user: SessionUser | null;
  profile: ProfileRow | null;
}> {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { user: null, profile: null };
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .maybeSingle<ProfileRow>();
  return {
    user: { id: auth.user.id, email: auth.user.email ?? null },
    profile: data ?? null,
  };
}

/** Redirige vers la connexion si nécessaire. */
export async function requireUser(
  next?: string
): Promise<{ user: SessionUser; profile: ProfileRow | null }> {
  const { user, profile } = await getSessionWithProfile();
  if (!user) {
    redirect(next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion");
  }
  return { user, profile };
}

/** Redirige vers l'accueil si l'utilisateur n'est pas admin. */
export async function requireAdmin(): Promise<{ user: SessionUser; profile: ProfileRow }> {
  const { user, profile } = await getSessionWithProfile();
  if (!user) redirect("/connexion?next=%2Fadmin");
  if (!profile || profile.role !== "admin") redirect("/");
  return { user, profile };
}

/** Un profil est complet quand il peut être rattaché aux résultats Bandai. */
export function isProfileComplete(p: ProfileRow | null): boolean {
  return Boolean(p?.pseudo && p?.full_name && p?.bandai_member_id);
}

export function isAdminProfile(p: ProfileRow | null): boolean {
  return p?.role === "admin";
}
