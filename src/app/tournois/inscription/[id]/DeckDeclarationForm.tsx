"use client";

import { useActionState, useState } from "react";
import { updateRegistrationDeckAction } from "@/lib/tournaments/actions";
import type { ActionState } from "@/lib/auth/actions";
import type { LeaderOption } from "@/lib/db/leaders";
import LeaderPicker from "@/components/LeaderPicker";
import { Field, Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";

type DeckOption = { id: string; name: string; leaderId: string | null; leaderName: string | null };

export default function DeckDeclarationForm({
  registrationId,
  currentDeckId,
  currentLeaderId,
  decks,
  leaders,
}: {
  registrationId: string;
  currentDeckId: string | null;
  currentLeaderId: string | null;
  decks: DeckOption[];
  leaders: LeaderOption[];
}) {
  const [state, action] = useActionState(updateRegistrationDeckAction, {} as ActionState);
  const [deckId, setDeckId] = useState(currentDeckId ?? "");
  const [leaderId, setLeaderId] = useState<string | null>(currentLeaderId);
  const selectedDeck = decks.find((d) => d.id === deckId) ?? null;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="registration_id" value={registrationId} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.message}</Alert>}
      {decks.length > 0 && (
        <Field label="Un de mes decks" htmlFor="dd-deck">
          <Select id="dd-deck" name="deck_id" value={deckId} onChange={(e) => setDeckId(e.target.value)}>
            <option value="">— Aucun —</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {d.leaderName ? ` · ${d.leaderName}` : ""}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <LeaderPicker leaders={leaders} name="leader_id" value={leaderId ?? selectedDeck?.leaderId ?? null} onChange={setLeaderId} />
      <SubmitButton variant="outline" size="sm" pendingText="Enregistrement…">
        Enregistrer
      </SubmitButton>
    </form>
  );
}
