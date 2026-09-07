"use client";

import { useActionState } from "react";
import { forgotPasswordAction, type ActionState } from "@/lib/auth/actions";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, {} as ActionState);
  return (
    <div>
      {state.ok ? (
        <div className="space-y-4">
          <Alert tone="success" title="E-mail envoyé">
            {state.message}
          </Alert>
          <Button href="/connexion" variant="outline" className="w-full">
            Retour à la connexion
          </Button>
        </div>
      ) : (
        <form action={action} className="space-y-4">
          {state.error && <Alert tone="error">{state.error}</Alert>}
          <Field label="E-mail" htmlFor="fp-email" required error={state.fieldErrors?.email}>
            <Input id="fp-email" name="email" type="email" autoComplete="email" placeholder="vous@exemple.fr" required />
          </Field>
          <SubmitButton className="w-full" pendingText="Envoi…">
            Envoyer le lien
          </SubmitButton>
          <Button href="/connexion" variant="ghost" size="sm" className="w-full">
            Retour à la connexion
          </Button>
        </form>
      )}
    </div>
  );
}
