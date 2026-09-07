"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { addCashRegistrationAction } from "@/lib/admin/registrations";
import type { ActionState } from "@/lib/auth/actions";
import type { LeaderOption } from "@/lib/db/leaders";
import LeaderPicker from "@/components/LeaderPicker";
import { Card } from "@/components/ui/Card";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default function CashRegistrationForm({ eventId, leaders, priceLabel }: { eventId: string; leaders: LeaderOption[]; priceLabel: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [withInvoice, setWithInvoice] = useState(false);
  const [state, action] = useActionState(
    async (prev: ActionState, fd: FormData) => {
      const res = await addCashRegistrationAction(prev, fd);
      if (res.ok) router.refresh();
      return res;
    },
    {} as ActionState
  );
  const fe = state.fieldErrors ?? {};

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-link text-sm">
        Ajouter un participant payé en boutique
      </button>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-medium tracking-tight text-cream-100">Inscription en boutique (cash)</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-cream-500">Crée une inscription payée ({priceLabel}), génère le billet et l&apos;envoie par e-mail.</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-cream-400 hover:text-cream-100">
          Fermer
        </button>
      </div>
      <form action={action} className="space-y-4" key={state.ok ? `done-${state.message ?? ""}` : "form"}>
        <input type="hidden" name="event_id" value={eventId} />
        {state.error && <Alert tone="error">{state.error}</Alert>}
        {state.ok && <Alert tone="success">{state.message}</Alert>}
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Nom complet" htmlFor="c-name" required error={fe.participant_name}>
            <Input id="c-name" name="participant_name" required />
          </Field>
          <Field label="E-mail" htmlFor="c-email" required error={fe.participant_email}>
            <Input id="c-email" name="participant_email" type="email" required />
          </Field>
          <Field label="Téléphone" htmlFor="c-phone">
            <Input id="c-phone" name="participant_phone" type="tel" />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Pseudo du compte (facultatif)" htmlFor="c-pseudo" error={fe.profile_pseudo} hint="Relie l'inscription à un compte joueur existant.">
            <Input id="c-pseudo" name="profile_pseudo" />
          </Field>
          <LeaderPicker leaders={leaders} name="leader_id" label="Leader déclaré (facultatif)" />
        </div>
        <Field label="Notes" htmlFor="c-notes">
          <Textarea id="c-notes" name="notes" rows={2} />
        </Field>
        <Checkbox name="with_invoice" checked={withInvoice} onChange={(e) => setWithInvoice(e.target.checked)} label="Émettre une facture Mollie (adresse requise)" />
        {withInvoice && (
          <div className="grid gap-4 md:grid-cols-4">
            {fe.billing && <p className="md:col-span-4 text-xs text-red-300">{fe.billing}</p>}
            <Field label="Rue" htmlFor="c-street" className="md:col-span-2">
              <Input id="c-street" name="billing_street" />
            </Field>
            <Field label="Code postal" htmlFor="c-postal">
              <Input id="c-postal" name="billing_postal_code" />
            </Field>
            <Field label="Ville" htmlFor="c-city">
              <Input id="c-city" name="billing_city" />
            </Field>
            <Field label="Pays" htmlFor="c-country">
              <Input id="c-country" name="billing_country" defaultValue="FR" maxLength={2} />
            </Field>
            <Field label="Société" htmlFor="c-company">
              <Input id="c-company" name="billing_company" />
            </Field>
            <Field label="TVA" htmlFor="c-vat">
              <Input id="c-vat" name="billing_vat" />
            </Field>
          </div>
        )}
        <div className="flex justify-end">
          <SubmitButton pendingText="Création…">Ajouter le participant</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
