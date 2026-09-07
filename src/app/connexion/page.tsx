import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/paths";
import LoginForms from "./LoginForms";
import AuthFrame from "./AuthFrame";

export const metadata: Metadata = { title: "Connexion" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string; mode?: string }> };

export default async function ConnexionPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = safeNextPath(sp.next);
  const user = await getSessionUser();
  if (user) redirect(next);

  return (
    <AuthFrame title="À vous de jouer." description="Inscrivez-vous aux tournois, retrouvez vos decks et suivez votre parcours dans la ligue.">
      <LoginForms initialMode={sp.mode === "inscription" ? "signup" : "signin"} next={next} />
    </AuthFrame>
  );
}
