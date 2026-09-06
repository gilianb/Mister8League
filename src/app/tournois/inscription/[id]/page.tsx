import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionWithProfile } from "@/lib/auth/session";
import { getMyRegistrationById } from "@/lib/db/registrations";
import { listMyDecks } from "@/lib/db/decks";
import { listLeaders, toLeaderOptions } from "@/lib/db/leaders";
import { registrationCode } from "@/lib/tournaments/codes";
import { registrationStatusLabel } from "@/lib/tournaments/status";
import { formatDateLong, formatTime } from "@/lib/format";
import { formatEuros } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { IconDownload } from "@/components/ui/icons";
import PayNowButton from "@/components/PayNowButton";
import { TOURNAMENT_CONTACT_EMAIL, tournamentMailto } from "@/lib/email/senders";
import DeckDeclarationForm from "./DeckDeclarationForm";
import { currentTimeMs } from "@/lib/clock";

export const metadata: Metadata = { title: "Mon inscription", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> };

export default async function InscriptionConfirmationPage({ params, searchParams }: Props) {
  const [{ id }, { msg }] = await Promise.all([params, searchParams]);
  const { user } = await getSessionWithProfile();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(`/tournois/inscription/${id}`)}`);

  const reg = await getMyRegistrationById(id);
  if (!reg) notFound();
  const event = reg.event;
  const paid = reg.status === "paid" || reg.status === "checked_in";
  const pending = reg.status === "pending_payment";
  const started = new Date(event.starts_at).getTime() <= currentTimeMs();

  const [decks, leaders] = paid && !started ? await Promise.all([listMyDecks(), listLeaders()]) : [[], []];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/joueur/inscriptions" className="text-sm text-cream-600 hover:text-gold-400">
        ← Mes inscriptions
      </Link>

      {msg === "deck" && (
        <Alert tone="success" className="mt-4">
          Deck déclaré mis à jour.
        </Alert>
      )}

      <section className="mt-6 bg-paper text-ink poster-frame p-6 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-[10px] tracking-[0.28em] text-poster font-extrabold">
            {paid ? "BILLET DE TOURNOI" : "INSCRIPTION"} · {registrationCode(reg.id)}
          </p>
          <Badge tone={paid ? "good" : pending ? "warn" : "neutral"}>{registrationStatusLabel(reg.status)}</Badge>
        </div>
        <h1 className="font-poster text-3xl sm:text-4xl mt-4 leading-tight">{event.title}</h1>
        <p className="text-gold-600 tracking-[0.5em] my-5" aria-hidden="true">
          ✦ ✦ ✦
        </p>
        <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-ink-400 text-[10px] tracking-[0.2em] font-bold">DATE</dt>
            <dd className="font-semibold">
              {formatDateLong(event.starts_at)} · {formatTime(event.starts_at)}
            </dd>
          </div>
          <div>
            <dt className="text-ink-400 text-[10px] tracking-[0.2em] font-bold">LIEU</dt>
            <dd className="font-semibold">{[event.venue_name, event.venue_address ?? event.city].filter(Boolean).join(" — ")}</dd>
          </div>
          <div>
            <dt className="text-ink-400 text-[10px] tracking-[0.2em] font-bold">PARTICIPANT</dt>
            <dd className="font-semibold">
              {reg.participant_name}
              <span className="block text-ink-600 font-normal">{reg.participant_email}</span>
            </dd>
          </div>
          <div>
            <dt className="text-ink-400 text-[10px] tracking-[0.2em] font-bold">PAIEMENT</dt>
            <dd className="font-semibold">
              {formatEuros(reg.amount_cents ?? 0, reg.currency ?? "EUR")}
              <span className="block text-ink-600 font-normal">
                {reg.payment_provider === "mollie" ? "En ligne (Mollie)" : reg.payment_provider === "cash" ? "En boutique" : reg.payment_provider === "free" ? "Gratuit" : "—"}
              </span>
            </dd>
          </div>
          {reg.leader && (
            <div>
              <dt className="text-ink-400 text-[10px] tracking-[0.2em] font-bold">LEADER DÉCLARÉ</dt>
              <dd className="font-semibold">{reg.leader.name}</dd>
            </div>
          )}
        </dl>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {paid && (
            <Button href={`/api/billets/${reg.id}/pdf`} variant="paper" size="lg" external>
              <IconDownload size={18} /> TÉLÉCHARGER MON BILLET
            </Button>
          )}
          {pending && <PayNowButton registrationId={reg.id} size="lg" />}
          <Link href={`/tournois/${event.slug}`} className="text-sm font-semibold text-poster underline underline-offset-4">
            Page du tournoi
          </Link>
        </div>
        {paid && (
          <p className="mt-4 text-xs text-ink-600">
            Le billet a aussi été envoyé par e-mail. Présentez le QR code à l&apos;accueil, arrivez 30 minutes avant le
            début pour l&apos;enregistrement Bandai TCG+, et vérifiez que votre decklist est saisie dans l&apos;app.
          </p>
        )}
        {reg.mollie_sales_invoice_pdf_url && (
          <p className="mt-2 text-xs text-ink-600">
            <a href={reg.mollie_sales_invoice_pdf_url} target="_blank" rel="noopener noreferrer" className="underline">
              Télécharger la facture
            </a>
          </p>
        )}
      </section>

      {paid && !started && (
        <section className="mt-6 rounded-2xl border hairline bg-coal-800 p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-cream-100">Deck déclaré</h2>
          <p className="text-xs text-cream-600 mt-1 mb-4">
            Modifiable jusqu&apos;au début du tournoi. Il sert à préremplir le leader dans les résultats.
          </p>
          <DeckDeclarationForm
            registrationId={reg.id}
            currentDeckId={reg.deck_id}
            currentLeaderId={reg.leader_id}
            decks={decks.map((d) => ({ id: d.id, name: d.name, leaderId: d.leader_id, leaderName: d.leader?.name ?? null }))}
            leaders={toLeaderOptions(leaders)}
          />
        </section>
      )}

      <p className="mt-6 text-xs text-cream-600">
        Une question sur cette inscription ? Écrivez à{" "}
        <a href={tournamentMailto(event.title)} className="text-gold-400 underline">
          {TOURNAMENT_CONTACT_EMAIL}
        </a>{" "}
        (tournois uniquement). Conditions de remboursement : voir le{" "}
        <Link href="/reglement" className="underline">
          règlement
        </Link>
        .
      </p>
    </div>
  );
}
