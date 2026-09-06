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
import { IconTicket } from "@/components/ui/icons";
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

  const Row = ({ r }: { r: (typeof regs)[number] }) => (
    <li className="py-4 flex flex-wrap items-center gap-x-5 gap-y-2">
      <div className="flex-1 min-w-52">
        <Link href={`/tournois/${r.event.slug}`} className="font-medium text-cream-100 hover:text-gold-400">
          {r.event.title}
        </Link>
        <p className="text-xs text-cream-600">
          {formatDateShort(r.event.starts_at)} · {formatTime(r.event.starts_at)} · {registrationCode(r.id)}
          {r.amount_cents ? ` · ${formatEuros(r.amount_cents, r.currency ?? "EUR")}` : ""}
          {r.leader ? ` · ${r.leader.name}` : ""}
        </p>
      </div>
      <Badge tone={TONES[r.status] ?? "neutral"}>{registrationStatusLabel(r.status)}</Badge>
      {isPaidStatus(r.status) && (
        <Button href={`/tournois/inscription/${r.id}`} variant="outline" size="sm">
          <IconTicket size={14} /> Billet
        </Button>
      )}
      {r.status === "pending_payment" && isActiveRegistration(r, nowMs) && <PayNowButton registrationId={r.id} size="sm" />}
    </li>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-100">Mes inscriptions</h1>
        <p className="text-sm text-cream-400 mt-1">Vos billets, paiements en attente et historique d&apos;inscriptions.</p>
      </div>

      <section>
        <h2 className="text-[11px] tracking-[0.2em] text-gold-400 font-semibold mb-2">À VENIR</h2>
        {upcoming.length === 0 ? (
          <EmptyState compact title="Aucune inscription à venir" action={<Button href="/calendrier">Voir les tournois</Button>} />
        ) : (
          <ul className="divide-y hairline border-y hairline">
            {upcoming.map((r) => (
              <Row key={r.id} r={r} />
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold mb-2">HISTORIQUE</h2>
          <ul className="divide-y hairline border-y hairline">
            {past.map((r) => (
              <Row key={r.id} r={r} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
