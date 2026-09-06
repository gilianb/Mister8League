import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { IconMail } from "@/components/ui/icons";
import ResendConfirmation from "./ResendConfirmation";

export const metadata: Metadata = { title: "Vérifiez votre e-mail", robots: { index: false } };

type Props = { searchParams: Promise<{ email?: string; next?: string }> };

export default async function VerifierEmailPage({ searchParams }: Props) {
  const { email, next } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-400 text-coal-950">
          <IconMail size={26} />
        </div>
        <h1 className="font-display text-3xl font-bold text-cream-100">Vérifiez votre boîte mail</h1>
        <p className="mt-2 text-sm text-cream-400">Pensez aussi à regarder dans les spams.</p>
      </div>
      <Card className="space-y-5">
        <Alert tone="success" title="E-mail de confirmation envoyé">
          Nous avons envoyé un lien de confirmation à{" "}
          <span className="font-semibold text-cream-100">{email || "votre adresse"}</span>. Cliquez dessus pour activer
          votre compte.
        </Alert>
        <ResendConfirmation initialEmail={email ?? ""} next={next} />
      </Card>
    </div>
  );
}
