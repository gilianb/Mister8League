"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { IconCheck, IconX } from "@/components/ui/icons";
import { Button } from "@/components/ui/Button";

/**
 * Point d'arrivée des liens d'e-mail Supabase :
 *  - `#access_token=…` (flux implicite)         → setSession
 *  - `?code=…` (flux PKCE)                      → exchangeCodeForSession
 *  - cookies déjà posés par /auth/confirm       → getUser
 */
export default function CallbackClient({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createBrowserSupabase();
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
        const hashError = hash.get("error_description") ?? hash.get("error") ?? url.searchParams.get("error_description");
        if (hashError) throw new Error(hashError);

        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        const code = url.searchParams.get("code");

        if (accessToken && refreshToken) {
          url.hash = "";
          window.history.replaceState(window.history.state, "", url.toString());
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw new Error(
              error.message.toLowerCase().includes("code verifier")
                ? "Ce lien a été ouvert dans un autre navigateur que celui de la demande. Refaites la demande depuis ce navigateur, ou connectez-vous si votre e-mail est déjà confirmé."
                : error.message
            );
          }
        }

        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!data.user) throw new Error("Session introuvable. Essayez de vous connecter.");

        setStatus("success");
        router.replace(nextPath);
        router.refresh();
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Erreur inattendue.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, nextPath]);

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <Card className="text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-400 text-coal-950">
              <Spinner size={20} />
            </div>
            <h1 className="font-display text-xl font-bold text-cream-100">Vérification en cours…</h1>
            <p className="mt-2 text-sm text-cream-400">Un instant, nous finalisons votre connexion.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
              <IconCheck />
            </div>
            <h1 className="font-display text-xl font-bold text-cream-100">C&apos;est bon !</h1>
            <p className="mt-2 text-sm text-cream-400">Redirection…</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white">
              <IconX />
            </div>
            <h1 className="font-display text-xl font-bold text-cream-100">Lien invalide ou expiré</h1>
            <p className="mt-2 text-sm text-cream-400">{message}</p>
            <div className="mt-5 flex justify-center gap-2">
              <Button href="/connexion" variant="outline" size="sm">
                Se connecter
              </Button>
              <Button href="/auth/erreur" variant="ghost" size="sm">
                Renvoyer un lien
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
