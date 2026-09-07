"use client";

import { useActionState } from "react";
import { saveDeckAction } from "@/lib/decks/actions";
import type { ActionState } from "@/lib/auth/actions";
import type { LeaderOption } from "@/lib/db/leaders";
import LeaderPicker from "@/components/LeaderPicker";
import { Card } from "@/components/ui/Card";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Button } from "@/components/ui/Button";

type DeckInput = { id: string; name: string; leader_id: string | null; decklist_text: string; notes: string; is_public: boolean };

export default function DeckForm({ leaders, deck }: { leaders: LeaderOption[]; deck: DeckInput | null }) {
  const [state, action] = useActionState(saveDeckAction, {} as ActionState);
  return (
    <Card padding="lg">
      <form action={action} className="space-y-5">
        {deck && <input type="hidden" name="id" value={deck.id} />}
        <h2 className="font-display text-xl font-medium tracking-tight text-cream-100">{deck ? "Modifier le deck" : "Nouveau deck"}</h2>
        {state.error && <Alert tone="error">{state.error}</Alert>}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nom du deck" htmlFor="d-name" required error={state.fieldErrors?.name}>
            <Input id="d-name" name="name" defaultValue={deck?.name ?? ""} placeholder="Zoro rouge aggro" required maxLength={80} />
          </Field>
          <LeaderPicker leaders={leaders} name="leader_id" defaultValue={deck?.leader_id ?? null} />
        </div>
        <Field label="Decklist" htmlFor="d-list" hint="Collez votre liste (export Bandai TCG+, OPTCG Sim, texte libre…).">
          <Textarea id="d-list" name="decklist_text" defaultValue={deck?.decklist_text ?? ""} rows={8} className="font-mono text-xs" placeholder={"1xOP01-001\n4xOP01-016\n…"} />
        </Field>
        <Field label="Notes" htmlFor="d-notes" hint="Plan de jeu, matchups, idées d'amélioration.">
          <Textarea id="d-notes" name="notes" defaultValue={deck?.notes ?? ""} rows={2} />
        </Field>
        <Checkbox name="is_public" defaultChecked={deck?.is_public ?? true} label="Visible sur mon profil public" />
        <div className="flex justify-end gap-2 border-t hairline pt-5">
          {deck && (
            <Button href="/joueur/decks" variant="ghost">
              Annuler
            </Button>
          )}
          <SubmitButton pendingText="Enregistrement…">{deck ? "Enregistrer" : "Ajouter le deck"}</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
