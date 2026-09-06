import "server-only";
import createMollieClient from "@mollie/api-client";
import { requireEnv } from "@/lib/env";

export type MolliePaymentStatus = "open" | "canceled" | "pending" | "authorized" | "paid" | "expired" | "failed";

export type MolliePayment = {
  id: string;
  status: MolliePaymentStatus | string;
  amount?: { value?: string; currency?: string };
  method?: string | null;
  metadata?: Record<string, unknown> | null;
  _links?: { checkout?: { href?: string } };
};

export function humanizeMollieError(message: string): string {
  const m = String(message || "").toLowerCase();
  if (m.includes("unauthorized") || m.includes("authentication") || m.includes("api key")) {
    return "Le paiement n'est pas correctement configuré. Contactez-nous.";
  }
  return "Impossible de démarrer le paiement Mollie. Réessayez plus tard ou contactez-nous.";
}

function client() {
  return createMollieClient({ apiKey: requireEnv("MOLLIE_API_KEY") });
}

export function mollieCheckoutUrl(p: MolliePayment | null | undefined): string | null {
  const href = p?._links?.checkout?.href;
  return typeof href === "string" && href.trim() ? href.trim() : null;
}

export function isMollieResumable(status: string | undefined): boolean {
  return ["open", "pending", "authorized"].includes(String(status || ""));
}

export async function mollieCreatePayment(params: {
  amountValue: string; // "36.75"
  currency: string; // "EUR"
  description: string;
  redirectUrl: string;
  webhookUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<{ id: string; checkoutUrl: string; status: string }> {
  const mollie = client();
  const payment = (await mollie.payments.create({
    amount: { value: params.amountValue, currency: params.currency },
    description: params.description,
    redirectUrl: params.redirectUrl,
    webhookUrl: params.webhookUrl,
    metadata: params.metadata ?? {},
  })) as unknown as MolliePayment;

  const id = String(payment?.id ?? "").trim();
  const checkoutUrl = mollieCheckoutUrl(payment);
  if (!id) throw new Error("Réponse Mollie sans identifiant de paiement");
  if (!checkoutUrl) throw new Error("Réponse Mollie sans URL de paiement");
  return { id, checkoutUrl, status: String(payment.status ?? "open") };
}

export async function mollieGetPayment(paymentId: string): Promise<MolliePayment> {
  const id = String(paymentId ?? "").trim();
  if (!id) throw new Error("Identifiant de paiement Mollie manquant");
  return (await client().payments.get(id)) as unknown as MolliePayment;
}

/** Annulation « meilleur effort » (un paiement déjà payé ne peut pas être annulé). */
export async function mollieCancelPayment(paymentId: string): Promise<void> {
  const id = String(paymentId ?? "").trim();
  if (!id) return;
  try {
    await client().payments.cancel(id);
  } catch {
    // ignoré
  }
}
