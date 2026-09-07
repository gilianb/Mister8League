import type { Metadata } from "next";
import Link from "next/link";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getSessionWithProfile } from "@/lib/auth/session";
import { hashTicketToken } from "@/lib/tournaments/ticket-token";
import { registrationCode } from "@/lib/tournaments/codes";
import type { TicketStatus } from "@/lib/tournaments/checkin";
import { formatDateLong, formatDateTime, formatTime } from "@/lib/format";
import HatLogo from "@/components/HatLogo";
import { PaperPill } from "@/components/EventCard";
import { Ticket, TicketBody, TicketStub } from "@/components/ui/Ticket";
import CheckInButton from "./CheckInButton";
import { TOURNAMENT_CONTACT_EMAIL, tournamentMailto } from "@/lib/email/senders";
import { currentTimeMs } from "@/lib/clock";

export const metadata: Metadata = { title: "Billet de tournoi", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

type TicketReg = {
  id: string;
  status: string;
  participant_name: string;
  checked_in_at: string | null;
  leader: { name: string } | null;
  event: { slug: string; title: string; starts_at: string; venue_name: string | null; venue_address: string | null; city: string } | null;
};

const LABELS: Record<TicketStatus, { label: string; tone: "good" | "warn" | "bad" | "neutral" }> = {
  valid: { label: "Billet valide", tone: "good" },
  already_checked_in: { label: "Déjà enregistré", tone: "warn" },
  not_paid: { label: "Paiement requis", tone: "bad" },
  expired: { label: "Billet expiré", tone: "neutral" },
  invalid: { label: "Billet invalide", tone: "neutral" },
};

export default async function BilletPage({ params }: Props) {
  const { token } = await params;
  const admin = createAdminSupabase();
  const { data: tokenRow } = await admin
    .from("ticket_tokens")
    .select("registration_id, expires_at")
    .eq("token_hash", hashTicketToken(token))
    .maybeSingle<{ registration_id: string; expires_at: string | null }>();

  let status: TicketStatus = "invalid";
  let reg: TicketReg | null = null;
  if (tokenRow) {
    if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() < currentTimeMs()) {
      status = "expired";
    } else {
      const { data } = await admin
        .from("registrations")
        .select("id, status, participant_name, checked_in_at, leader:leaders(name), event:events(slug, title, starts_at, venue_name, venue_address, city)")
        .eq("id", tokenRow.registration_id)
        .maybeSingle<TicketReg>();
      reg = data ?? null;
      if (reg) {
        if (reg.status === "checked_in" || reg.checked_in_at) status = "already_checked_in";
        else if (reg.status === "paid") status = "valid";
        else status = "not_paid";
      }
    }
  }

  const { profile } = await getSessionWithProfile();
  const isAdmin = profile?.role === "admin";
  const badge = LABELS[status];

  return (
    <div className="page-shell max-w-lg py-10 sm:py-14">
      <Ticket as="section">
        <TicketBody>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <HatLogo className="w-10" />
              <div className="leading-none">
                <p className="font-display text-lg font-semibold text-ink">Mister 8</p>
                <p className="mt-1 text-[11px] font-medium text-poster">Billet de tournoi</p>
              </div>
            </div>
            <PaperPill tone={badge.tone}>{badge.label}</PaperPill>
          </div>

          {reg ? (
            <dl className="mt-6 space-y-5 border-t border-ink/12 pt-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink-600">Numéro d&apos;inscription</dt>
                <dd className="tabular font-semibold text-ink">{registrationCode(reg.id)}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-ink-400">Tournoi</dt>
                <dd className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">{reg.event?.title ?? "—"}</dd>
                {reg.event && (
                  <dd className="mt-1 text-ink-600">
                    {formatDateLong(reg.event.starts_at)}, {formatTime(reg.event.starts_at)}
                    <br />
                    {[reg.event.venue_name, reg.event.venue_address ?? reg.event.city].filter(Boolean).join(", ")}
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-[12px] text-ink-400">Participant</dt>
                <dd className="mt-1 font-semibold text-ink">{reg.participant_name}</dd>
                {reg.leader && <dd className="text-ink-600">Leader déclaré : {reg.leader.name}</dd>}
              </div>
              {reg.checked_in_at && (
                <div className="rounded-control border-l-4 border-emerald-600 bg-emerald-600/10 px-4 py-3 text-emerald-900">
                  Présence confirmée le {formatDateTime(reg.checked_in_at)}.
                </div>
              )}
            </dl>
          ) : (
            <p className="mt-6 border-t border-ink/12 pt-5 text-sm text-ink-600">
              {status === "expired" ? "Ce billet a expiré." : "Ce lien ne correspond à aucun billet connu."}
            </p>
          )}
        </TicketBody>

        <TicketStub>
          {isAdmin && reg ? (
            <div>
              <p className="mb-3 text-[13px] text-ink-600">Outil organisateur : confirmer la présence du joueur.</p>
              <CheckInButton token={token} initialStatus={status} />
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed text-ink-600">
              Vous faites partie de l&apos;organisation ? Connectez-vous avec un compte admin pour valider le check-in. Un problème
              avec ce billet ? Écrivez à{" "}
              <a href={tournamentMailto(reg?.event?.title)} className="font-semibold text-poster underline underline-offset-4">
                {TOURNAMENT_CONTACT_EMAIL}
              </a>
              .
            </p>
          )}
        </TicketStub>
      </Ticket>
      {reg?.event && (
        <p className="mt-5 text-center text-sm">
          <Link href={`/tournois/${reg.event.slug}`} className="text-link">
            Page du tournoi
          </Link>
        </p>
      )}
    </div>
  );
}
