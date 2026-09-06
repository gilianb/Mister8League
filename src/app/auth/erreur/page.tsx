import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import ResendConfirmation from "@/app/connexion/verifier-email/ResendConfirmation";

export const metadata: Metadata = { title: "Problème de lien", robots: { index: false } };

type Props = { searchParams: Promise<{ msg?: string; email?: string }> };

export default async function AuthErrorPage({ searchParams }: Props) {
  const { msg, email } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-cream-100 mb-2">Lien de confirmation invalide</h1>
      <p className="text-cream-400 mb-6">{msg || "Ce lien est invalide ou a expiré."}</p>

      <Card className="space-y-5">
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
      </Card>
    </div>
  );
}
