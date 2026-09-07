import type { Metadata } from "next";
import ForgotPasswordForm from "./ForgotPasswordForm";
import AuthFrame from "../AuthFrame";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default function MotDePasseOubliePage() {
  return (
    <AuthFrame title="Reprenons la partie." description="Indiquez votre adresse e-mail pour recevoir un lien et choisir un nouveau mot de passe.">
      <ForgotPasswordForm />
    </AuthFrame>
  );
}
