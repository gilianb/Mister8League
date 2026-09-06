import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import NewPasswordForm from "./NewPasswordForm";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NouveauMotDePassePage() {
  const user = await getSessionUser();
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-cream-100 mb-2">Choisir un nouveau mot de passe</h1>
      <p className="text-cream-400 mb-6 text-sm">8 caractères minimum.</p>
      {user ? (
        <NewPasswordForm />
      ) : (
        <div className="space-y-4">
          <Alert tone="warn" title="Session introuvable">
            Ouvrez le lien de réinitialisation reçu par e-mail depuis ce navigateur, ou demandez un nouveau lien.
          </Alert>
          <Button href="/connexion/mot-de-passe-oublie" variant="outline">
            Demander un nouveau lien
          </Button>
        </div>
      )}
    </div>
  );
}
