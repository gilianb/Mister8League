import "server-only";
import { getSessionWithProfile } from "@/lib/auth/session";
import { createAdminSupabase } from "@/lib/supabase/admin";

/** Pour les Server Actions admin : renvoie l'identifiant admin ou null. */
export async function adminUserId(): Promise<string | null> {
  const { user, profile } = await getSessionWithProfile();
  if (!user || profile?.role !== "admin") return null;
  return user.id;
}

export async function logAdminEvent(input: {
  adminId: string;
  action: string;
  eventId?: string | null;
  registrationId?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  payload?: Record<string, unknown> | null;
}) {
  const admin = createAdminSupabase();
  await admin.from("admin_events").insert({
    admin_id: input.adminId,
    action: input.action,
    event_id: input.eventId ?? null,
    registration_id: input.registrationId ?? null,
    from_status: input.fromStatus ?? null,
    to_status: input.toStatus ?? null,
    note: input.note ?? null,
    payload: input.payload ?? null,
  });
}

export function formStr(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}
