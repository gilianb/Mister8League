import type { Metadata } from "next";
import Link from "next/link";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getSessionWithProfile } from "@/lib/auth/session";
import { hashTicketToken } from "@/lib/tournaments/ticket-token";
import { registrationCode } from "@/lib/tournaments/codes";
import type { TicketStatus } from "@/lib/tournaments/checkin";
import { formatDateLong, formatDateTime, formatTime } from "@/lib/format";
import HatLogo from "@/components/HatLogo";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
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

const LABELS: Record<TicketStatus, { label: string; tone: BadgeTone }> = {
  valid: { label: "Billet valide", tone: "good" },
  already_checked_in: { label: "Déjà enregistré", tone: "gold" },
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
    <div className="mx-auto max-w-lg px-4 py-10">
      <Card className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <HatLogo className="w-9" />
            <div className="leading-none">
              <p className="font-display font-bold text-cream-100">MISTER 8</p>
              <p className="text-[9px] tracking-[0.28em] text-gold-400 font-semibold">BILLET DE TOURNOI</p>
            </div>
          </div>
          <Badge tone={badge.tone}>{badge.label}</Badge>
        </div>

        {reg ? (
          <>
            <div className="rounded-xl bg-coal-900 px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-cream-600">N° d&apos;inscription</span>
              <span className="font-mono font-bold text-cream-100">{registrationCode(reg.id)}</span>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] text-cream-600 font-semibold">TOURNOI</p>
              <p className="font-display text-lg font-bold text-cream-100">{reg.event?.title ?? "—"}</p>
              {reg.event && (
                <p className="text-sm text-cream-400">
                  {formatDateLong(reg.event.starts_at)} · {formatTime(reg.event.starts_at)}
                  <br />
                  {[reg.event.venue_name, reg.event.venue_address ?? reg.event.city].filter(Boolean).join(" — ")}
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] text-cream-600 font-semibold">PARTICIPANT</p>
              <p className="font-semibold text-cream-100">{reg.participant_name}</p>
              {reg.leader && <p className="text-sm text-cream-400">Leader déclaré : {reg.leader.name}</p>}
            </div>
            {reg.checked_in_at && (
              <p className="rounded-xl bg-emerald-400/10 border border-emerald-400/30 px-4 py-3 text-sm text-emerald-200">
                Présence confirmée le {formatDateTime(reg.checked_in_at)}.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-cream-400">
            {status === "expired" ? "Ce billet a expiré." : "Ce lien ne correspond à aucun billet connu."}
          </p>
        )}

        {isAdmin && reg ? (
          <div className="border-t hairline pt-5">
            <p className="text-xs text-cream-600 mb-3">Outil organisateur : confirmer la présence du joueur.</p>
            <CheckInButton token={token} initialStatus={status} />
          </div>
        ) : (
          <p className="text-xs text-cream-600 border-t hairline pt-4">
            Vous faites partie de l&apos;organisation ? Connectez-vous avec un compte admin pour valider le check-in. Un
            problème avec ce billet ? Écrivez à{" "}
            <a href={tournamentMailto(reg?.event?.title)} className="text-gold-400 underline">
              {TOURNAMENT_CONTACT_EMAIL}
            </a>
            .
          </p>
        )}
      </Card>
      {reg?.event && (
        <p className="mt-4 text-center text-xs text-cream-600">
          <Link href={`/tournois/${reg.event.slug}`} className="hover:text-gold-400">
            Page du tournoi →
          </Link>
        </p>
      )}
    </div>
  );
}
