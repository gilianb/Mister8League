"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signInAction, signUpAction, type ActionState } from "@/lib/auth/actions";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cn } from "@/lib/cn";

type Mode = "signin" | "signup";

const INITIAL: ActionState = {};

export default function LoginForms({ initialMode, next }: { initialMode: Mode; next: string }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [signInState, signIn] = useActionState(signInAction, INITIAL);
  const [signUpState, signUp] = useActionState(signUpAction, INITIAL);

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      className={cn(
        "-mb-px flex-1 border-b-2 px-2 pb-3 text-sm font-semibold transition-colors",
        mode === m ? "border-gold-400 text-cream-100" : "border-transparent text-cream-500 hover:text-cream-100"
      )}
      aria-pressed={mode === m}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-7 flex gap-5 border-b hairline" role="tablist">
        {tab("signin", "Connexion")}
        {tab("signup", "Créer un compte")}
      </div>

      {mode === "signin" ? (
        <form action={signIn} className="space-y-5">
          <input type="hidden" name="next" value={next} />
          {signInState.error && (
            <Alert tone="error">
              {signInState.error}
              {signInState.message === "unconfirmed" && (
                <>
                  {" "}
                  <Link href="/auth/erreur" className="font-semibold underline underline-offset-4">
                    Renvoyer le lien
                  </Link>
                </>
              )}
            </Alert>
          )}
          <Field label="E-mail" htmlFor="signin-email" required>
            <Input id="signin-email" name="email" type="email" autoComplete="email" placeholder="vous@exemple.fr" required />
          </Field>
          <Field label="Mot de passe" htmlFor="signin-password" required>
            <Input id="signin-password" name="password" type="password" autoComplete="current-password" required />
          </Field>
          <div className="flex items-center justify-between">
            <Link href="/connexion/mot-de-passe-oublie" className="text-link text-[13px]">
              Mot de passe oublié ?
            </Link>
          </div>
          <SubmitButton className="w-full" pendingText="Connexion…">
            Se connecter
          </SubmitButton>
        </form>
      ) : (
        <form action={signUp} className="space-y-5">
          <input type="hidden" name="next" value={next} />
          {signUpState.error && <Alert tone="error">{signUpState.error}</Alert>}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Pseudo" htmlFor="su-pseudo" required error={signUpState.fieldErrors?.pseudo} hint="Affiché dans les classements.">
              <Input id="su-pseudo" name="pseudo" autoComplete="nickname" placeholder="Luffy_92" required invalid={!!signUpState.fieldErrors?.pseudo} />
            </Field>
            <Field label="Nom complet" htmlFor="su-name" required error={signUpState.fieldErrors?.full_name} hint="Pour votre billet et le check-in.">
              <Input id="su-name" name="full_name" autoComplete="name" placeholder="Prénom Nom" required invalid={!!signUpState.fieldErrors?.full_name} />
            </Field>
          </div>
          <Field
            label="Numéro de membre Bandai"
            htmlFor="su-bandai"
            required
            error={signUpState.fieldErrors?.bandai_member_id}
            hint="Dans l'app Bandai TCG+ : Profil → « Membership number » (10 chiffres). Il relie vos résultats de tournoi à votre compte."
          >
            <Input id="su-bandai" name="bandai_member_id" inputMode="numeric" placeholder="0000123456" required invalid={!!signUpState.fieldErrors?.bandai_member_id} />
          </Field>
          <Field label="E-mail" htmlFor="su-email" required error={signUpState.fieldErrors?.email}>
            <Input id="su-email" name="email" type="email" autoComplete="email" placeholder="vous@exemple.fr" required invalid={!!signUpState.fieldErrors?.email} />
          </Field>
          <Field label="Mot de passe" htmlFor="su-password" required error={signUpState.fieldErrors?.password} hint="8 caractères minimum.">
            <Input id="su-password" name="password" type="password" autoComplete="new-password" required minLength={8} invalid={!!signUpState.fieldErrors?.password} />
          </Field>
          <SubmitButton className="w-full" pendingText="Création du compte…">
            Créer mon compte
          </SubmitButton>
          <p className="text-center text-[13px] leading-relaxed text-cream-500">
            Un e-mail de confirmation vous sera envoyé. En créant un compte, vous acceptez notre{" "}
            <Link href="/confidentialite" className="text-link">
              politique de confidentialité
            </Link>
            .
          </p>
        </form>
      )}
    </div>
  );
}
