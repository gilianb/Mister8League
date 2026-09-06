"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { saveSeasonAction } from "@/lib/admin/seasons";
import type { ActionState } from "@/lib/auth/actions";
import type { SeasonRow } from "@/lib/db/types";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default function SeasonForm({ season }: { season: SeasonRow | null }) {
  const router = useRouter();
  const [state, action] = useActionState(
    async (prev: ActionState, fd: FormData) => {
      const res = await saveSeasonAction(prev, fd);
      if (res.ok) router.refresh();
      return res;
    },
    {} as ActionState
  );
  const fe = state.fieldErrors ?? {};
  return (
    <Card>
      <form action={action} className="space-y-4">
        {season && <input type="hidden" name="id" value={season.id} />}
        <h2 className="font-display text-lg font-bold text-cream-100">{season ? "Modifier la saison" : "Nouvelle saison"}</h2>
        {state.error && <Alert tone="error">{state.error}</Alert>}
        {state.ok && <Alert tone="success">{state.message}</Alert>}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nom" htmlFor="s-name" required error={fe.name}>
            <Input id="s-name" name="name" defaultValue={season?.name ?? ""} placeholder="Saison 2026/2027" required />
          </Field>
          <Field label="Slug" htmlFor="s-slug" error={fe.slug} hint="Ex. 2026-2027 (URL du classement).">
            <Input id="s-slug" name="slug" defaultValue={season?.slug ?? ""} placeholder="2026-2027" />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Début" htmlFor="s-start" required error={fe.starts_on}>
            <Input id="s-start" name="starts_on" type="date" defaultValue={season?.starts_on ?? ""} required />
          </Field>
          <Field label="Fin" htmlFor="s-end" error={fe.ends_on}>
            <Input id="s-end" name="ends_on" type="date" defaultValue={season?.ends_on ?? ""} />
          </Field>
          <Field label="Qualifiés pour la finale" htmlFor="s-qual" hint="0 = pas de ligne de coupe">
            <Input id="s-qual" name="qualified_count" type="number" min={0} defaultValue={season?.qualified_count ?? 16} />
          </Field>
          <Field label="Statut" htmlFor="s-status" error={fe.status} hint="Une seule saison active.">
            <Select id="s-status" name="status" defaultValue={season?.status ?? "draft"}>
              <option value="draft">Brouillon</option>
              <option value="active">Active</option>
              <option value="closed">Terminée</option>
            </Select>
          </Field>
        </div>
        <div className="flex justify-end">
          <SubmitButton pendingText="Enregistrement…">{season ? "Enregistrer" : "Créer la saison"}</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
