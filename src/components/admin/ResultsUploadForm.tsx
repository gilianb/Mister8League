"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { uploadResultsAction } from "@/lib/admin/results";
import type { ActionState } from "@/lib/auth/actions";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { IconUpload } from "@/components/ui/icons";

export default function ResultsUploadForm({ eventId, defaultRounds }: { eventId: string; defaultRounds: number | null }) {
  const router = useRouter();
  const [state, action] = useActionState(
    async (prev: ActionState, fd: FormData) => {
      const res = await uploadResultsAction(prev, fd);
      if (res.ok) router.refresh();
      return res;
    },
    {} as ActionState
  );

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-medium tracking-tight text-cream-100">Importer le classement Bandai TCG+</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-cream-500">
          Dans Bandai TCG+ : tournoi → « Classement final » → export CSV. Colonnes attendues : Classement, Numéro de membre, Nom du joueur, Points gagnés, OMW %, OOMW %.
        </p>
      </div>
      <form action={action} className="space-y-4">
        <input type="hidden" name="event_id" value={eventId} />
        {state.error && <Alert tone="error">{state.error}</Alert>}
        {state.ok && <Alert tone="success">{state.message}</Alert>}
        <div className="grid gap-4 md:grid-cols-[1fr_180px]">
          <Field label="Fichier CSV" htmlFor="csv" required>
            <input id="csv" name="csv" type="file" accept=".csv,text/csv" required className="block w-full text-sm text-cream-300 file:mr-3 file:rounded-control file:border-0 file:bg-coal-700 file:px-3 file:py-2 file:text-[13px] file:font-medium file:text-cream-100" />
          </Field>
          <Field label="Nombre de rondes" htmlFor="rounds" hint="Vide = déduit du meilleur score.">
            <Input id="rounds" name="rounds" type="number" min={1} defaultValue={defaultRounds ?? ""} />
          </Field>
        </div>
        <div className="flex justify-end">
          <SubmitButton pendingText="Analyse du fichier…">
            <IconUpload size={16} /> Analyser le CSV
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
}
