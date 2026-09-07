import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import ResendConfirmation from "./ResendConfirmation";
import AuthFrame from "../AuthFrame";

export const metadata: Metadata = { title: "Vérifiez votre e-mail", robots: { index: false } };

type Props = { searchParams: Promise<{ email?: string; next?: string }> };

export default async function VerifierEmailPage({ searchParams }: Props) {
  const { email, next } = await searchParams;
  return (
    <AuthFrame title="Encore un petit clic." description="Confirmez votre adresse e-mail pour rejoindre la table. Pensez aussi à regarder dans les spams.">
      <div className="space-y-6">
        <Alert tone="success" title="E-mail de confirmation envoyé">
          Nous avons envoyé un lien de confirmation à{" "}
          <span className="font-semibold text-cream-100">{email || "votre adresse"}</span>. Cliquez dessus pour activer
          votre compte.
        </Alert>
        <ResendConfirmation initialEmail={email ?? ""} next={next} />
      </div>
    </AuthFrame>
  );
}
