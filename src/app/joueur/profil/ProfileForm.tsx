"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/profiles/actions";
import type { ActionState } from "@/lib/auth/actions";
import { Card } from "@/components/ui/Card";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";

type Initial = {
  pseudo: string;
  full_name: string;
  bandai_member_id: string;
  phone: string;
  bio: string;
  is_public: boolean;
};

export default function ProfileForm({ initial, email, next }: { initial: Initial; email: string; next: string }) {
  const [state, action] = useActionState(updateProfileAction, {} as ActionState);
  const fe = state.fieldErrors ?? {};
  return (
    <Card>
      <form action={action} className="space-y-5">
        <input type="hidden" name="next" value={next} />
        {state.error && <Alert tone="error">{state.error}</Alert>}
        {state.ok && <Alert tone="success">{state.message}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pseudo" htmlFor="p-pseudo" required error={fe.pseudo} hint="Affiché dans les classements et sur votre profil public.">
            <Input id="p-pseudo" name="pseudo" defaultValue={initial.pseudo} required invalid={!!fe.pseudo} />
          </Field>
          <Field label="Nom complet" htmlFor="p-name" required error={fe.full_name} hint="Utilisé sur vos billets, jamais publié.">
            <Input id="p-name" name="full_name" defaultValue={initial.full_name} autoComplete="name" required invalid={!!fe.full_name} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Numéro de membre Bandai"
            htmlFor="p-bandai"
            required
            error={fe.bandai_member_id}
            hint="App Bandai TCG+ → Profil → « Membership number ». Relie vos résultats de tournoi à votre compte."
          >
            <Input id="p-bandai" name="bandai_member_id" inputMode="numeric" defaultValue={initial.bandai_member_id} required invalid={!!fe.bandai_member_id} />
          </Field>
          <Field label="Téléphone" htmlFor="p-phone" hint="Facultatif, pour vous joindre le jour d'un tournoi.">
            <Input id="p-phone" name="phone" type="tel" defaultValue={initial.phone} autoComplete="tel" />
          </Field>
        </div>
        <Field label="E-mail" htmlFor="p-email" hint="Modifiable sur demande auprès de l'organisation.">
          <Input id="p-email" value={email} disabled readOnly />
        </Field>
        <Field label="Bio" htmlFor="p-bio" hint="Quelques mots pour votre profil public (400 caractères max).">
          <Textarea id="p-bio" name="bio" defaultValue={initial.bio} maxLength={400} rows={3} placeholder="Joueur depuis OP01, fan de Zoro rouge…" />
        </Field>
        <Checkbox name="is_public" defaultChecked={initial.is_public} label="Profil public (statistiques et decks publics visibles par les autres joueurs)" />
        <div className="flex justify-end">
          <SubmitButton pendingText="Enregistrement…">{next ? "Enregistrer et continuer" : "Enregistrer"}</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
