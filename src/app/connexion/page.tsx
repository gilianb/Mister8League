import type { Metadata } from "next";
import { redirect } from "next/navigation";
import HatLogo from "@/components/HatLogo";
import { getSessionUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/paths";
import LoginForms from "./LoginForms";

export const metadata: Metadata = { title: "Connexion" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string; mode?: string }> };

export default async function ConnexionPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = safeNextPath(sp.next);
  const user = await getSessionUser();
  if (user) redirect(next);

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="text-center mb-8">
        <HatLogo className="w-14 mx-auto mb-4" />
        <h1 className="font-display text-3xl font-bold text-cream-100">Espace joueur</h1>
        <p className="mt-2 text-sm text-cream-400 max-w-[40ch] mx-auto">
          Inscrivez-vous aux tournois, suivez vos points de ligue et gérez vos decks.
        </p>
      </div>
      <LoginForms initialMode={sp.mode === "inscription" ? "signup" : "signin"} next={next} />
    </div>
  );
}
