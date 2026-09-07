import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionWithProfile } from "@/lib/auth/session";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { RegistrationRow } from "@/lib/db/types";
import { mollieGetPayment } from "@/lib/payments/mollie";
import { mollieValueToCents } from "@/lib/payments/amounts";
import { fulfilRegistration, markRegistrationPaid } from "@/lib/payments/fulfil";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import PayNowButton from "@/components/PayNowButton";
import { TOURNAMENT_CONTACT_EMAIL, tournamentMailto } from "@/lib/email/senders";
import AutoRefresh from "./AutoRefresh";

export const metadata: Metadata = { title: "Paiement", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ inscription?: string }> };

export default async function RetourPaiementPage({ searchParams }: Props) {
  const { inscription } = await searchParams;
  const { user } = await getSessionWithProfile();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(`/tournois/paiement/retour?inscription=${inscription ?? ""}`)}`);

  const admin = createAdminSupabase();
  const { data: reg } = inscription
    ? await admin.from("registrations").select("*, event:events(slug, title)").eq("id", inscription).maybeSingle<RegistrationRow & { event: { slug: string; title: string } | null }>()
    : { data: null };

  if (!reg || reg.profile_id !== user.id) {
    return (
      <Wrapper>
        <Alert tone="error" title="Inscription introuvable">
          Si vous avez été débité, écrivez-nous à{" "}
          <a href={tournamentMailto()} className="text-link">
            {TOURNAMENT_CONTACT_EMAIL}
          </a>
          .
        </Alert>
      </Wrapper>
    );
  }

  if (reg.status === "paid" || reg.status === "checked_in") redirect(`/tournois/inscription/${reg.id}`);

  let status = reg.mollie_payment_status ?? "open";
  if (reg.status === "pending_payment" && reg.mollie_payment_id) {
    try {
      const payment = await mollieGetPayment(reg.mollie_payment_id);
      status = String(payment.status);
      await admin.from("payment_events").insert({ registration_id: reg.id, provider: "mollie", event_type: "return_check", provider_ref: payment.id, payload: payment });
      await admin.from("registrations").update({ mollie_payment_status: status }).eq("id", reg.id);

      if (status === "paid") {
        const gotCents = mollieValueToCents(payment.amount?.value);
        const gotCurrency = String(payment.amount?.currency ?? "").toUpperCase();
        const okAmount = gotCents !== null && gotCents === Math.round(Number(reg.amount_cents ?? 0));
        const okCurrency = !gotCurrency || gotCurrency === String(reg.currency ?? "EUR").toUpperCase();
        if (okAmount && okCurrency) {
          await markRegistrationPaid(reg.id, { provider: "mollie", paymentStatus: "paid", eventType: "return_paid" });
          try {
            await fulfilRegistration(reg.id);
          } catch (e) {
            console.error("[retour] fulfil", e);
          }
          redirect(`/tournois/inscription/${reg.id}`);
        }
      }
      if (["canceled", "expired", "failed"].includes(status)) {
        await admin.from("registrations").update({ status: "cancelled", expires_at: null }).eq("id", reg.id).eq("status", "pending_payment");
      }
    } catch (e) {
      if (e && typeof e === "object" && "digest" in e) throw e; // redirect()
      console.error("[retour] mollie", e);
    }
  }

  const eventHref = reg.event ? `/tournois/${reg.event.slug}` : "/calendrier";
  const processing = ["open", "pending", "authorized"].includes(status) && reg.status === "pending_payment";

  return (
    <Wrapper>
      {processing ? (
        <Card padding="lg" className="text-center">
          <AutoRefresh seconds={4} />
          <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-gold-400 text-coal-950">
            <Spinner size={20} />
          </div>
          <h1 className="font-display text-2xl font-medium tracking-tight text-cream-100">Paiement en cours de confirmation</h1>
          <p className="mt-2 text-sm leading-relaxed text-cream-400">
            Mollie nous confirme le paiement dans quelques secondes. Cette page se rafraîchit automatiquement.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <PayNowButton registrationId={reg.id} size="sm" />
            <Button href={eventHref} variant="ghost" size="sm">
              Retour au tournoi
            </Button>
          </div>
        </Card>
      ) : (
        <Card padding="lg" className="space-y-5">
          <Alert tone="warn" title="Paiement non abouti">
            Statut Mollie : {status}. Votre place a été libérée. Vous pouvez recommencer l&apos;inscription tant qu&apos;il reste
            des places.
          </Alert>
          <div className="flex flex-wrap gap-2">
            <Button href={eventHref}>Retour au tournoi</Button>
            <Button href="/joueur/inscriptions" variant="ghost">
              Mes inscriptions
            </Button>
          </div>
          <p className="text-[13px] text-cream-500">
            Un doute sur un débit ? Écrivez à{" "}
            <a href={tournamentMailto(reg.event?.title)} className="text-link">
              {TOURNAMENT_CONTACT_EMAIL}
            </a>
            .
          </p>
        </Card>
      )}
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <div className="page-shell max-w-lg py-16 sm:py-24">{children}</div>;
}
