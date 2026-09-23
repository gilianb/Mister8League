"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateLeaderAction } from "@/lib/admin/leaders";
import type { ActionState } from "@/lib/auth/actions";
import { LEADER_COLORS, LEADER_COLOR_HEX } from "@/lib/leaders/storage";
import { Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default function LeaderEditForm({ id, name, colors }: { id: string; name: string; colors: string[] }) {
  const router = useRouter();
  const [state, action] = useActionState(
    async (prev: ActionState, fd: FormData) => {
      const res = await updateLeaderAction(prev, fd);
      if (res.ok) router.refresh();
      return res;
    },
    {} as ActionState
  );
  return (
    <form action={action} className="mt-2 space-y-2">
      <input type="hidden" name="id" value={id} />
      <Input name="name" defaultValue={state.values?.name ?? name} aria-label="Nom du leader" invalid={Boolean(state.fieldErrors?.name)} className="h-9 text-sm" />
      <fieldset className="flex flex-wrap gap-x-3 gap-y-1">
        <legend className="sr-only">Couleurs</legend>
        {LEADER_COLORS.map((c) => (
          <label key={c} className="inline-flex items-center gap-1 text-xs text-cream-300">
            <input type="checkbox" name="colors" value={c} defaultChecked={colors.includes(c)} className="accent-gold-400" />
            <span className="inline-block size-2 rounded-full border border-black/30" style={{ background: LEADER_COLOR_HEX[c] }} />
            {c}
          </label>
        ))}
      </fieldset>
      <div className="flex items-center justify-between gap-2">
        <span className={state.error ? "text-xs text-red-300" : "text-xs text-emerald-300"}>{state.error ?? (state.ok ? state.message : "")}</span>
        <SubmitButton size="sm" variant="outline" pendingText="…">
          Enregistrer
        </SubmitButton>
      </div>
    </form>
  );
}
