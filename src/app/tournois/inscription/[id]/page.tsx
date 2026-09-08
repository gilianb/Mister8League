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
import { Alert } from "@/components/ui/Alert";
import { Ticket, TicketBody, TicketStub } from "@/components/ui/Ticket";
import { PaperPill } from "@/components/EventCard";
import { IconChevronLeft, IconDownload } from "@/components/ui/icons";
import PayNowButton from "@/components/PayNowButton";
import HatLogo from "@/components/HatLogo";
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
  const paymentLabel =
    reg.payment_provider === "mollie" ? "En ligne, via Mollie" : reg.payment_provider === "cash" ? "En boutique" : reg.payment_provider === "free" ? "Gratuit" : "—";

  return (
    <div className="page-shell max-w-3xl py-10 sm:py-14">
      <Link href="/joueur/inscriptions" className="inline-flex items-center gap-1 text-sm text-cream-500 transition-colors hover:text-gold-300">
        <IconChevronLeft size={16} /> Mes inscriptions
      </Link>

      {msg === "deck" && (
        <Alert tone="success" className="mt-5">
          Deck déclaré mis à jour.
        </Alert>
      )}

      <Ticket as="section" className="mt-6">
        <TicketBody className="p-7 sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <HatLogo className="w-10" />
              <p className="kicker text-poster">{paid ? "Billet de tournoi" : "Inscription"}</p>
            </div>
            <p className="tabular text-sm font-semibold text-ink-600">{registrationCode(reg.id)}</p>
          </div>
          <h1 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-4xl">{event.title}</h1>

          <dl className="mt-7 grid gap-x-8 gap-y-5 border-t border-ink/12 pt-6 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[12px] text-ink-400">Date</dt>
              <dd className="mt-1 font-medium text-ink">
                {formatDateLong(event.starts_at)}
                <span className="block font-normal text-ink-600">Ouverture des portes à {formatTime(event.starts_at)}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-ink-400">Lieu</dt>
              <dd className="mt-1 font-medium text-ink">
                {event.venue_name ?? "Mister 8 TCG"}
                <span className="block whitespace-pre-line font-normal text-ink-600">{event.venue_address ?? event.city}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-ink-400">Participant</dt>
              <dd className="mt-1 font-medium text-ink">
                {reg.participant_name}
                <span className="block font-normal text-ink-600">{reg.participant_email}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-ink-400">Paiement</dt>
              <dd className="mt-1 font-medium text-ink">
                {formatEuros(reg.amount_cents ?? 0, reg.currency ?? "EUR")}
                <span className="block font-normal text-ink-600">{paymentLabel}</span>
              </dd>
            </div>
            {reg.leader && (
              <div>
                <dt className="text-[12px] text-ink-400">Leader déclaré</dt>
                <dd className="mt-1 font-medium text-ink">{reg.leader.name}</dd>
              </div>
            )}
          </dl>
        </TicketBody>

        <TicketStub className="flex flex-wrap items-center justify-between gap-4 px-7 py-6 sm:px-9">
          <PaperPill tone={paid ? "good" : pending ? "warn" : "neutral"}>{registrationStatusLabel(reg.status)}</PaperPill>
          <div className="flex flex-wrap items-center gap-3">
            {paid && (
              <Button href={`/api/billets/${reg.id}/pdf`} variant="paper" size="lg" external>
                <IconDownload size={18} /> Télécharger mon billet
              </Button>
            )}
            {pending && <PayNowButton registrationId={reg.id} size="lg" />}
            {reg.mollie_sales_invoice_pdf_url && (
              <a href={reg.mollie_sales_invoice_pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-poster underline underline-offset-4">
                Facture
              </a>
            )}
          </div>
        </TicketStub>
      </Ticket>

      {paid && (
        <p className="mt-5 text-sm leading-relaxed text-cream-400">
          Le billet a aussi été envoyé par e-mail. Présentez le QR code à l&apos;accueil, arrivez 30 minutes avant le début pour
          l&apos;enregistrement Bandai TCG+ et vérifiez que votre decklist est saisie dans l&apos;application.
        </p>
      )}

      {paid && !started && (
        <section className="surface-panel mt-8 p-6 sm:p-7">
          <h2 className="font-display text-xl font-medium tracking-tight text-cream-100">Deck et leader</h2>
          <p className="mt-1 mb-5 text-[13px] leading-relaxed text-cream-500">
            Modifiables autant de fois que vous voulez, jusqu&apos;au début du tournoi. Le leader déclaré
            préremplit vos résultats et alimente le métagame du tournoi.
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

      <p className="mt-8 text-[13px] leading-relaxed text-cream-500">
        Une question sur cette inscription ? Écrivez à{" "}
        <a href={tournamentMailto(event.title)} className="text-link">
          {TOURNAMENT_CONTACT_EMAIL}
        </a>
        . Les conditions de remboursement sont dans le{" "}
        <Link href="/reglement" className="text-link">
          règlement
        </Link>
        . Vous pouvez aussi revenir à la{" "}
        <Link href={`/tournois/${event.slug}`} className="text-link">
          page du tournoi
        </Link>
        .
      </p>
    </div>
  );
}
