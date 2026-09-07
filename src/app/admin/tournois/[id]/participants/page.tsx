import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/db/events";
import { listLeaders, toLeaderOptions } from "@/lib/db/leaders";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { currentTimeMs } from "@/lib/clock";
import { formatDateTime } from "@/lib/format";
import { formatEuros } from "@/lib/money";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StatTile";
import { IconDownload } from "@/components/ui/icons";
import ParticipantsTable, { type ParticipantRow } from "@/components/admin/ParticipantsTable";
import CashRegistrationForm from "@/components/admin/CashRegistrationForm";

export const metadata: Metadata = { title: "Participants · Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

type RawRow = {
  id: string;
  status: string;
  participant_name: string;
  participant_email: string;
  participant_phone: string | null;
  notes: string | null;
  payment_provider: string | null;
  amount_cents: number | null;
  created_at: string;
  checked_in_at: string | null;
  expires_at: string | null;
  mollie_sales_invoice_pdf_url: string | null;
  profile: { pseudo: string | null; bandai_member_id: string | null } | null;
  leader: { name: string } | null;
};

export default async function ParticipantsPage({ params }: Props) {
  const { id } = await params;
  const [event, leaders] = await Promise.all([getEventById(id), listLeaders()]);
  if (!event) notFound();

  const admin = createAdminSupabase();
  const { data: raw } = await admin
    .from("registrations")
    .select(
      "id, status, participant_name, participant_email, participant_phone, notes, payment_provider, amount_cents, created_at, checked_in_at, expires_at, mollie_sales_invoice_pdf_url, profile:profiles(pseudo, bandai_member_id), leader:leaders(name)"
    )
    .eq("event_id", event.id)
    .order("created_at", { ascending: true })
    .returns<RawRow[]>();

  const rows: ParticipantRow[] = (raw ?? []).map((r) => ({
    id: r.id,
    status: r.status,
    participant_name: r.participant_name,
    participant_email: r.participant_email,
    participant_phone: r.participant_phone,
    notes: r.notes,
    payment_provider: r.payment_provider,
    amount_cents: r.amount_cents,
    created_at: r.created_at,
    checked_in_at: r.checked_in_at,
    expires_at: r.expires_at,
    pseudo: r.profile?.pseudo ?? null,
    bandai_member_id: r.profile?.bandai_member_id ?? null,
    leader_name: r.leader?.name ?? null,
    invoice_url: r.mollie_sales_invoice_pdf_url,
  }));

  const nowMs = currentTimeMs();
  const paid = rows.filter((r) => r.status === "paid" || r.status === "checked_in").length;
  const present = rows.filter((r) => r.status === "checked_in").length;
  const pendingActive = rows.filter((r) => r.status === "pending_payment" && r.expires_at && new Date(r.expires_at).getTime() > nowMs).length;
  const noAccount = rows.filter((r) => (r.status === "paid" || r.status === "checked_in") && !r.bandai_member_id).length;

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={`/admin/tournois/${event.id}`}
        backLabel="Fiche du tournoi"
        eyebrow={formatDateTime(event.starts_at)}
        title={event.title}
        actions={
          <>
            <Button href={`/api/admin/tournois/${event.id}/participants.csv`} variant="outline" size="sm" external>
              <IconDownload size={14} /> Export CSV
            </Button>
            <Button href={`/admin/tournois/${event.id}/resultats`} variant="outline" size="sm">
              Résultats
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        <StatTile value={event.capacity > 0 ? `${paid} / ${event.capacity}` : paid} label="Inscrits payés" />
        <StatTile value={present} label="Présents (check-in)" />
        <StatTile value={pendingActive} label="Réservations en cours" accent={pendingActive ? "brand" : "gold"} />
        <StatTile value={noAccount} label="Inscrits sans ID Bandai" sub="à surveiller pour l'import des résultats" accent={noAccount ? "brand" : "gold"} />
      </section>

      <CashRegistrationForm eventId={event.id} leaders={toLeaderOptions(leaders)} priceLabel={formatEuros(event.price_cents)} />

      <ParticipantsTable rows={rows} nowMs={nowMs} />
    </div>
  );
}
