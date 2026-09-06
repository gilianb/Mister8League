import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { mollieGetPayment } from "@/lib/payments/mollie";
import { mollieValueToCents } from "@/lib/payments/amounts";
import { fulfilRegistration, markRegistrationPaid } from "@/lib/payments/fulfil";
import type { RegistrationRow } from "@/lib/db/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mollie envoie `id=tr_xxx` (form-urlencoded). On relit toujours le paiement chez Mollie. */
async function extractPaymentId(req: Request): Promise<string | null> {
  const ct = (req.headers.get("content-type") ?? "").toLowerCase();
  const raw = await req.text().catch(() => "");
  if (!raw) return null;
  if (ct.includes("application/x-www-form-urlencoded")) return new URLSearchParams(raw).get("id")?.trim() || null;
  if (ct.includes("application/json")) {
    try {
      const j = JSON.parse(raw) as { id?: string };
      if (typeof j?.id === "string") return j.id.trim();
    } catch {
      // ignoré
    }
  }
  return raw.match(/(tr_[A-Za-z0-9]+)/)?.[1] ?? null;
}

export async function POST(req: Request) {
  const admin = createAdminSupabase();
  try {
    const paymentId = await extractPaymentId(req);
    if (!paymentId) return new NextResponse("ok", { status: 200 });

    const payment = await mollieGetPayment(paymentId);

    const { data: reg } = await admin.from("registrations").select("*").eq("mollie_payment_id", payment.id).maybeSingle<RegistrationRow>();
    if (!reg) return new NextResponse("ok", { status: 200 });

    await admin.from("payment_events").insert({
      registration_id: reg.id,
      provider: "mollie",
      event_type: "webhook",
      provider_ref: payment.id,
      payload: payment,
    });

    if (payment.status !== "paid") {
      const patch: Record<string, unknown> = { mollie_payment_status: payment.status };
      // Paiement définitivement échoué / expiré / annulé : on libère la place.
      if (["canceled", "expired", "failed"].includes(String(payment.status)) && reg.status === "pending_payment") {
        patch.status = "cancelled";
        patch.expires_at = null;
      }
      await admin.from("registrations").update(patch).eq("id", reg.id);
      return new NextResponse("ok", { status: 200 });
    }

    const gotCents = mollieValueToCents(payment.amount?.value);
    const gotCurrency = String(payment.amount?.currency ?? "").toUpperCase();
    const expectedCents = Math.round(Number(reg.amount_cents ?? 0));
    const expectedCurrency = String(reg.currency ?? "EUR").toUpperCase();
    if (gotCents === null || gotCents !== expectedCents || (gotCurrency && gotCurrency !== expectedCurrency)) {
      console.error("[mollie] montant ou devise inattendu", { registrationId: reg.id, expectedCents, gotCents, expectedCurrency, gotCurrency });
      await admin.from("registrations").update({ mollie_payment_status: payment.status }).eq("id", reg.id);
      return new NextResponse("ok", { status: 200 });
    }

    if (reg.status !== "paid" && reg.status !== "checked_in") {
      await markRegistrationPaid(reg.id, { provider: "mollie", paymentStatus: payment.status, eventType: "webhook_paid" });
    }
    const result = await fulfilRegistration(reg.id);
    if (result.warnings.length) console.warn("[mollie] fulfil warnings", { registrationId: reg.id, warnings: result.warnings });

    return new NextResponse("ok", { status: 200 });
  } catch (e) {
    console.error("[mollie] webhook", e);
    return new NextResponse("ok", { status: 200 });
  }
}
