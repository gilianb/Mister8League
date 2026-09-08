import type { Metadata } from "next";
import Link from "next/link";
import { getMyRegistrations } from "@/lib/db/registrations";
import { formatDateShort, formatTime } from "@/lib/format";
import { formatEuros } from "@/lib/money";
import { registrationCode } from "@/lib/tournaments/codes";
import { isActiveRegistration, isPaidStatus, registrationStatusLabel } from "@/lib/tournaments/status";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { IconCards, IconTicket } from "@/components/ui/icons";
import PayNowButton from "@/components/PayNowButton";
import { currentTimeMs } from "@/lib/clock";

export const metadata: Metadata = { title: "Mes inscriptions", robots: { index: false } };
export const dynamic = "force-dynamic";

const TONES: Record<string, BadgeTone> = { paid: "good", checked_in: "gold", pending_payment: "warn", cancelled: "neutral", refunded: "neutral" };

export default async function InscriptionsPage() {
  const regs = await getMyRegistrations();
  const nowMs = currentTimeMs();
  const upcoming = regs.filter((r) => isActiveRegistration(r, nowMs) && new Date(r.event.starts_at).getTime() > nowMs - 12 * 3_600_000);
  const past = regs.filter((r) => !upcoming.includes(r));

  const Row = ({ r }: { r: (typeof regs)[number] }) => {
    const declarable = isPaidStatus(r.status) && new Date(r.event.starts_at).getTime() > nowMs;
    return (
      <li className="flex flex-wrap items-center gap-x-5 gap-y-3 py-4">
        <div className="min-w-52 flex-1">
          <Link href={`/tournois/${r.event.slug}`} className="font-display text-xl font-medium tracking-tight text-cream-100 transition-colors hover:text-gold-300">
            {r.event.title}
          </Link>
          <p className="tabular mt-1 text-[13px] text-cream-500">
            {formatDateShort(r.event.starts_at)}, {formatTime(r.event.starts_at)}
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            {registrationCode(r.id)}
            {r.amount_cents ? `, ${formatEuros(r.amount_cents, r.currency ?? "EUR")}` : ""}
            {r.leader && `, leader ${r.leader.name}`}
            {!r.leader && declarable && <span className="text-gold-400">, leader à déclarer</span>}
          </p>
        </div>
        <Badge tone={TONES[r.status] ?? "neutral"}>{registrationStatusLabel(r.status)}</Badge>
        {isPaidStatus(r.status) && (
          <Button href={`/tournois/inscription/${r.id}`} variant="outline" size="sm">
            {declarable ? <IconCards size={14} /> : <IconTicket size={14} />}
            {declarable ? "Billet et leader" : "Billet"}
          </Button>
        )}
        {r.status === "pending_payment" && isActiveRegistration(r, nowMs) && <PayNowButton registrationId={r.id} size="sm" />}
      </li>
    );
  };

  return (
    <div className="space-y-10">
      <PageHeader size="md" className="mb-0" title="Mes inscriptions" lede="Vos billets, vos paiements en attente et l'historique de vos inscriptions." />

      <section>
        <SectionHeading title="À venir" />
        <div className="mt-4">
          {upcoming.length === 0 ? (
            <EmptyState compact title="Aucune inscription à venir" action={<Button href="/calendrier">Voir les tournois</Button>} />
          ) : (
            <ul className="divide-y divide-hairline border-y hairline">
              {upcoming.map((r) => (
                <Row key={r.id} r={r} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section>
          <SectionHeading title="Historique" />
          <ul className="mt-4 divide-y divide-hairline border-y hairline">
            {past.map((r) => (
              <Row key={r.id} r={r} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
