"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { startCheckoutAction } from "@/lib/tournaments/actions";
import type { ActionState } from "@/lib/auth/actions";
import type { LeaderOption } from "@/lib/db/leaders";
import { computeTotals } from "@/lib/payments/amounts";
import { formatEuros } from "@/lib/money";
import { formatDateLong, formatTime } from "@/lib/format";
import LeaderPicker from "@/components/LeaderPicker";
import { Card } from "@/components/ui/Card";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Ticket, TicketBody, TicketStub } from "@/components/ui/Ticket";
import { IconCreditCard } from "@/components/ui/icons";

type DeckOption = { id: string; name: string; leaderId: string | null; leaderName: string | null };

function FormSection({ title, hint, children }: { title: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-medium tracking-tight text-cream-100">{title}</h2>
        {hint && <p className="mt-1 text-[13px] leading-relaxed text-cream-500">{hint}</p>}
      </div>
      {children}
    </Card>
  );
}

export default function RegisterForm({
  event,
  profile,
  decks,
  leaders,
}: {
  event: { id: string; slug: string; title: string; price_cents: number; fee_bps: number; currency: string; starts_at: string; venue: string };
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
    <form action={action} className="grid gap-8 lg:grid-cols-12">
      <input type="hidden" name="event_id" value={event.id} />
      <input type="hidden" name="event_slug" value={event.slug} />

      <div className="space-y-5 lg:col-span-7">
        {state.error && <Alert tone="error">{state.error}</Alert>}

        <FormSection title="Participant">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nom complet" htmlFor="r-name" required error={state.fieldErrors?.participant_name} hint="Tel qu'il apparaîtra sur le billet.">
              <Input id="r-name" name="participant_name" defaultValue={state.values?.participant_name ?? profile.fullName} autoComplete="name" required />
            </Field>
            <Field label="E-mail" htmlFor="r-email" required error={state.fieldErrors?.participant_email} hint="Le billet est envoyé à cette adresse.">
              <Input id="r-email" name="participant_email" type="email" defaultValue={state.values?.participant_email ?? profile.email} autoComplete="email" required />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Téléphone" htmlFor="r-phone" hint="Pour vous joindre le jour J.">
              <Input id="r-phone" name="participant_phone" type="tel" defaultValue={state.values?.participant_phone ?? profile.phone} autoComplete="tel" placeholder="06 12 34 56 78" />
            </Field>
            <Field label="Remarque pour l'organisation" htmlFor="r-notes">
              <Textarea id="r-notes" name="notes" rows={2} className="min-h-11" placeholder="Facultatif" defaultValue={state.values?.notes ?? ""} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Deck joué" hint="Facultatif, modifiable jusqu'au début du tournoi. Le leader déclaré alimente le métagame des résultats.">
          {decks.length > 0 && (
            <Field label="Un de mes decks" htmlFor="r-deck">
              <Select id="r-deck" name="deck_id" value={deckId} onChange={(e) => setDeckId(e.target.value)}>
                <option value="">Aucun deck enregistré</option>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {d.leaderName ? ` (${d.leaderName})` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <LeaderPicker leaders={leaders} name="leader_id" value={effectiveLeader} onChange={setLeaderId} label={decks.length > 0 ? "Ou simplement le leader" : "Leader"} />
          {decks.length === 0 && (
            <p className="text-[13px] text-cream-500">
              Enregistrez vos decks dans{" "}
              <Link href="/joueur/decks" className="text-link">
                Mes decks
              </Link>{" "}
              pour les retrouver à chaque inscription.
            </p>
          )}
        </FormSection>

        {!free && (
          <FormSection title="Adresse de facturation" hint="Nécessaire pour émettre votre facture.">
            {state.fieldErrors?.billing && <Alert tone="error">{state.fieldErrors.billing}</Alert>}
            <Field label="Rue et numéro" htmlFor="b-street" required>
              <Input id="b-street" name="billing_street" autoComplete="street-address" placeholder="12 rue de la Marine" required defaultValue={state.values?.billing_street ?? ""} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Code postal" htmlFor="b-postal" required>
                <Input id="b-postal" name="billing_postal_code" autoComplete="postal-code" placeholder="92400" required defaultValue={state.values?.billing_postal_code ?? ""} />
              </Field>
              <Field label="Ville" htmlFor="b-city" required>
                <Input id="b-city" name="billing_city" autoComplete="address-level2" placeholder="Courbevoie" required defaultValue={state.values?.billing_city ?? ""} />
              </Field>
              <Field label="Pays" htmlFor="b-country" required hint="Code à deux lettres : FR, BE, CH…">
                <Input id="b-country" name="billing_country" defaultValue={state.values?.billing_country ?? "FR"} maxLength={2} className="uppercase" autoComplete="country" required />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Société" htmlFor="b-company" hint="Facultatif">
                <Input id="b-company" name="billing_company" autoComplete="organization" defaultValue={state.values?.billing_company ?? ""} />
              </Field>
              <Field label="Numéro de TVA" htmlFor="b-vat" hint="Facultatif">
                <Input id="b-vat" name="billing_vat" placeholder="FR…" defaultValue={state.values?.billing_vat ?? ""} />
              </Field>
            </div>
          </FormSection>
        )}
      </div>

      <div className="lg:col-span-5">
        <Ticket as="div" className="sticky top-24">
          <TicketBody>
            <p className="kicker text-poster">Votre place</p>
            <h2 className="mt-2 font-display text-2xl font-semibold leading-tight tracking-[-0.015em] text-ink">{event.title}</h2>
            <p className="mt-2 text-sm text-ink-600">
              {formatDateLong(event.starts_at)}, {formatTime(event.starts_at)}
            </p>
            <p className="text-sm text-ink-600">{event.venue}</p>
            <dl className="mt-6 space-y-2 border-t border-ink/12 pt-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-600">Inscription</dt>
                <dd className="tabular font-medium text-ink">{formatEuros(totals.subtotalCents, event.currency)}</dd>
              </div>
              {totals.feeCents > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-600">Frais de paiement</dt>
                  <dd className="tabular font-medium text-ink">{formatEuros(totals.feeCents, event.currency)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4 border-t border-ink/12 pt-3">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="display-number text-3xl text-ink">{free ? "Gratuit" : formatEuros(totals.totalCents, event.currency)}</dd>
              </div>
            </dl>
          </TicketBody>
          <TicketStub className="space-y-4">
            <Checkbox
              tone="paper"
              name="accept_rules"
              label={
                <span>
                  J&apos;ai lu le{" "}
                  <Link href="/reglement" target="_blank" className="font-semibold text-poster underline underline-offset-4">
                    règlement de la ligue
                  </Link>{" "}
                  et j&apos;ai saisi ma decklist dans Bandai TCG+.
                </span>
              }
            />
            {state.fieldErrors?.accept_rules && <p className="text-[13px] text-poster">{state.fieldErrors.accept_rules}</p>}
            <SubmitButton className="w-full" size="lg" variant="brand" pendingText={free ? "Inscription…" : "Redirection vers Mollie…"}>
              <IconCreditCard size={18} /> {free ? "Confirmer mon inscription" : "Payer avec Mollie"}
            </SubmitButton>
            <p className="text-[12px] leading-relaxed text-ink-600">
              {free
                ? "Votre billet vous sera envoyé par e-mail immédiatement."
                : "Paiement sécurisé par Mollie (carte, Apple Pay, Bancontact). Vous recevrez votre billet PDF et votre facture par e-mail."}
            </p>
          </TicketStub>
        </Ticket>
      </div>
    </form>
  );
}
