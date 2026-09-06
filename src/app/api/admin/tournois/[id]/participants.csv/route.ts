import { NextResponse } from "next/server";
import { getSessionWithProfile } from "@/lib/auth/session";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { registrationCode } from "@/lib/tournaments/codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  status: string;
  created_at: string;
  participant_name: string;
  participant_email: string;
  participant_phone: string | null;
  payment_provider: string | null;
  amount_cents: number | null;
  checked_in_at: string | null;
  mollie_payment_id: string | null;
  mollie_sales_invoice_number: string | null;
  profile: { pseudo: string | null; bandai_member_id: string | null } | null;
  leader: { name: string; code: string | null } | null;
};

function csvEscape(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[;"\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

/** Export CSV (séparateur ; pour Excel FR) des inscriptions d'un tournoi. Admin uniquement. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { profile } = await getSessionWithProfile();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const { id } = await ctx.params;
  const admin = createAdminSupabase();
  const { data: event } = await admin.from("events").select("slug").eq("id", id).maybeSingle<{ slug: string }>();
  if (!event) return NextResponse.json({ error: "Tournoi introuvable." }, { status: 404 });

  const { data: rows } = await admin
    .from("registrations")
    .select(
      "id, status, created_at, participant_name, participant_email, participant_phone, payment_provider, amount_cents, checked_in_at, mollie_payment_id, mollie_sales_invoice_number, profile:profiles(pseudo, bandai_member_id), leader:leaders(name, code)"
    )
    .eq("event_id", id)
    .order("created_at", { ascending: true })
    .returns<Row[]>();

  const header = ["code", "statut", "cree_le", "nom", "email", "telephone", "pseudo", "id_bandai", "leader", "leader_code", "paiement", "montant_eur", "check_in", "mollie_payment_id", "facture"];
  const lines = [
    header.join(";"),
    ...(rows ?? []).map((r) =>
      [
        registrationCode(r.id),
        r.status,
        r.created_at,
        r.participant_name,
        r.participant_email,
        r.participant_phone,
        r.profile?.pseudo,
        r.profile?.bandai_member_id,
        r.leader?.name,
        r.leader?.code,
        r.payment_provider,
        r.amount_cents != null ? (r.amount_cents / 100).toFixed(2).replace(".", ",") : "",
        r.checked_in_at,
        r.mollie_payment_id,
        r.mollie_sales_invoice_number,
      ]
        .map(csvEscape)
        .join(";")
    ),
  ];

  return new NextResponse(`﻿${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="participants_${event.slug}.csv"`,
    },
  });
}
