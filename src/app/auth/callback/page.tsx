import { Suspense } from "react";
import { safeNextPath } from "@/lib/auth/paths";
import CallbackClient from "./CallbackClient";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string; type?: string }> };

export default async function AuthCallbackPage({ searchParams }: Props) {
  const sp = await searchParams;
  const fallback = sp.type === "recovery" ? "/connexion/nouveau-mot-de-passe" : "/joueur";
  const next = safeNextPath(sp.next, fallback);
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <CallbackClient nextPath={next} />
    </Suspense>
  );
}
