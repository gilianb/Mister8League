import type { Metadata } from "next";
import AuthFrame from "@/app/connexion/AuthFrame";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import ResendConfirmation from "@/app/connexion/verifier-email/ResendConfirmation";

export const metadata: Metadata = { title: "Problème de lien", robots: { index: false } };

type Props = { searchParams: Promise<{ msg?: string; email?: string }> };

export default async function AuthErrorPage({ searchParams }: Props) {
  const { msg, email } = await searchParams;
  return (
    <AuthFrame title="Retrouvons votre accès." description={msg || "Ce lien de confirmation est invalide ou a expiré. Voici comment retrouver votre espace joueur."}>
      <div className="space-y-5">
        <Alert tone="info" title="Étape 1 : essayez de vous connecter">
          Un lien de confirmation ne fonctionne qu&apos;une fois. Si vous l&apos;aviez déjà ouvert, votre compte est
          probablement confirmé.
        </Alert>
        <Button href="/connexion" className="w-full">
          Se connecter
        </Button>

        <div className="border-t hairline pt-5">
          <p className="text-sm font-semibold text-cream-100">Étape 2 : toujours bloqué ?</p>
          <p className="text-xs text-cream-400 mt-1 mb-3">
            Demandez un nouveau lien de confirmation. Le nouveau lien remplace l&apos;ancien.
          </p>
          <ResendConfirmation initialEmail={email ?? ""} />
        </div>
      </div>
    </AuthFrame>
  );
}
