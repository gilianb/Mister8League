"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { startCheckoutAction } from "@/lib/tournaments/actions";
import type { ActionState } from "@/lib/auth/actions";
import type { LeaderOption } from "@/lib/db/leaders";
import { computeTotals } from "@/lib/payments/amounts";
import { formatEuros } from "@/lib/money";
import LeaderPicker from "@/components/LeaderPicker";
import { Card } from "@/components/ui/Card";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { IconCreditCard } from "@/components/ui/icons";

type DeckOption = { id: string; name: string; leaderId: string | null; leaderName: string | null };

export default function RegisterForm({
  event,
  profile,
  decks,
  leaders,
}: {
  event: { id: string; slug: string; title: string; price_cents: number; fee_bps: number; currency: string };
  profile: { fullName: string; email: string; phone: string };
  decks: DeckOption[];
  leaders: LeaderOption[];
}) {
  const [state, action] = useActionState(startCheckoutAction, {} as ActionState);
  const [deckId, setDeckId] = useState<string>("");
  const [leaderId, setLeaderId] = useState<string | null>(null);
  const totals = useMemo(() => computeTotals(event.price_cents, event.fee_bps), [event.price_cents, event.fee_bps]);
  const free = totals.totalCents === 0;

  const selectedDeck = decks.find((d) => d.id === deckId) ?? null;
  const effectiveLeader = leaderId ?? selectedDeck?.leaderId ?? null;

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-12">
      <input type="hidden" name="event_id" value={event.id} />
      <input type="hidden" name="event_slug" value={event.slug} />

      <div className="lg:col-span-7 space-y-5">
        {state.error && <Alert tone="error">{state.error}</Alert>}

        <Card className="space-y-4">
          <h2 className="font-display text-lg font-bold text-cream-100">Participant</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom complet" htmlFor="r-name" required error={state.fieldErrors?.participant_name} hint="Tel qu'il apparaîtra sur le billet.">
              <Input id="r-name" name="participant_name" defaultValue={profile.fullName} autoComplete="name" required />
            </Field>
            <Field label="E-mail" htmlFor="r-email" required error={state.fieldErrors?.participant_email} hint="Le billet est envoyé à cette adresse.">
              <Input id="r-email" name="participant_email" type="email" defaultValue={profile.email} autoComplete="email" required />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Téléphone" htmlFor="r-phone" hint="Pour vous joindre le jour J.">
              <Input id="r-phone" name="participant_phone" type="tel" defaultValue={profile.phone} autoComplete="tel" placeholder="06 12 34 56 78" />
            </Field>
            <Field label="Remarque pour l'organisation" htmlFor="r-notes">
              <Textarea id="r-notes" name="notes" rows={2} placeholder="Facultatif" />
            </Field>
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-bold text-cream-100">Deck joué</h2>
            <p className="text-xs text-cream-600 mt-1">
              Facultatif, modifiable jusqu&apos;au début du tournoi. Le leader déclaré alimente le métagame des résultats.
            </p>
          </div>
          {decks.length > 0 && (
            <Field label="Un de mes decks" htmlFor="r-deck">
              <Select id="r-deck" name="deck_id" value={deckId} onChange={(e) => setDeckId(e.target.value)}>
                <option value="">— Aucun deck enregistré —</option>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {d.leaderName ? ` · ${d.leaderName}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <LeaderPicker leaders={leaders} name="leader_id" value={effectiveLeader} onChange={setLeaderId} label={decks.length > 0 ? "Ou simplement le leader" : "Leader"} />
          {decks.length === 0 && (
            <p className="text-xs text-cream-600">
              Astuce : enregistrez vos decks dans{" "}
              <Link href="/joueur/decks" className="text-gold-400 underline">
                Mes decks
              </Link>{" "}
              pour les retrouver à chaque inscription.
            </p>
          )}
        </Card>

        {!free && (
          <Card className="space-y-4">
            <div>
              <h2 className="font-display text-lg font-bold text-cream-100">Adresse de facturation</h2>
              <p className="text-xs text-cream-600 mt-1">Nécessaire pour émettre votre facture.</p>
            </div>
            {state.fieldErrors?.billing && <Alert tone="error">{state.fieldErrors.billing}</Alert>}
            <Field label="Rue et numéro" htmlFor="b-street" required>
              <Input id="b-street" name="billing_street" autoComplete="street-address" placeholder="12 rue de la Marine" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Code postal" htmlFor="b-postal" required>
                <Input id="b-postal" name="billing_postal_code" autoComplete="postal-code" placeholder="92400" required />
              </Field>
              <Field label="Ville" htmlFor="b-city" required>
                <Input id="b-city" name="billing_city" autoComplete="address-level2" placeholder="Courbevoie" required />
              </Field>
              <Field label="Pays (code)" htmlFor="b-country" required hint="FR, BE, CH…">
                <Input id="b-country" name="billing_country" defaultValue="FR" maxLength={2} className="uppercase" autoComplete="country" required />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Société" htmlFor="b-company" hint="Facultatif">
                <Input id="b-company" name="billing_company" autoComplete="organization" />
              </Field>
              <Field label="N° de TVA" htmlFor="b-vat" hint="Facultatif">
                <Input id="b-vat" name="billing_vat" placeholder="FR…" />
              </Field>
            </div>
          </Card>
        )}
      </div>

      <div className="lg:col-span-5">
        <div className="sticky top-20 space-y-4">
          <Card>
            <h2 className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold mb-4">RÉCAPITULATIF</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-cream-400">Tournoi</dt>
                <dd className="font-semibold text-cream-100 text-right">{event.title}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cream-400">Inscription</dt>
                <dd className="text-cream-100 tabular">{formatEuros(totals.subtotalCents, event.currency)}</dd>
              </div>
              {totals.feeCents > 0 && (
                <div className="flex justify-between">
                  <dt className="text-cream-400">Frais de paiement</dt>
                  <dd className="text-cream-100 tabular">{formatEuros(totals.feeCents, event.currency)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t hairline pt-3 mt-3">
                <dt className="font-semibold text-cream-100">Total</dt>
                <dd className="font-display text-2xl font-bold text-gold-400 tabular">{free ? "Gratuit" : formatEuros(totals.totalCents, event.currency)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="space-y-4">
            <Checkbox
              name="accept_rules"
              label={
                <span>
                  J&apos;ai lu le{" "}
                  <Link href="/reglement" target="_blank" className="text-gold-400 underline">
                    règlement de la ligue
                  </Link>{" "}
                  et j&apos;ai saisi ma decklist dans Bandai TCG+.
                </span>
              }
            />
            {state.fieldErrors?.accept_rules && <p className="text-xs text-red-300">{state.fieldErrors.accept_rules}</p>}
            <SubmitButton className="w-full" size="lg" variant="brand" pendingText={free ? "Inscription…" : "Redirection vers Mollie…"}>
              <IconCreditCard size={18} /> {free ? "Confirmer mon inscription" : "Payer avec Mollie"}
            </SubmitButton>
            <p className="text-[11px] text-cream-600">
              {free
                ? "Votre billet vous sera envoyé par e-mail immédiatement."
                : "Paiement sécurisé (carte, Apple Pay, Bancontact…). Vous recevrez votre billet PDF et votre facture par e-mail."}
            </p>
          </Card>
        </div>
      </div>
    </form>
  );
}
