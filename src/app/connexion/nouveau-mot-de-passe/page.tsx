import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import NewPasswordForm from "./NewPasswordForm";
import AuthFrame from "../AuthFrame";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NouveauMotDePassePage() {
  const user = await getSessionUser();
  return (
    <AuthFrame title="Un nouveau départ." description="Choisissez votre nouveau mot de passe : 8 caractères minimum pour retrouver votre espace joueur.">
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
    </AuthFrame>
  );
}
