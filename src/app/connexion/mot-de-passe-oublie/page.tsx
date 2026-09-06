import type { Metadata } from "next";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default function MotDePasseOubliePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-cream-100 mb-2">Mot de passe oublié</h1>
      <p className="text-cream-400 mb-6 text-sm">
        Indiquez votre adresse e-mail : nous vous enverrons un lien pour choisir un nouveau mot de passe.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
