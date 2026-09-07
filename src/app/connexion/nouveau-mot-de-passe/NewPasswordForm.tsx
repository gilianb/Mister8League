"use client";

import { useActionState } from "react";
import { updatePasswordAction, type ActionState } from "@/lib/auth/actions";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default function NewPasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, {} as ActionState);
  return (
    <div>
      <form action={action} className="space-y-4">
        {state.error && <Alert tone="error">{state.error}</Alert>}
        <Field label="Nouveau mot de passe" htmlFor="np-password" required error={state.fieldErrors?.password}>
          <Input id="np-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <Field label="Confirmer le mot de passe" htmlFor="np-confirm" required error={state.fieldErrors?.confirm}>
          <Input id="np-confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <SubmitButton className="w-full" pendingText="Enregistrement…">
          Enregistrer le mot de passe
        </SubmitButton>
      </form>
    </div>
  );
}
