import { isSupabaseConfigured } from "@/lib/env";
import { getSessionWithProfile } from "@/lib/auth/session";
import HeaderNav, { type HeaderUser } from "./HeaderNav";

/** En-tête du site : Server Component qui lit la session et délègue l'UI interactive. */
export default async function Header() {
  let user: HeaderUser | null = null;
  if (isSupabaseConfigured()) {
    try {
      const { user: session, profile } = await getSessionWithProfile();
      if (session) {
        user = {
          email: session.email,
          pseudo: profile?.pseudo ?? null,
          avatarUrl: profile?.avatar_url ?? null,
          isAdmin: profile?.role === "admin",
          incomplete: !profile?.pseudo || !profile?.bandai_member_id || !profile?.full_name,
        };
      }
    } catch {
      user = null;
    }
  }
  return <HeaderNav user={user} />;
}
